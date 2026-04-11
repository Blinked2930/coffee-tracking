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

    // 1. SNIPER MODE: Find exactly your user ID first
    const { data: emmettData, error: emmettError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('name', 'Emmett')
      .single()

    if (emmettError || !emmettData) throw new Error("Could not find test user.")

    // 2. Fetch ONLY your specific push subscription
    const { data: subscriptions, error } = await supabaseAdmin
      .from('push_subscriptions')
      .select('subscription')
      .eq('user_id', emmettData.id)

    if (error) throw error
    if (!subscriptions || subscriptions.length === 0) {
      return new Response("No subscriptions found for test user", { status: 200 })
    }

    // 3. The "Classically Emmett" Payload
    const notificationPayload = JSON.stringify({
      title: 'Wake up! ☀️',
      body: 'Isn\'t it a freaking awesome day for a coffee??? Go log one!',
      icon: '/vite.svg',
      vibrate: [200, 100, 200],
      data: { 
        url: 'https://kafe.emmettfrett.com/' 
      }
    })

    // 4. Blast it out (ONLY to Emmett)
    const sendPromises = subscriptions.map((sub: any) => 
      webpush.sendNotification(sub.subscription, notificationPayload)
        .catch(err => console.error('Push failed:', err))
    )

    await Promise.all(sendPromises)

    return new Response(JSON.stringify({ success: true, notified: subscriptions.length }), { 
      headers: { 'Content-Type': 'application/json' } 
    })

  } catch (err: any) {
    console.error("Cron Error:", err.message)
    return new Response(JSON.stringify({ error: err.message }), { status: 500 })
  }
})