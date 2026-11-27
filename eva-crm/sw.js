// Eva's CRM – service worker (permite instalar e abrir o app mesmo com internet fraca)
const CACHE='ecrm-v2';
const SHELL=['/eva-crm/','/eva-crm/manifest.webmanifest','/eva-crm/ecrm-icon-192.png?v=1','/eva-crm/ecrm-icon-512.png?v=1','/eva-crm/ecrm-icon-180.png?v=1'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  const u=new URL(e.request.url);
  if(e.request.method!=='GET'||u.origin!==location.origin||!u.pathname.startsWith('/eva-crm/')||u.pathname.endsWith('.png'))return; // dados do Supabase nunca passam pelo cache
  e.respondWith(fetch(e.request).then(r=>{const c=r.clone();caches.open(CACHE).then(x=>x.put(e.request,c));return r}).catch(()=>caches.match(e.request).then(r=>r||caches.match('/eva-crm/'))));
});

// Notificações de novos leads
self.addEventListener('push',e=>{
  let d={};try{d=e.data?e.data.json():{}}catch(x){d={body:e.data&&e.data.text()}}
  e.waitUntil(self.registration.showNotification(d.title||"Eva's CRM",{body:d.body||'New cleaning lead',icon:'/eva-crm/ecrm-icon-192.png?v=1',badge:'/eva-crm/ecrm-icon-192.png?v=1',tag:d.tag||('lead-'+Date.now()),data:{url:d.url||'/eva-crm/#leads'}}));
});
self.addEventListener('notificationclick',e=>{
  e.notification.close();const url=(e.notification.data&&e.notification.data.url)||'/eva-crm/#leads';
  e.waitUntil(self.clients.matchAll({type:'window',includeUncontrolled:true}).then(cs=>{for(const c of cs){if(c.url.includes('/eva-crm/')){c.navigate(url).catch(()=>{});return c.focus()}}return self.clients.openWindow(url)}));
});
