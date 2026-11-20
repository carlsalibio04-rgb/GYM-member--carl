import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
    plugins: [
        react(),

        VitePWA({
            // Automatically activate the updated service worker.
            registerType: 'autoUpdate',

            // vite-plugin-pwa generates the manifest and service worker.
            // Do not add a second, manually registered service worker.
            manifest: {
                id: '/',
                name: 'Gym Membership System',
                short_name: 'Gym System',
                description: 'Gym Membership and Payment Management System',
                lang: 'en',
                start_url: '/',
                scope: '/',
                display: 'standalone',
                orientation: 'portrait',
                background_color: '#ffffff',
                theme_color: '#111827',
                categories: ['health', 'fitness', 'productivity'],
                icons: [
                    {
                        src: '/pwa-192x192.png',
                        sizes: '192x192',
                        type: 'image/png',
                        purpose: 'any'
                    },
                    {
                        src: '/pwa-512x512.png',
                        sizes: '512x512',
                        type: 'image/png',
                        purpose: 'any'
                    }
                ]
            },

            // Pre-cache the built app shell and its static assets.
            // React Router routes fall back to index.html when offline.
            workbox: {
                globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff,woff2}'],
                navigateFallback: '/index.html',
                cleanupOutdatedCaches: true,
                clientsClaim: true,
                skipWaiting: true
            }
        })
    ]
})
