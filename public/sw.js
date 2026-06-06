const CACHE = "baseeta-v5";

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (
    request.method !== "GET" ||
    url.origin !== self.location.origin ||
    url.pathname.startsWith("/api/")
  ) {
    return;
  }

  // Never cache Next HTML, RSC payloads, or generated chunks. Stale entries can
  // reference Turbopack modules that no longer exist after a rebuild.
  if (request.mode === "navigate" || url.pathname.startsWith("/_next/") || url.pathname.endsWith(".js")) {
    event.respondWith(fetch(request));
    return;
  }

  if (
    url.pathname.startsWith("/icons/") ||
    url.pathname === "/icon" ||
    url.pathname === "/icon2" ||
    url.pathname === "/apple-icon" ||
    /\.(png|jpg|jpeg|svg|webp|woff2?)$/.test(url.pathname)
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          const clone = response.clone();
          caches.open(CACHE).then((cache) => cache.put(request, clone)).catch(() => {});
          return response;
        });
      })
    );
  }
});
