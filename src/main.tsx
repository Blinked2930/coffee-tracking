import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { LanguageProvider } from './contexts/LanguageContext'
import { registerSW } from 'virtual:pwa-register'

<<<<<<< Updated upstream
// Register the PWA service worker
const updateSW = registerSW({
  onNeedRefresh() {
    // When you push new code to Vercel, this prompts the user's phone to grab the new version
    if (confirm('A new update is available! Reload to apply?')) {
      updateSW(true)
    }
=======
// NEW: Force the browser to refresh the screen when a new Service Worker takes over
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    window.location.reload();
  });
}

// Register the PWA service worker with auto-update
registerSW({
  immediate: true, 
  onRegistered(r) {
    // NEW: Force the app to check Vercel for updates every time it is opened
    r && r.update();
>>>>>>> Stashed changes
  },
  onOfflineReady() {
    console.log('App is ready to work offline!')
  },
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <LanguageProvider>
      <App />
    </LanguageProvider>
  </React.StrictMode>,
)