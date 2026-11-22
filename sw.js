/* Vice City Hub · PWA v4.1 · Multi-page archive, approved material and offline fallback */
const CACHE='vice-city-hub-v2';
const CORE=[
  "./",
  "./index.html",
  "./player-hub.html",
  "./leonida-map.html",
  "./countdown-archive.html",
  "./launch-info.html",
  "./launch-kit.html",
  "./after-launch.html",
  "./news.html",
  "./leonida-files.html",
  "./media.html",
  "./app.html",
  "./vice-city-history.html",
  "./assets/vice-city-history.css?v=3.4.2",
  "./assets/vice-city-history.js?v=3.4.3",
  "./styles.css?v=2.2.0",
  "./assets/vice-city-theme.css?v=2.2.0",
  "./assets/mobile-experience.css?v=2.3.0",
  "./assets/site-pages.css?v=4.1.0",
  "./assets/leonida-map.css?v=4.1.0",
  "./assets/leonida-map.js?v=4.1.0",
  "./assets/hub-home.css?v=4.1.0",
  "./assets/hub-home.js?v=4.1.0",
  "./assets/player-hub.js?v=4.0.0",
  "./assets/after-launch.css?v=1.0.1",
  "./assets/after-launch.js?v=1.0.0",
  "./assets/launch-mode.css?v=2.4.0",
  "./assets/cinematic-launch.css?v=3.8.1",
  "./assets/site-pages.js?v=4.1.0",
  "./app.js?v=3.1.0",
  "./assets/cinematic-launch.js?v=3.7.0",
  "./assets/region-clock.js?v=3.1.0",
  "./assets/launch-week.css?v=2.5.0",
  "./assets/launch-week-core.js?v=2.5.0",
  "./assets/launch-week.js?v=3.1.0",
  "./assets/editorial-images.css?v=2.9.1",
  "./assets/news.js?v=3.1.0",
  "./assets/official-guide.css?v=2.8.0",
  "./assets/official-guide.js?v=3.1.0",
  "./assets/media.js?v=3.1.0",
  "./assets/install.js?v=3.1.0",
  "./data/news.json?v=3.1.0",
  "./manifest.webmanifest",
  "./assets/icon.svg",
  "./assets/icon-192.png",
  "./assets/icon-512.png",
  "./assets/vice-city-skyline.svg",
  "./privacy.html",
  "./terms.html",
  "./spoilers.html"
];
// Optional Leonida story data and full screenshots are not pre-fetched.
self.addEventListener('message',event=>{if(event.data?.type==='SKIP_WAITING')self.skipWaiting();});
self.addEventListener('install',event=>{
  event.waitUntil((async()=>{
    const cache=await caches.open(CACHE);
    // Avoid a browser/CDN's locally cached outdated app-shell resources.
    await cache.addAll(CORE.map(path=>new Request(path,{cache:'reload'})));
    await self.skipWaiting();
  })());
});
self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(keys.filter(k=>(k.startsWith('vice-city-countdown-')||k.startsWith('vice-city-hub-'))&&k!==CACHE).map(k=>caches.delete(k)));
    await self.clients.claim();
  })());
});
self.addEventListener('fetch',event=>{
  const request=event.request;
  if(request.method!=='GET')return;
  const url=new URL(request.url);
  if(url.origin!==self.location.origin)return;
  if(!url.pathname.startsWith(new URL(self.registration.scope).pathname))return;

  // Documents are network-first: installed PWAs cannot remain on old HTML
  // simply because they already have a cached copy.
  if(request.mode==='navigate'){
    event.respondWith((async()=>{
      try{
        const response=await fetch(request,{cache:'no-store'});
        if(response.ok){
          const copy=response.clone();
          event.waitUntil(caches.open(CACHE).then(c=>c.put(request,copy)));
        }
        return response;
      }catch{
        return (await caches.match(request)) ||
          (await caches.match('./index.html')) || Response.error();
      }
    })());
    return;
  }

  // Editor-approved news always tries the live published JSON first.
  if(url.pathname.endsWith('/data/news.json')){
    event.respondWith(fetch(request,{cache:'no-store'}).then(response=>{
      if(response.ok){
        const copy=response.clone();
        event.waitUntil(caches.open(CACHE).then(c=>c.put(request,copy)));
      }
      return response;
    }).catch(async()=>await caches.match('./data/news.json?v=3.1.0') ||
      new Response('{"articles":[]}',{headers:{'Content-Type':'application/json'}})));
    return;
  }

  // Versioned assets are cache-first for quick repeat launches. Changes
  // always get a new URL version and cache namespace.
  event.respondWith(caches.match(request).then(cached=>cached ||
    fetch(request).then(response=>{
      if(response.ok){
        const copy=response.clone();
        event.waitUntil(caches.open(CACHE).then(c=>c.put(request,copy)));
      }
      return response;
    })
  ));
});
