/* =====================================================================
   sw.js — Service Worker Session Tifo
   - Précache la coquille de l'app (ouverture hors-ligne)
   - Stale-while-revalidate pour les fichiers same-origin (GET)
   - Laisse passer les appels API (POST / cross-origin) au réseau
   Incrémente CACHE pour forcer la mise à jour après modif.
   ===================================================================== */
const CACHE = "tifo-v4";
const SHELL = [
  "./",
  "./index.html",
  "./admin.html",
  "./config.js",
  "./gas-shim.js",
  "./manifest.webmanifest",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-maskable-512.png",
  "./icons/apple-touch-icon.png",
  "./icons/favicon-32.png"
];

self.addEventListener("install", (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then((c) => Promise.allSettled(SHELL.map((u) => c.add(u))))
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  const url = new URL(req.url);

  // Ne jamais intercepter : requêtes non-GET (API POST) ou autres origines
  if (req.method !== "GET" || url.origin !== self.location.origin) return;

  // Stale-while-revalidate
  e.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const cached = await cache.match(req);
      const network = fetch(req)
        .then((res) => {
          if (res && res.status === 200) cache.put(req, res.clone());
          return res;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
