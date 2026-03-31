import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['vite.svg'], // Add any other static assets like favicons here
      manifest: {
        name: 'Kafe Tracker',
        short_name: 'KafeLog',
        description: 'Track daily kafes with the cohort',
        theme_color: '#f59e0b', // Matches the amber-500 from your UI
        background_color: '#ffffff',
        display: 'standalone', // This hides the browser URL bar when installed
        icons: [
          {
            src: 'pwa-192x192.png', // You will need to add these image files to your public folder later
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable' // Helps Android scale the icon perfectly
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})