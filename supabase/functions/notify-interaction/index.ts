import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import webpush from 'npm:web-push'

serve(async (req) => {
  try {
    const payload = await req.json();
    
    // Supabase Webhooks send the table name and the newly inserted record
    const { table, record } = payload;

    // Safety check
    if (!record || !record.kafe_id || !record.user_id) {
      return new Response("Invalid payload", { status: 400 });
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 1. Find out who owns the post that was just commented/reacted on
    const { data: kafeData } = await supabaseAdmin
      .from('kafes')
      .select('user_id')
      .eq('id', record.kafe_id)
      .single();

    if (!kafeData) return new Response("Kafe not found", { status: 404 });

    const postOwnerId = kafeData.user_id;

    // 2. Prevent the user from getting a notification if they comment on their own post
    if (postOwnerId === record.user_id) {
      return new Response("Self-interaction, ignored", { status: 200 });
    }

    // 3. Get the first name of the person who just did the action
    const { data: actorData } = await supabaseAdmin
      .from('users')
      .select('name')
      .eq('id', record.user_id)
      .single();

    const actorName = actorData?.name?.split(' ')[0] || 'Someone';

    // 4. Get the push subscriptions for the POST OWNER
    const { data: subscriptions } = await supabaseAdmin
      .from('push_subscriptions')
      .select('subscription')
      .eq('user_id', postOwnerId);

    if (!subscriptions || subscriptions.length === 0) {
      return new Response("User has no active subscriptions", { status: 200 });
    }

    // 5. Construct the specific notification text based on the table
    let title = '';
    let body = '';

    if (table === 'comments') {
      title = `💬 ${actorName} commented on your Kafe!`;
      // Show the actual comment text in the notification, fallback if missing
      body = record.content || 'Tap to see what they said.';
    } else if (table === 'reactions' || table === 'reacts') { 
      // Note: Assuming your table is called 'reactions' or 'reacts'
      const emoji = record.emoji || record.type || 'reacted to';
      title = `✨ New Reaction!`;
      body = `${actorName} ${emoji} your Kafe.`;
    } else {
      return new Response("Unsupported table", { status: 200 });
    }

    const notificationPayload = JSON.stringify({
      title,
      body,
      icon: '/vite.svg',
      vibrate: [100, 50, 100],
      data: { url: `https://kafe.emmettfrett.com/` } 
    });

    // 6. Setup web-push with your existing keys
    const publicKey = Deno.env.get('VITE_VAPID_PUBLIC_KEY') || Deno.env.get('VAPID_PUBLIC_KEY') || '';
    const privateKey = Deno.env.get('VAPID_PRIVATE_KEY') || '';
    webpush.setVapidDetails('mailto:admin@kafe.app', publicKey, privateKey);

    // 7. Fire off the notifications to all of the owner's devices
    const sendPromises = subscriptions.map((sub: any) => {
      const subObject = typeof sub.subscription === 'string' ? JSON.parse(sub.subscription) : sub.subscription;
      return webpush.sendNotification(subObject, notificationPayload)
        .catch(err => console.error('Push failed for user:', err));
    });

    await Promise.all(sendPromises);

    return new Response(JSON.stringify({ success: true, notifiedCount: subscriptions.length }), { headers: { 'Content-Type': 'application/json' } });

  } catch (err: any) {
    console.error("Webhook Error:", err.message);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});