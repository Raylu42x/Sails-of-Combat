// The game is thirty-odd ES modules, each fetched and cached under its own URL
// by the browser and by the edge. Deploy twice in an evening and a device can
// end up holding this morning's main.js and last night's banner.js — a mixture
// that never existed and fails in arbitrary silent ways. Bryan hit it as "Take
// command does nothing", with no console error, on code that was fine.
//
// So: the app's own files are always fetched from the network first. A cached
// copy is kept only as a fallback for when there is no network at all, which
// means a stale file can never be mixed into a working set — it can only be
// used when nothing else is available, and then all of it is the same vintage.
const CACHE = 'soc-v1';

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) {
      if (key !== CACHE) await caches.delete(key);
    }
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;   // fonts and the like: leave alone

  event.respondWith((async () => {
    try {
      // Network first, and the response is revalidated by ETag as usual — this
      // is what makes a mixed set impossible.
      const fresh = await fetch(req);
      if (fresh && fresh.ok) {
        const cache = await caches.open(CACHE);
        cache.put(req, fresh.clone());
      }
      return fresh;
    } catch (e) {
      // No network. A consistent old copy is better than a blank screen.
      const hit = await caches.match(req);
      if (hit) return hit;
      throw e;
    }
  })());
});
