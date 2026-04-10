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
      'mailto:test@example.com', 
      Deno.env.get('VAPID_PUBLIC_KEY')!,
      Deno.env.get('VAPID_PRIVATE_KEY')!
    )

    // 3. Initialize Supabase Admin client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // NEW: 4. Fetch the name of the user who logged the kafe
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('name')
      .eq('id', newKafe.user_id)
      .single()

    if (userError) {
      console.error("Could not fetch user name:", userError)
    }

    // Fallback to 'Someone' just in case the name isn't found
    const userName = userData?.name || 'Someone'

    // 5. Fetch all subscriptions EXCEPT the person who just logged the coffee
    const { data: subscriptions, error } = await supabaseAdmin
      .from('push_subscriptions')
      .select('subscription')
      .neq('user_id', newKafe.user_id)

    if (error) throw error

    // UPDATED: 6. Construct the Rich Notification with the user's name!
    const notificationPayload = JSON.stringify({
      title: 'New Kafe Alert! ☕️',
      body: `${userName} logged a ${newKafe.type || 'kafe'}!`,
      icon: '/vite.svg',
      image: newKafe.photo_url ? newKafe.photo_url : undefined,
      vibrate: [200, 100, 200],
      data: { 
        // IMPORTANT: Replace this with your actual Vercel project URL!
        url: 'https://kafe.emmettfrett.com/' 
      }
    })

    // 7. Blast the message out
    const sendPromises = subscriptions.map((sub: any) => 
      webpush.sendNotification(sub.subscription, notificationPayload)
        .catch(err => console.error('Push failed for a user:', err))
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