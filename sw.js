// Vice City Countdown PWA v2.0
// App-shell: cache-first for near-instant repeat launches; network updates in background.
const CACHE='vice-city-countdown-v4';
const CORE=['./','./index.html','./styles.css?v=2.0.0','./app.js?v=2.0.0','./assets/vice-city-theme.css?v=2.0.0','./assets/vice-city-skyline.svg','./data/news.json?v=2.0.0','./manifest.webmanifest','./assets/icon.svg','./assets/icon-192.png','./assets/icon-512.png','./privacy.html','./terms.html','./spoilers.html'];
self.addEventListener('install',event=>{
 event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
 event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('vice-city-countdown-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',event=>{
 const req=event.request;
 if(req.method!=='GET')return;
 const url=new URL(req.url);
 if(url.origin!==self.location.origin)return;
 if(!url.pathname.startsWith(new URL(self.registration.scope).pathname))return;
 // News must stay fresh: the approved feed is checked online rather than frozen in the PWA cache.
 if(url.pathname.endsWith('/data/news.json')){
   event.respondWith(fetch(req,{cache:'no-store'}).catch(async()=>await caches.match('./data/news.json?v=2.0.0')||new Response('{"articles":[]}',{headers:{'Content-Type':'application/json'}})));
   return;
 }
 if(req.mode==='navigate'){
   event.respondWith((async()=>{
     const cached=await caches.match(req);
     const refresh=fetch(req).then(response=>{
       if(response.ok){const copy=response.clone();const updating=caches.open(CACHE).then(cache=>cache.put(req,copy));event.waitUntil(updating);}
       return response;
     }).catch(()=>null);
     return cached || await refresh || await caches.match('./index.html') || Response.error();
   })());
   return;
 }
 // Versioned assets cached for offline operation. New version is fetched on install.
 event.respondWith(caches.match(req).then(cached=>cached||fetch(req).then(response=>{
   if(response.ok){const copy=response.clone();event.waitUntil(caches.open(CACHE).then(cache=>cache.put(req,copy)));}
   return response;
 })));
});
