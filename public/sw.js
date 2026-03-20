const CACHE_NAME = 'deep-game-v2';

// Instalação: força a atualização imediata do Service Worker
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// Ativação: limpa os caches antigos que causaram a tela branca
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          return caches.delete(cacheName);
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Interceptação de requisições: Estratégia Network-First (Rede primeiro)
self.addEventListener('fetch', (event) => {
  // Ignora requisições que não sejam GET (como POST de formulários/APIs)
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Se a rede funcionar, salva uma cópia no cache para uso offline
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          // Evita fazer cache de extensões do chrome ou requisições inválidas
          if (event.request.url.startsWith('http')) {
            cache.put(event.request, responseClone);
          }
        });
        return response;
      })
      .catch(() => {
        // Se a rede falhar (offline), busca no cache
        return caches.match(event.request);
      })
  );
});
