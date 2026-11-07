import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  worker: {
    format: 'es'
  },
  server: {
    port: 5173,
  allowedHosts: ['.trycloudflare.com'],
    proxy: {
      '/uploads': { target: 'https://localhost:7151', changeOrigin: true, secure: false },
      '/api': {
        target: 'https://localhost:7151', 
        changeOrigin: true,
        secure: false 
      }
    }
  },
  // For local PWA preview only: proxy API to the development backend.
  preview: {
    port: 4173,
    allowedHosts: ['.trycloudflare.com'],
    proxy: {
      '/uploads': { target: 'https://localhost:7151', changeOrigin: true, secure: false },
      '/api': { target: 'https://localhost:7151', changeOrigin: true, secure: false },
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      manifest: {
        name: 'Du Lịch Thông Minh Huế',
        short_name: 'HueTourism',
        description: 'Bản đồ du lịch và hướng dẫn thuyết minh tự động Huế (Offline-First)',
        theme_color: '#8b0000',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: '/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2,geojson}'],
        maximumFileSizeToCacheInBytes: 15 * 1024 * 1024,
        runtimeCaching: [
          // 1. API Cache (NetworkFirst, 8s timeout) - Lớp 1 phòng ngự
          {
            urlPattern: /\/api\/v1\/pois(?:\/|\?|$)/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'poi-load-all-cache',
              networkTimeoutSeconds: 8,
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 15 * 60 // 15 phút
              }
            }
          },
          // 2. Audio Cache (CacheFirst) - Hỗ trợ phát audio offline
          {
            urlPattern: /\/static\/audio\/.*\.mp3/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'audio-cache-lang',
              expiration: {
                maxEntries: 300,
                purgeOnQuotaError: true // Tự dọn dẹp khi đầy bộ nhớ
              }
            }
          },
          // 3. Ảnh upload qua Backend: cache ảnh đã truy cập để dùng Offline
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/uploads/pois/'),
            handler: 'CacheFirst',
            options: { cacheName: 'huego-poi-uploaded-images-v1', expiration: { maxEntries: 80, maxAgeSeconds: 30 * 24 * 60 * 60, purgeOnQuotaError: true } }
          },
          // 4. Ảnh di tích/ẩm thực (CacheFirst)
          {
            urlPattern: /\/static\/poi-images\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'poi-images-cache',
              expiration: {
                maxEntries: 150,
                maxAgeSeconds: 30 * 24 * 60 * 60, // 30 ngày
                purgeOnQuotaError: true
              }
            }
          }
        ]
      }
    })
  ]
});