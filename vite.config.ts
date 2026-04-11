import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['vite.svg'],
      manifest: {
        name: 'Kafe Tracker',
        short_name: 'KafeLog',
        description: 'Track daily kafes with the cohort',
        theme_color: '#f59e0b', 
        background_color: '#ffffff',
        display: 'standalone'
      },
      workbox: {
        // NEW: These force the master Service Worker to take over immediately
        clientsClaim: true,
        skipWaiting: true,
        importScripts: ['/push-sw.js']
      }
    })
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})