import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { LanguageProvider } from './contexts/LanguageContext'
import { registerSW } from 'virtual:pwa-register'

// Register the PWA service worker with auto-update
registerSW({
  immediate: true, // Forces the check immediately on load
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