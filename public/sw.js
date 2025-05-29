const CACHE_NAME = 'wishlist-v2.2.0-cache-fix';
const STATIC_CACHE_NAME = 'wishlist-static-v2.2.0-cache-fix';
const DYNAMIC_CACHE_NAME = 'wishlist-dynamic-v2.2.0-cache-fix';

// Ресурсы для кэширования при установке
const STATIC_ASSETS = [
  '/wishlist-checker/',
  '/wishlist-checker/index.html',
  '/wishlist-checker/manifest.json',
  '/wishlist-checker/icons/wishlist-icon.svg',
  '/wishlist-checker/icons/icon-192x192.png',
  '/wishlist-checker/icons/icon-512x512.png'
];

// Установка Service Worker
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .catch((error) => {
        console.error('[SW] Error caching static assets:', error);
      })
  );
  
  // Принудительная активация
  self.skipWaiting();
});

// Активация Service Worker
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            // Удаляем старые кэши
            if (cacheName !== STATIC_CACHE_NAME && cacheName !== DYNAMIC_CACHE_NAME) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        // 🚨 КРИТИЧЕСКИ ВАЖНО: Принудительно очищаем все кэши с Supabase данными
        console.log('[SW] SECURITY FIX: Clearing all Supabase caches...');
        return caches.keys().then(cacheNames => {
          return Promise.all(
            cacheNames.map(cacheName => {
              return caches.open(cacheName).then(cache => {
                return cache.keys().then(requests => {
                  return Promise.all(
                    requests.map(request => {
                      if (request.url.includes('supabase.co')) {
                        console.log('[SW] SECURITY FIX: Deleting Supabase cache entry:', request.url);
                        return cache.delete(request);
                      }
                    })
                  );
                });
              });
            })
          );
        });
      })
      .then(() => {
        console.log('[SW] Service Worker activated');
        // Берем контроль над всеми клиентами
        return self.clients.claim();
      })
  );
});

// Перехват запросов (основная логика offline работы)
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Игнорируем не-GET запросы и chrome-extension
  if (request.method !== 'GET' || url.protocol === 'chrome-extension:') {
    return;
  }
  
  // 🚨 КРИТИЧЕСКИ ВАЖНО: НЕ кэшируем Supabase API запросы!
  // Это предотвращает утечку данных между пользователями
  if (url.hostname.includes('supabase.co')) {
    console.log('[SW] NEVER CACHE: Supabase API request:', request.url);
    event.respondWith(fetch(request));
    return;
  }
  
  // Стратегия кэширования: Cache First для статических ресурсов
  if (STATIC_ASSETS.some(asset => url.pathname.endsWith(asset.split('/').pop()))) {
    event.respondWith(
      caches.match(request)
        .then((cachedResponse) => {
          if (cachedResponse) {
            console.log('[SW] Serving from cache:', request.url);
            return cachedResponse;
          }
          
          // Если нет в кэше, загружаем из сети
          return fetch(request)
            .then((response) => {
              // Кэшируем только успешные ответы
              if (response.status === 200) {
                const responseClone = response.clone();
                caches.open(STATIC_CACHE_NAME)
                  .then((cache) => {
                    cache.put(request, responseClone);
                  });
              }
              return response;
            })
            .catch(() => {
              // Если офлайн и нет в кэше, возвращаем fallback
              if (request.destination === 'document') {
                return caches.match('/wishlist-checker/index.html');
              }
            });
        })
    );
    return;
  }
  
  // Стратегия Network First для динамического контента
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Кэшируем успешные ответы
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(DYNAMIC_CACHE_NAME)
            .then((cache) => {
              cache.put(request, responseClone);
            });
        }
        return response;
      })
      .catch(() => {
        // Если сеть недоступна, пробуем кэш
        return caches.match(request)
          .then((cachedResponse) => {
            if (cachedResponse) {
              console.log('[SW] Serving from dynamic cache (offline):', request.url);
              return cachedResponse;
            }
            
            // Для HTML страниц возвращаем index.html
            if (request.destination === 'document') {
              return caches.match('/wishlist-checker/index.html');
            }
            
            // Для остальных ресурсов возвращаем ошибку
            return new Response('Offline - resource not available', {
              status: 503,
              statusText: 'Service Unavailable'
            });
          });
      })
  );
});

// Обработка сообщений от клиента (для принудительного обновления)
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') {
    console.log('[SW] Received SKIP_WAITING message');
    self.skipWaiting();
  }
  
  if (event.data === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
});

// Синхронизация в фоне (для будущих возможностей)
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // Здесь можно добавить логику синхронизации данных
      Promise.resolve()
    );
  }
});

// Уведомления Push (для будущих возможностей)
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');
  
  const options = {
    body: event.data ? event.data.text() : 'Wishlist обновлен!',
    icon: '/wishlist-checker/icons/icon-192x192.png',
    badge: '/wishlist-checker/icons/icon-192x192.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    }
  };
  
  event.waitUntil(
    self.registration.showNotification('Wishlist', options)
  );
});

console.log('[SW] Service Worker script loaded'); 