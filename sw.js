// Retirement worker for legacy installations. No offline page snapshots are served.
// It is deliberately safe to install once, clean only this site's old caches, and unregister.
self.addEventListener('install',event=>{
  event.waitUntil(self.skipWaiting());
});
self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(keys.filter(key=>key.startsWith('shatranj-arab-')).map(key=>caches.delete(key)));
    await self.registration.unregister();
  })());
});
// No fetch interception: all HTML, CSS, JS and play assets use the network.
