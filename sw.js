// The game is thirty-odd ES modules, each fetched and cached under its own URL
// by the browser, and — the part no client code could previously reach — by
// the CDN edge, which holds copies for hours. Network-first fetching cannot
// help when the network itself serves stale: Bryan lost a prize to a fight
// that ran old rules under a new build stamp, because the edge answered the
// worker's honest fetch with a four-hour-old game.js.
//
// So every same-origin subresource is fetched under a BUILD-STAMPED URL
// (?b=<deploy stamp>). A new deploy means new URLs, and the edge cannot serve
// yesterday's copy of a URL that did not exist yesterday. The stamp comes
// from a tiny cache-proof HEAD of the site root, refreshed on every
// navigation, so one page load = one coherent vintage. The cache keeps
// fallback copies under the ORIGINAL URLs, so offline still serves one
// consistent old set rather than a blank screen.
const CACHE = 'soc-v1';
let build = '';

async function probeBuild() {
  try {
    const r = await fetch('./?probe=' + Date.now(), { method: 'HEAD', cache: 'no-store' });
    const stamp = r.headers.get('last-modified') || r.headers.get('etag') || '';
    if (stamp) build = stamp.replace(/[^0-9A-Za-z]/g, '');
  } catch (e) { /* offline: keep whatever stamp we have */ }
  return build;
}

async function networkFirst(target, cacheKey) {
  try {
    const fresh = await fetch(target);
    if (fresh && fresh.ok) {
      const cache = await caches.open(CACHE);
      cache.put(cacheKey, fresh.clone());
    }
    return fresh;
  } catch (e) {
    // No network. A consistent old copy is better than a blank screen.
    const hit = await caches.match(cacheKey);
    if (hit) return hit;
    throw e;
  }
}

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) {
      if (key !== CACHE) await caches.delete(key);
    }
    await probeBuild();
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;   // fonts and the like: leave alone
  if (url.searchParams.has('probe')) return;         // the stamp probe itself

  if (req.mode === 'navigate') {
    // One small HEAD before the page loads, so every module this page then
    // asks for carries the stamp of the SAME deploy.
    event.respondWith((async () => {
      await probeBuild();
      return networkFirst(req, req);
    })());
    return;
  }

  event.respondWith((async () => {
    let target = req;
    if (build && !url.searchParams.has('b') && !url.pathname.endsWith('/sw.js')) {
      url.searchParams.set('b', build);
      target = url.toString();
    }
    return networkFirst(target, req);
  })());
});
