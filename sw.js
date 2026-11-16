/* Vice City Countdown · PWA v2.9 · Official editorial card artwork + offline fallback */
const CACHE='vice-city-countdown-v22';
const CORE=[
  "./",
  "./index.html",
  "./launch-info.html",
  "./launch-kit.html",
  "./news.html",
  "./leonida-files.html",
  "./media.html",
  "./app.html",
  "./vice-city-history.html",
  "./assets/vice-city-history.css?v=3.2.0",
  "./assets/vice-city-history.js?v=3.2.0",
  "./styles.css?v=2.2.0",
  "./assets/vice-city-theme.css?v=2.2.0",
  "./assets/mobile-experience.css?v=2.3.0",
  "./assets/site-pages.css?v=3.2.0",
  "./assets/launch-mode.css?v=2.4.0",
  "./assets/cinematic-launch.css?v=2.7.2",
  "./assets/site-pages.js?v=3.2.0",
  "./app.js?v=3.1.0",
  "./preview/vendor/GrandFireworks.min.js?v=1.11.1",
  "./assets/cinematic-launch.js?v=2.7.1",
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
    await Promise.all(keys.filter(k=>k.startsWith('vice-city-countdown-')&&k!==CACHE).map(k=>caches.delete(k)));
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
