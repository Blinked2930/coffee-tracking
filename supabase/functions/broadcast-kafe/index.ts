import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import webpush from 'npm:web-push'

serve(async (req) => {
  try {
    const payload = await req.json()
    const newKafe = payload.record

    // Check both variable names to ensure it finds the key
    const publicKey = Deno.env.get('VITE_VAPID_PUBLIC_KEY') || Deno.env.get('VAPID_PUBLIC_KEY') || ''
    const privateKey = Deno.env.get('VAPID_PRIVATE_KEY') || ''

    webpush.setVapidDetails('mailto:admin@kafe.app', publicKey, privateKey)

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('name')
      .eq('id', newKafe.user_id)
      .single()

    const userName = userData?.name || 'Someone'

    // Fetch all subscriptions EXCEPT the person who just logged the coffee
    const { data: subscriptions, error } = await supabaseAdmin
      .from('push_subscriptions')
      .select('subscription')
      .neq('user_id', newKafe.user_id)

    if (error) throw error
    if (!subscriptions || subscriptions.length === 0) {
      return new Response(JSON.stringify({ success: true, notified: 0 }), { status: 200 })
    }

    const notificationPayload = JSON.stringify({
      title: 'New Kafe Alert! ☕️',
      body: `${userName} logged a ${(newKafe.type || 'kafe').replace(/_/g, ' ')}!`,
      icon: '/vite.svg',
      image: newKafe.photo_url ? newKafe.photo_url : undefined,
      vibrate: [200, 100, 200],
      data: { url: 'https://kafe.emmettfrett.com/' }
    })

    const sendPromises = subscriptions.map((sub: any) => {
      // Ensure it is parsed as a JSON object, not a string
      const subObject = typeof sub.subscription === 'string' ? JSON.parse(sub.subscription) : sub.subscription
      return webpush.sendNotification(subObject, notificationPayload)
        .catch(err => console.error('Push failed for a user:', err))
    })

    await Promise.all(sendPromises)

    return new Response(JSON.stringify({ success: true, notified: subscriptions.length }), { 
      headers: { 'Content-Type': 'application/json' } 
    })

  } catch (err: any) {
    console.error("Webhook Error:", err.message)
    return new Response(JSON.stringify({ error: err.message }), { status: 500 })
  }
})