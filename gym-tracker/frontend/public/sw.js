
const CACHE_NAME = "gym-membership-v2";

const PRECACHE_URLS = [
  "/",
  "/index.html",
  "/manifest.json",
  "/pwa-192x192.png",
  "/pwa-512x512.png",
];

self.addEventListener("install", (event) => {
  console.log("Service Worker: Installing...");

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.all(
        PRECACHE_URLS.map((url) =>
          cache.add(url).catch((err) => {
            console.warn("Failed to cache:", url, err);
          })
        )
      );
    })
  );

  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  console.log("Service Worker: Activated...");

  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    )
  );

  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== "GET") return;

  // Huwag i-cache ang API requests.
  if (url.pathname.startsWith("/api/")) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) =>
              cache.put("/index.html", copy)
            );
          }
          return response;
        })
        .catch(() => caches.match("/index.html"))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const networkFetch = fetch(request)
        .then((response) => {
          if (
            response &&
            (response.ok || response.type === "opaque")
          ) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) =>
              cache.put(request, copy)
            );
          }
          return response;
        })
        .catch(() => cachedResponse);

      return cachedResponse || networkFetch;
    })
  );
});
