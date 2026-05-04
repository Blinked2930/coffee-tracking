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

    // 1. Fetch active users
    const { data: recentKafes, error: kafeError } = await supabaseAdmin
      .from('kafes')
      .select('user_id')
      .gte('created_at', timeLimit)
      .limit(10000)

    if (kafeError) throw kafeError

    const activeUserIds = new Set(recentKafes?.map(k => k.user_id) || [])

    // 2. Fetch subscriptions
    const { data: allSubscriptions, error: subError } = await supabaseAdmin
      .from('push_subscriptions')
      .select('user_id, subscription')

    if (subError) throw subError
    if (!allSubscriptions || allSubscriptions.length === 0) {
      return new Response("No subscriptions found", { status: 200 })
    }

    // 3. Fetch user names to personalize the notifications
    const { data: usersData, error: usersError } = await supabaseAdmin
      .from('users')
      .select('id, name')
      
    if (usersError) throw usersError
    
    // Create a dictionary of user_id -> name for quick lookup
    const userMap = new Map(usersData?.map(u => [u.id, u.name]) || [])

    const parsedSubscriptions = allSubscriptions.map(sub => {
      const subObject = typeof sub.subscription === 'string' ? JSON.parse(sub.subscription) : sub.subscription;
      return { user_id: sub.user_id, subObject };
    });

    const activeEndpoints = new Set();
    parsedSubscriptions.forEach(({ user_id, subObject }) => {
      if (activeUserIds.has(user_id) && subObject?.endpoint) {
        activeEndpoints.add(subObject.endpoint);
      }
    });

    const slackersToSend = [];
    const endpointsNotified = new Set();

    parsedSubscriptions.forEach(({ user_id, subObject }) => {
      if (!activeUserIds.has(user_id) && subObject?.endpoint) {
        if (activeEndpoints.has(subObject.endpoint)) return;
        if (endpointsNotified.has(subObject.endpoint)) return;

        endpointsNotified.add(subObject.endpoint);
        // Push the user_id alongside the subObject so we know who to address!
        slackersToSend.push({ user_id, subObject });
      }
    });

    if (slackersToSend.length === 0) {
      return new Response("Everyone is up to date! No reminders needed.", { status: 200 })
    }

    // 4. Generate custom payloads INSIDE the loop
    const sendPromises = slackersToSend.map(({ user_id, subObject }) => {
      // Get their name, grab just their first name, default to 'Friend' if missing
      const fullName = userMap.get(user_id) || 'Friend'
      const firstName = fullName.split(' ')[0]

      const customPayload = JSON.stringify({
        title: `${firstName}! Wake up! ☀️`,
        body: 'Isn\'t it a freaking awesome day for a coffee??? Go log one!',
        icon: '/vite.svg',
        vibrate: [200, 100, 200],
        data: { url: 'https://kafe.emmettfrett.com/' }
      })

      return webpush.sendNotification(subObject, customPayload)
        .catch(err => console.error('Push failed for user:', err))
    })

    await Promise.all(sendPromises)

    return new Response(JSON.stringify({ 
      success: true, 
      slackersFound: slackersToSend.length,
      notified: slackersToSend.length 
    }), { headers: { 'Content-Type': 'application/json' } })

  } catch (err) {
    console.error("Cron Error:", err.message)
    return new Response(JSON.stringify({ error: err.message }), { status: 500 })
  }
})