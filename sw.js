const CACHE="shatranj-arab-v1";
const ASSETS=["./","./index.html","./styles.css","./app.js","./config.js","./manifest.webmanifest","./arab-cities.js"];
const PLAY_PATHS=["/play.html","/play-v8.html","/play-live.js","/play-v8.js","/realistic-pieces.css","/play-v8.css","/play-v10.html","/play-v10-match.js","/assets/pieces/"];

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
