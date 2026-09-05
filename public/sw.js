/* Minimal, safe service worker for a live-data app: never caches pages or
 * API data (finance numbers must always be fresh). It only precaches the
 * offline fallback + icons and serves the fallback when navigation fails. */
const CACHE = "narveer-shell-v1";
const PRECACHE = [
  "/offline.html",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.mode !== "navigate") return; // static/data: browser default
  event.respondWith(
    fetch(event.request).catch(() =>
      caches.match("/offline.html").then((r) => r || Response.error()),
    ),
  );
});
