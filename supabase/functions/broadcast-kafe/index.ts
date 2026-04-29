import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import webpush from 'npm:web-push'

serve(async (req) => {
  try {
    const payload = await req.json();
    const newKafe = payload.record;

    const publicKey = Deno.env.get('VITE_VAPID_PUBLIC_KEY') || Deno.env.get('VAPID_PUBLIC_KEY') || '';
    const privateKey = Deno.env.get('VAPID_PRIVATE_KEY') || '';

    if (!publicKey || !privateKey) {
      console.error("CRITICAL: VAPID keys are missing from this function's environment!");
    }

    webpush.setVapidDetails('mailto:admin@kafe.app', publicKey, privateKey);

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 1. Get the name of the person who logged it
    const { data: logger } = await supabaseAdmin
      .from('users')
      .select('name')
      .eq('id', newKafe.user_id)
      .single();

    const loggerName = logger?.name || 'Someone';

    // 2. Query the network: Find ONLY accepted friendships involving this user
    const { data: friendships, error: friendError } = await supabaseAdmin
      .from('friendships')
      .select('requester_id, receiver_id')
      .eq('status', 'accepted')
      .or(`requester_id.eq.${newKafe.user_id},receiver_id.eq.${newKafe.user_id}`);

    if (friendError) {
      console.error("Error fetching friendships:", friendError);
      throw friendError;
    }

    if (!friendships || friendships.length === 0) {
      console.log("User has no active network. Exiting silently.");
      return new Response(JSON.stringify({ success: true, message: "No friends to notify." }), { status: 200 });
    }

    // 3. Extract just the IDs of the friends (filtering out the logger's own ID)
    const friendIds = friendships.map(f => 
      f.requester_id === newKafe.user_id ? f.receiver_id : f.requester_id
    );

    // 4. Get push subscriptions ONLY for those specific friend IDs
    const { data: subs, error: subError } = await supabaseAdmin
      .from('push_subscriptions')
      .select('subscription')
      .in('user_id', friendIds);

    if (subError) {
      console.error("Error fetching subscriptions:", subError);
      throw subError;
    }

    if (!subs || subs.length === 0) {
      console.log("Network found, but no active push subscriptions detected.");
      return new Response(JSON.stringify({ success: true, message: "No target subs." }), { status: 200 });
    }

    console.log(`[AUTHORIZED] Sending broadcast to ${subs.length} network members...`);

    const notificationPayload = JSON.stringify({
      title: 'New Kafe Alert! ☕️',
      body: `${loggerName} logged a ${newKafe.type}!`,
      icon: '/vite.svg',
      vibrate: [200, 100, 200],
      data: { url: 'https://kafe.emmettfrett.com/' }
    });

    const sendPromises = subs.map((sub: any) => {
      const subObject = typeof sub.subscription === 'string' ? JSON.parse(sub.subscription) : sub.subscription;
      return webpush.sendNotification(subObject, notificationPayload).catch(err => console.error('Push failed:', err));
    });

    await Promise.all(sendPromises);

    return new Response(JSON.stringify({ success: true, notified: subs.length }), { headers: { 'Content-Type': 'application/json' } });

  } catch (err: any) {
    console.error("Function crashed:", err.message);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
})