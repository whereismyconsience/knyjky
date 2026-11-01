/* Offline app-shell cache: only same-origin static assets, never ISBN lookup requests. */
const CACHE='folio-shell-v2.1';
const BASE=self.registration.scope;
const SHELL=['./','./index.html','./styles.css','./app.js','./db.js','./barcode.js','./manifest.webmanifest','./assets/icons/folio-192.png','./assets/icons/folio-512.png'];
self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(SHELL)));
  self.skipWaiting();
});
self.addEventListener('activate',event=>{
  event.waitUntil(Promise.all([caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('folio-shell-')&&k!==CACHE).map(k=>caches.delete(k)))),self.clients.claim()]));
});
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const url=new URL(event.request.url);
  if(url.origin!==self.location.origin)return;
  if(!url.pathname.startsWith(new URL(BASE).pathname))return;
  event.respondWith((async()=>{
    const cache=await caches.open(CACHE);
    const cached=await cache.match(event.request);
    if(cached) return cached;
    try {
      const response=await fetch(event.request);
      if(response.ok&&url.pathname.includes('/assets/covers/'))cache.put(event.request,response.clone());
      return response;
    }catch(err){return cached||Response.error()}
  })());
});
