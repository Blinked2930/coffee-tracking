// NEW: Force the Service Worker to update immediately when Vercel pushes new code
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Listen for the push message
self.addEventListener('push', function (event) {
  if (event.data) {
    const data = event.data.json();
    
    const options = {
      body: data.body,
      icon: data.icon || '/vite.svg',
      image: data.image, // Supports the Hero Image
      vibrate: data.vibrate || [200, 100, 200],
      data: data.data || { url: '/' } 
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

// Handle what happens when the user taps the notification
self.addEventListener('notificationclick', function(event) {
  event.notification.close(); 
  
  const urlToOpen = event.notification.data.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(windowClients) {
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});