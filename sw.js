/* Hiszpański Franka PWA v16.0. Cache app shell only; user progress stays in localStorage. */
const CACHE='franka-pwa-v17-1-junior-invierno';
const APP_FILES=['./','./index.html','./manifest.webmanifest','./icons/icon-192.png','./icons/icon-512.png'];
self.addEventListener('install',event=>{
 event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(APP_FILES)));
});
self.addEventListener('activate',event=>{
 event.waitUntil(Promise.all([caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('franka-pwa-')&&k!==CACHE).map(k=>caches.delete(k)))),self.clients.claim()]));
});
self.addEventListener('fetch',event=>{
 const req=event.request;
 if(req.method!=='GET'||new URL(req.url).origin!==self.location.origin)return;
 if(req.mode==='navigate'){
  event.respondWith(fetch(req).then(resp=>{if(resp.ok){const copy=resp.clone();caches.open(CACHE).then(c=>c.put('./index.html',copy))}return resp}).catch(async()=>await caches.match('./index.html')||Response.error()));return;
 }
 event.respondWith(caches.match(req).then(cached=>cached||fetch(req)));
});
