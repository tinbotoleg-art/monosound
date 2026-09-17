import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        // Мы уже держим свой public/manifest.webmanifest — плагину нужно
        // только сгенерировать и правильно закэшировать service worker.
        manifest: false,
        injectRegister: false, // регистрируем сами в main.tsx (виднее, когда именно)
        registerType: 'autoUpdate',
        includeAssets: ['icons/favicon.png', 'icons/apple-touch-icon.png'],
        // Позволяет проверять офлайн-режим прямо в `vite dev`, не только
        // после `vite build` + `vite preview`.
        devOptions: {
          enabled: true,
          type: 'module',
        },
        workbox: {
          // Прекэш всех файлов реальной сборки (с их хэшированными
          // именами) — именно этого не хватало в ручном service worker,
          // из-за чего оболочка приложения иногда не загружалась офлайн.
          globPatterns: ['**/*.{js,css,html,svg,png,ico,webmanifest}'],
          navigateFallback: '/index.html',
          runtimeCaching: [
            {
              // Список треков из Supabase (public.tracks через PostgREST).
              // NetworkFirst: если сеть есть — берём свежие данные и
              // обновляем кэш; если сети нет — за секунды откатываемся
              // на последний успешный ответ вместо пустого списка.
              urlPattern: ({ url }) =>
                url.hostname.endsWith('.supabase.co') && url.pathname.startsWith('/rest/v1/tracks'),
              handler: 'NetworkFirst',
              options: {
                cacheName: 'monosound-tracks-api',
                networkTimeoutSeconds: 4,
                expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 7 },
                cacheableResponse: { statuses: [0, 200] },
              },
            },
            {
              // Обложки треков — редко меняются, безопасно кэшировать надолго.
              urlPattern: ({ url }) =>
                url.hostname.endsWith('.supabase.co') && url.pathname.includes('/storage/v1/object/public/'),
              handler: 'CacheFirst',
              options: {
                cacheName: 'monosound-storage',
                expiration: { maxEntries: 300, maxAgeSeconds: 60 * 60 * 24 * 30 },
                cacheableResponse: { statuses: [0, 200] },
              },
            },
          ],
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify — file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
