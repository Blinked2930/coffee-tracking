import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import webpush from 'npm:web-push'

serve(async () => {
  try {
    const publicKey = Deno.env.get('VITE_VAPID_PUBLIC_KEY') || Deno.env.get('VAPID_PUBLIC_KEY') || ''
    const privateKey = Deno.env.get('VAPID_PRIVATE_KEY') || ''

    webpush.setVapidDetails('mailto:admin@kafe.app', publicKey, privateKey)

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Calculate exactly 3 days ago
    const timeLimitDate = new Date();
    timeLimitDate.setDate(timeLimitDate.getDate() - 3);
    const timeLimit = timeLimitDate.toISOString();

    const { data: recentKafes, error: kafeError } = await supabaseAdmin
      .from('kafes')
      .select('user_id')
      .gte('created_at', timeLimit)

    if (kafeError) throw kafeError

    const activeUserIds = new Set(recentKafes?.map(k => k.user_id) || [])

    const { data: allSubscriptions, error: subError } = await supabaseAdmin
      .from('push_subscriptions')
      .select('user_id, subscription')

    if (subError) throw subError
    if (!allSubscriptions || allSubscriptions.length === 0) {
      return new Response("No subscriptions found", { status: 200 })
    }

    const slackers = allSubscriptions.filter(sub => !activeUserIds.has(sub.user_id))

    if (slackers.length === 0) {
      return new Response("Everyone is up to date! No reminders needed.", { status: 200 })
    }

    const notificationPayload = JSON.stringify({
      title: 'Wake up! ☀️',
      body: 'Isn\'t it a freaking awesome day for a coffee??? Go log one!',
      icon: '/vite.svg',
      vibrate: [200, 100, 200],
      data: { url: 'https://kafe.emmettfrett.com/' }
    })

    const sendPromises = slackers.map((sub: any) => {
      // Ensure it is parsed as a JSON object
      const subObject = typeof sub.subscription === 'string' ? JSON.parse(sub.subscription) : sub.subscription
      return webpush.sendNotification(subObject, notificationPayload)
        .catch(err => console.error('Push failed for user:', err))
    })

    await Promise.all(sendPromises)

    return new Response(JSON.stringify({ 
      success: true, 
      slackersFound: slackers.length,
      notified: slackers.length 
    }), { headers: { 'Content-Type': 'application/json' } })

  } catch (err: any) {
    console.error("Cron Error:", err.message)
    return new Response(JSON.stringify({ error: err.message }), { status: 500 })
  }
})