import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import webpush from 'npm:web-push'

serve(async (req) => {
  console.log("[TRACE 1] Webhook woke up the Edge Function!");
  try {
    const payload = await req.json();
    console.log("[TRACE 2] Payload received:", JSON.stringify(payload));
    
    const newFriendship = payload.record;

    if (newFriendship.status !== 'pending') {
      console.log("[TRACE 3] Exiting: Not a pending request. Status is:", newFriendship.status);
      return new Response("Not a pending request.", { status: 200 });
    }

    const publicKey = Deno.env.get('VITE_VAPID_PUBLIC_KEY') || Deno.env.get('VAPID_PUBLIC_KEY') || '';
    const privateKey = Deno.env.get('VAPID_PRIVATE_KEY') || '';
    
    if (!publicKey || !privateKey) {
      console.error("[TRACE 4] CRITICAL: VAPID keys are missing from this function's environment!");
    } else {
      console.log("[TRACE 4] VAPID keys found.");
    }

    webpush.setVapidDetails('mailto:admin@kafe.app', publicKey, privateKey);

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log("[TRACE 5] Looking up requester name for ID:", newFriendship.requester_id);
    const { data: requester } = await supabaseAdmin
      .from('users')
      .select('name')
      .eq('id', newFriendship.requester_id)
      .single();

    const requesterName = requester?.name || 'Someone';
    console.log("[TRACE 6] Requester name is:", requesterName);

    console.log("[TRACE 7] Searching for push subscription for receiver ID:", newFriendship.receiver_id);
    const { data: subs, error } = await supabaseAdmin
      .from('push_subscriptions')
      .select('subscription')
      .eq('user_id', newFriendship.receiver_id);

    if (error) {
      console.error("[TRACE 8] Error fetching subscriptions:", error);
      throw error;
    }

    if (!subs || subs.length === 0) {
      console.log("[TRACE 9] Exiting: No push subscriptions found for this specific user ID.");
      return new Response(JSON.stringify({ success: true, message: "No target sub." }), { status: 200 });
    }

    console.log(`[TRACE 10] Found ${subs.length} subscriptions. Preparing to send push.`);

    const notificationPayload = JSON.stringify({
      title: 'New Friend Request! 👋',
      body: `${requesterName} wants to connect with you.`,
      icon: '/vite.svg',
      vibrate: [200, 100, 200],
      data: { url: 'https://kafe.emmettfrett.com/' }
    });

    const sendPromises = subs.map((sub: any) => {
      const subObject = typeof sub.subscription === 'string' ? JSON.parse(sub.subscription) : sub.subscription;
      return webpush.sendNotification(subObject, notificationPayload)
        .then(() => console.log("[TRACE 11] Push sent successfully!"))
        .catch(err => console.error('[TRACE 12] Push failed at the very last step:', err));
    });

    await Promise.all(sendPromises);

    console.log("[TRACE 13] Function completed successfully.");
    return new Response(JSON.stringify({ success: true, notified: subs.length }), { headers: { 'Content-Type': 'application/json' } });

  } catch (err: any) {
    console.error("[TRACE FATAL] Function crashed:", err.message);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
})