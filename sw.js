const CACHE_NAME = 'familyhealth-v1';
const ASSETS = [
  'index.html',
  'manifest.json'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
});

self.addEventListener('fetch', e => {
  // Use Network-First strategy for HTML document navigation to avoid cache lockouts
  if (
    e.request.mode === 'navigate' || 
    e.request.url.endsWith('index.html') || 
    e.request.url.endsWith('app.html') ||
    e.request.url.includes('/index.html?')
  ) {
    e.respondWith(
      fetch(e.request)
        .then(response => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
          return response;
        })
        .catch(() => caches.match(e.request))
    );
  } else {
    // Cache-First strategy for static assets
    e.respondWith(
      caches.match(e.request).then(response => response || fetch(e.request))
    );
  }
});
