import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import webpush from 'npm:web-push'

serve(async (req) => {
  try {
    // 1. Get the newly inserted kafe from the database webhook
    const payload = await req.json()
    const newKafe = payload.record

    // 2. Configure web-push with your VAPID keys
    webpush.setVapidDetails(
      'mailto:test@example.com', // You can leave this as a dummy email
      Deno.env.get('VAPID_PUBLIC_KEY')!,
      Deno.env.get('VAPID_PRIVATE_KEY')!
    )

    // 3. Initialize Supabase Admin client to bypass Row Level Security
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 4. Fetch all subscriptions EXCEPT the person who just logged the coffee
    const { data: subscriptions, error } = await supabaseAdmin
      .from('push_subscriptions')
      .select('subscription')
      .neq('user_id', newKafe.user_id)

    if (error) throw error

    // 5. Construct the notification
    const notificationPayload = JSON.stringify({
      title: 'New Kafe Alert! ☕️',
      body: `A new ${newKafe.type || 'kafe'} was just logged in the cohort!`,
      icon: '/vite.svg',
      vibrate: [200, 100, 200]
    })

    // 6. Blast the message out to Apple/Google push servers
    const sendPromises = subscriptions.map((sub: any) => 
      webpush.sendNotification(sub.subscription, notificationPayload)
        .catch(err => console.error('Push failed for a user (they may have unsubscribed):', err))
    )

    await Promise.all(sendPromises)

    return new Response(JSON.stringify({ success: true, notified: subscriptions.length }), { 
      headers: { 'Content-Type': 'application/json' } 
    })

  } catch (err: any) {
    console.error("Webhook Error:", err.message)
    return new Response(JSON.stringify({ error: err.message }), { status: 500 })
  }
})