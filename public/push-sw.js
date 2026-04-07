// This runs in the background and listens for messages from Supabase
self.addEventListener('push', function (event) {
    if (event.data) {
      const data = event.data.json();
      
      const options = {
        body: data.body,
        icon: data.icon || '/vite.svg',
        vibrate: data.vibrate || [200, 100, 200],
      };
      
      // Tell the phone's operating system to show the notification
      event.waitUntil(
        self.registration.showNotification(data.title, options)
      );
    }
  });