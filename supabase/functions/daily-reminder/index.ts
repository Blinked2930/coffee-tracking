import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import webpush from 'npm:web-push'

serve(async () => {
  try {
    webpush.setVapidDetails(
      'mailto:test@example.com', 
      Deno.env.get('VAPID_PUBLIC_KEY')!,
      Deno.env.get('VAPID_PRIVATE_KEY')!
    )

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 1. Calculate exactly 3 days (72 hours) ago
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    const timeLimit = threeDaysAgo.toISOString();

    // 2. Get everyone who HAS logged a kafe in the last 3 days
    const { data: recentKafes, error: kafeError } = await supabaseAdmin
      .from('kafes')
      .select('user_id')
      .gte('created_at', timeLimit)

    if (kafeError) throw kafeError

    // Create a quick lookup list of the IDs of people who are active
    const activeUserIds = new Set(recentKafes?.map(k => k.user_id) || [])

    // 3. Fetch ALL push subscriptions
    const { data: allSubscriptions, error: subError } = await supabaseAdmin
      .from('push_subscriptions')
      .select('user_id, subscription')

    if (subError) throw subError
    if (!allSubscriptions || allSubscriptions.length === 0) {
      return new Response("No subscriptions found", { status: 200 })
    }

    // 4. THE FILTER: Only keep subscriptions for people who are NOT in the active list
    const slackers = allSubscriptions.filter(sub => !activeUserIds.has(sub.user_id))

    if (slackers.length === 0) {
      return new Response("Everyone is up to date! No reminders needed.", { status: 200 })
    }

    // --- SNIPER MODE: Safely test it on just you first ---
    // (We will remove this block after your 3-day test succeeds)
    const { data: emmettData } = await supabaseAdmin.from('users').select('id').eq('name', 'Emmett').single()
    const targetAudience = slackers.filter(sub => sub.user_id === emmettData?.id)
    // -----------------------------------------------------

    // 5. The Payload
    const notificationPayload = JSON.stringify({
      title: 'Wake up! ☀️',
      body: 'Isn\'t it a freaking awesome day for a coffee??? Go log one!',
      icon: '/vite.svg',
      vibrate: [200, 100, 200],
      data: { 
        url: 'https://kafe.emmettfrett.com/' 
      }
    })

    // 6. Blast it out ONLY to the target audience
    const sendPromises = targetAudience.map((sub: any) => 
      webpush.sendNotification(sub.subscription, notificationPayload)
        .catch(err => console.error('Push failed for user:', err))
    )

    await Promise.all(sendPromises)

    return new Response(JSON.stringify({ 
      success: true, 
      slackersFound: slackers.length,
      notified: targetAudience.length 
    }), { headers: { 'Content-Type': 'application/json' } })

  } catch (err: any) {
    console.error("Cron Error:", err.message)
    return new Response(JSON.stringify({ error: err.message }), { status: 500 })
  }
})