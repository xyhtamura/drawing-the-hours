/* Imported by the generated root worker; OFFLINE_CACHE and OFFLINE_FILES come from it. */
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(OFFLINE_CACHE);
    try {
      await cache.addAll(OFFLINE_FILES.map(path => new Request(new URL(path, self.registration.scope), { cache: 'reload' })));
    } catch (error) {
      await caches.delete(OFFLINE_CACHE);
      throw error;
    }
    // Updates wait until the old game closes, keeping its scripts and artwork together.
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) {
      if (key.startsWith(OFFLINE_PREFIX) && key !== OFFLINE_CACHE) await caches.delete(key);
    }
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  const root = new URL(self.registration.scope);
  if (event.request.method !== 'GET' || url.origin !== root.origin || !url.pathname.startsWith(root.pathname)) return;
  // somewarez/ is a forwarding page; answer it here so that address also opens offline.
  if (event.request.mode === 'navigate' && url.pathname === root.pathname + 'somewarez/') {
    event.respondWith(Response.redirect(root.href + '?somewarez' + url.search.replace(/^\?/, '&'), 302));
    return;
  }
  event.respondWith((async () => {
    const cache = await caches.open(OFFLINE_CACHE);
    const home = [root.pathname, root.pathname + 'index.html'].includes(url.pathname);
    const cached = await cache.match(home && event.request.mode === 'navigate'
      ? new URL('index.html', root).href : event.request);
    return cached || fetch(event.request);
  })());
});
