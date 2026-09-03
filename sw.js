const CACHE="shatranj-saudi-v6";
const ASSETS=["./","./index.html","./styles.css","./app.js","./config.js","./manifest.webmanifest"];
const PLAY_PATHS=["/play.html","/play-live.js","/realistic-pieces.css","/assets/pieces/"];

self.addEventListener("install",e=>{
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)));
});

self.addEventListener("activate",e=>{
  e.waitUntil(
    caches.keys()
      .then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))
      .then(()=>self.clients.claim())
  );
});

self.addEventListener("fetch",e=>{
  const url=new URL(e.request.url);
  const isPlayAsset=PLAY_PATHS.some(path=>url.pathname.endsWith(path)||url.pathname.includes(path));
  if(isPlayAsset){
    e.respondWith(fetch(new Request(e.request,{cache:"no-store"})).catch(()=>caches.match(e.request)));
    return;
  }
  e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request)));
});
