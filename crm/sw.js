// Zeferino's CRM – service worker (permite instalar e abrir o app mesmo com internet fraca)
const CACHE='zcrm-v2';
const SHELL=['/crm/','/crm/manifest.webmanifest','/crm/zcrm-icon-192.png?v=2','/crm/zcrm-icon-512.png?v=2','/crm/zcrm-icon-180.png?v=2'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  const u=new URL(e.request.url);
  if(e.request.method!=='GET'||u.origin!==location.origin||!u.pathname.startsWith('/crm/')||u.pathname.endsWith('.png'))return; // dados do Supabase nunca passam pelo cache
  e.respondWith(fetch(e.request).then(r=>{const c=r.clone();caches.open(CACHE).then(x=>x.put(e.request,c));return r}).catch(()=>caches.match(e.request).then(r=>r||caches.match('/crm/'))));
});
