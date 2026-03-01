const CACHE_NAME = "freight-collection-v1";
const OFFLINE_URL = "/offline";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.add(OFFLINE_URL)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((names) => {
      return Promise.all(
        names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.origin !== location.origin) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const clone = response.clone();
        if (response.status === 200 && isCacheable(url)) {
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => {
        return caches.match(event.request).then((cached) => {
          if (cached) return cached;
          if (event.request.mode === "navigate") {
            return caches.match(OFFLINE_URL).then((offline) => offline || new Response("Offline", { status: 503, statusText: "Offline" }));
          }
          return new Response("", { status: 503, statusText: "Offline" });
        });
      })
  );
});

function isCacheable(url) {
  const path = url.pathname;
  if (path.startsWith("/api/")) return false;
  if (path.startsWith("/_next/") || path.endsWith(".js") || path.endsWith(".css")) return true;
  if (path.includes(".") && !/\.(ico|png|jpg|jpeg|svg|woff2?|webp)$/i.test(path)) return false;
  return true;
}

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});
