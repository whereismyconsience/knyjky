/*
 * Folio Service Worker
 *
 * HTML, CSS, JavaScript → Network-first
 * Images, icons         → Cache-first
 * Offline               → Cached fallback
 *
 * No manual cache version updates needed.
 */

const CACHE = 'folio-shell';

const BASE = self.registration.scope;

// Application files: always check for updates
const APP_FILES = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './db.js',
  './barcode.js'
];

// Static assets: prioritize cached versions
const STATIC_FILES = [
  './manifest.webmanifest',
  './assets/icons/folio-192.png',
  './assets/icons/folio-512.png'
];

const SHELL = [...APP_FILES, ...STATIC_FILES];

const APP_PATHS = new Set(
  APP_FILES.map(path => new URL(path, BASE).pathname)
);

const STATIC_PATHS = new Set(
  STATIC_FILES.map(path => new URL(path, BASE).pathname)
);

const COVERS_PATH = new URL(
  './assets/covers/',
  BASE
).pathname;


// ========================================
// INSTALL
// ========================================

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE).then(cache =>
      cache.addAll(
        SHELL.map(path =>
          new Request(
            new URL(path, BASE).href,
            { cache: 'reload' }
          )
        )
      )
    )
  );

  self.skipWaiting();
});


// ========================================
// ACTIVATE
// ========================================

self.addEventListener('activate', event => {
  event.waitUntil((async () => {

    const keys = await caches.keys();

    await Promise.all(
      keys
        .filter(key =>
          key.startsWith('folio-shell') &&
          key !== CACHE
        )
        .map(key => caches.delete(key))
    );

    await self.clients.claim();

  })());
});


// ========================================
// FETCH
// ========================================

self.addEventListener('fetch', event => {

  const request = event.request;

  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Only handle Folio resources
  if (url.origin !== self.location.origin) return;

  if (!url.pathname.startsWith(
    new URL(BASE).pathname
  )) return;

  const isApp =
    request.mode === 'navigate' ||
    APP_PATHS.has(url.pathname);

  const isStatic =
    STATIC_PATHS.has(url.pathname) ||
    url.pathname.startsWith(COVERS_PATH);

  // Leave API requests and other resources alone
  if (!isApp && !isStatic) return;

  event.respondWith((async () => {

    const cache = await caches.open(CACHE);

    // ------------------------------------
    // NETWORK-FIRST: HTML, CSS, JavaScript
    // ------------------------------------

    if (isApp) {

      try {

        const response = await fetch(request, {
          cache: 'no-cache'
        });

        if (!response.ok) {
          const fallback = await cache.match(request, {
            ignoreSearch: true
          });

          return fallback || response;
        }

        // Update cached version automatically
        await cache.put(request, response.clone());

        return response;

      } catch (error) {

        // No internet? Use cached version
        const cached = await cache.match(request, {
          ignoreSearch: true
        });

        if (cached) return cached;

        // Offline navigation fallback
        if (request.mode === 'navigate') {
          return (
            await cache.match(
              new URL('./index.html', BASE).href
            )
          ) || Response.error();
        }

        return Response.error();
      }
    }

    // ------------------------------------
    // CACHE-FIRST: Images and static assets
    // ------------------------------------

    const cached = await cache.match(request, {
      ignoreSearch: true
    });

    if (cached) return cached;

    try {

      const response = await fetch(request);

      if (response.ok) {
        await cache.put(request, response.clone());
      }

      return response;

    } catch (error) {

      return Response.error();

    }

  })());

});
