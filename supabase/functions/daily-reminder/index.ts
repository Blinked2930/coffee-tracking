import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import webpush from 'npm:web-push'

serve(async (req) => {
  try {
    // 1. Setup Web Push with your keys
    webpush.setVapidDetails(
      'mailto:test@example.com', 
      Deno.env.get('VAPID_PUBLIC_KEY')!,
      Deno.env.get('VAPID_PRIVATE_KEY')!
    )

    // 2. Initialize Supabase Admin client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 3. Calculate the exact timestamp for 3 days ago
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    // 4. Find out who HAS logged a kafe in the last 3 days
    const { data: recentKafes, error: kafeError } = await supabaseAdmin
      .from('kafes')
      .select('user_id')
      .gte('created_at', threeDaysAgo.toISOString())

    if (kafeError) throw kafeError;

    // Create a unique list (a Set) of the active users so it's easy to check against
    const activeUserIds = new Set(recentKafes.map((k: any) => k.user_id));

    // 5. Get ALL push subscriptions in the database
    const { data: subscriptions, error: subError } = await supabaseAdmin
      .from('push_subscriptions')
      .select('user_id, subscription')

    if (subError) throw subError;

    // 6. Filter down to ONLY the people who are slacking
    const slackingUsers = subscriptions.filter((sub: any) => !activeUserIds.has(sub.user_id));

    if (slackingUsers.length === 0) {
      return new Response(JSON.stringify({ message: "Everyone is highly caffeinated. No nudges needed today!" }), { 
        headers: { 'Content-Type': 'application/json' } 
      });
    }

    // 7. Construct the "Classically Emmett" Notification
    const notificationPayload = JSON.stringify({
      title: 'Emmett here... 👋',
      body: "Isn't it a freaking awesome day for a coffee??? Get out there and log a Kafe!",
      icon: '/vite.svg',
      vibrate: [200, 100, 200],
      data: { 
        // IMPORTANT: Replace this with your actual Vercel project URL!
        url: 'http://kafe.emmettfrett.com/' 
      }
    });

    // 8. Blast the nudges out
    const sendPromises = slackingUsers.map((sub: any) => 
      webpush.sendNotification(sub.subscription, notificationPayload)
        .catch(err => console.error('Push failed for a user:', err))
    )

    await Promise.all(sendPromises);

    return new Response(JSON.stringify({ success: true, nudgedCount: slackingUsers.length }), { 
      headers: { 'Content-Type': 'application/json' } 
    })

  } catch (err: any) {
    console.error("Cron Error:", err.message)
    return new Response(JSON.stringify({ error: err.message }), { status: 500 })
  }
})