/* Atomic offline precache; content hash changes on each source update. */
'use strict';
const PREFIX='kemono-static-'+encodeURIComponent(new URL(self.registration.scope).pathname)+'-';
const CACHE=PREFIX+'cdc1e455b897';
const ASSETS=["./", "./index.html", "./style.css", "./core.js", "./i18n.js", "./app.js", "./data.js", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png", "./icon-maskable.png"];
self.addEventListener('install',event=>event.waitUntil((async()=>{
 const cache=await caches.open(CACHE);
 try{await cache.addAll(ASSETS);}catch(error){await caches.delete(CACHE);throw error;}
 await self.skipWaiting();
})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{
 const names=await caches.keys();
 await Promise.all(names.filter(n=>n.startsWith(PREFIX)&&n!==CACHE).map(n=>caches.delete(n)));
 await self.clients.claim();
 for(const client of await self.clients.matchAll())client.postMessage({type:'CACHE_READY'});
})()));
self.addEventListener('fetch',event=>{
 if(event.request.method!=='GET'||new URL(event.request.url).origin!==self.location.origin)return;
 event.respondWith((async()=>{
  const cache=await caches.open(CACHE),url=new URL(event.request.url);
  url.search='';
  const cached=await cache.match(url.href);
  if(cached)return cached;
  if(event.request.mode==='navigate')return await cache.match('./index.html');
  return fetch(event.request);
 })());
});
