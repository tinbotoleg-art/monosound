// Минимальный service worker.
// Его основная задача — сделать сайт "устанавливаемым" (Chrome на Android
// требует активный SW, чтобы показать промпт установки / пункт "Добавить
// на главный экран"). Заодно кэширует статическую оболочку приложения для
// быстрого повторного открытия.

const CACHE_NAME = 'monosound-shell-v1';
const SHELL_URLS = ['/', '/index.html', '/manifest.webmanifest'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_URLS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Стратегия: сначала сеть (чтобы не залипать на старой версии), при
// отсутствии сети — то, что есть в кэше. Аудио/API-запросы не трогаем.
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return; // не кэшируем Supabase/CDN и т.п.

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
