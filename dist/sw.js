// Simple Service Worker for caching
const CACHE_NAME = 'bugsnap-v1';
const urlsToCache = [
  '/',
  '/static/css/main.css',
  '/static/js/main.js',
  '/favicon.svg',
  '/apple-touch-icon.svg'
];

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', function(event) {
  // Skip service worker for all localhost requests to avoid interference
  if (event.request.url.includes('localhost') || 
      event.request.url.includes('127.0.0.1') ||
      event.request.url.includes('/dashboard') ||
      event.request.url.includes('/api/') ||
      event.request.url.includes('.ico') ||
      event.request.url.includes('.js') ||
      event.request.url.includes('.css')) {
    return; // Let the request go through normally without service worker
  }
  
  // Only cache non-localhost static resources
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
      .catch(function(error) {
        // Fallback for network errors
        return fetch(event.request);
      })
  );
});