#!/usr/bin/env python3
"""Build both offline formats from the same src/ files. Python 3, no packages."""
import hashlib,json,re,struct,zlib
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
SRC=ROOT/'src'
OUT=ROOT/'outputs'/'Kemono-Phrasebook'
PWA=OUT/'pwa'
PWA.mkdir(parents=True,exist_ok=True)
data=json.loads((SRC/'data.json').read_text())
assert len(data['phrases'])>=100,'Expected at least 100 starter phrases'
assert len({p['id'] for p in data['phrases']})==len(data['phrases'])
compact=json.dumps(data,ensure_ascii=False,separators=(',',':')).replace('</','<\\/')
template=(SRC/'index.html').read_text()
css=(SRC/'style.css').read_text()
core=(SRC/'core.js').read_text()
app=(SRC/'app.js').read_text()
standalone=template.replace('<!-- PWA_HEAD -->','').replace('<!-- STYLE -->','<style>\n'+css+'</style>').replace('<!-- DATA -->','<script type="application/json" id="教材資料">'+compact+'</script>').replace('<!-- CORE -->','<script>\n'+core+'</script>').replace('<!-- APP -->','<script>\n'+app+'</script>')
(OUT/'Kemono-Phrasebook.html').write_text(standalone)
pwa=template.replace('<html lang="zh-Hant">','<html lang="zh-Hant" data-build="pwa">').replace('<!-- PWA_HEAD -->','<link rel="manifest" href="./manifest.webmanifest">\n<link rel="apple-touch-icon" href="./icon-192.png">').replace('<!-- STYLE -->','<link rel="stylesheet" href="./style.css">').replace('<!-- DATA -->','<script id="教材資料" type="application/json"></script>\n<script src="./data.js"></script>').replace('<!-- CORE -->','<script src="./core.js"></script>').replace('<!-- APP -->','<script src="./app.js"></script>')
(PWA/'index.html').write_text(pwa)
for f in ['style.css','core.js','app.js']:(PWA/f).write_text((SRC/f).read_text())
(PWA/'data.js').write_text("document.getElementById('教材資料').textContent="+json.dumps(compact,ensure_ascii=False)+";\n")
manifest={'id':'./','name':'Kemono Phrasebook 獸展會話手帖','short_name':'Kemono 手帖','description':'離線獸展日文會話、文法與配對練習','lang':'zh-TW','start_url':'./','scope':'./','display':'standalone','background_color':'#f6f5ef','theme_color':'#245d52','icons':[{'src':'./icon-192.png','sizes':'192x192','type':'image/png','purpose':'any'},{'src':'./icon-512.png','sizes':'512x512','type':'image/png','purpose':'any'},{'src':'./icon-maskable.png','sizes':'512x512','type':'image/png','purpose':'maskable'}]}
(PWA/'manifest.webmanifest').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
def icon(size):
    rows=[]
    for y in range(size):
        row=bytearray()
        for x in range(size):
            u,v=x/size,y/size
            shapes=[(.33,.35,.065,.085),(.49,.29,.065,.085),(.65,.35,.065,.085),(.73,.49,.055,.075),(.49,.57,.17,.135)]
            color=(36,93,82)
            if any(((u-a)/rx)**2+((v-b)/ry)**2<1 for a,b,rx,ry in shapes):color=(246,245,239)
            row.extend(color)
        rows.append(b'\0'+row)
    def chunk(kind,blob):return struct.pack('!I',len(blob))+kind+blob+struct.pack('!I',zlib.crc32(kind+blob)&0xffffffff)
    return b'\x89PNG\r\n\x1a\n'+chunk(b'IHDR',struct.pack('!2I5B',size,size,8,2,0,0,0))+chunk(b'IDAT',zlib.compress(b''.join(rows)))+chunk(b'IEND',b'')
for name,size in [('icon-192.png',192),('icon-512.png',512),('icon-maskable.png',512)]:(PWA/name).write_bytes(icon(size))
assets=['./','./index.html','./style.css','./core.js','./app.js','./data.js','./manifest.webmanifest','./icon-192.png','./icon-512.png','./icon-maskable.png']
h=hashlib.sha256()
for name in assets[1:]:h.update((PWA/name[2:]).read_bytes())
version=h.hexdigest()[:12]
sw='''/* Atomic offline precache; content hash changes on each source update. */
'use strict';
const PREFIX='kemono-static-'+encodeURIComponent(new URL(self.registration.scope).pathname)+'-';
const CACHE=PREFIX+'__VERSION__';
const ASSETS=__ASSETS__;
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
'''.replace('__VERSION__',version).replace('__ASSETS__',json.dumps(assets))
(PWA/'sw.js').write_text(sw)
# Include a portable editable source kit next to the ready-to-use artifacts.
kit=OUT/'source'
(kit/'src').mkdir(parents=True,exist_ok=True)
(kit/'scripts').mkdir(parents=True,exist_ok=True)
for f in ['index.html','style.css','core.js','app.js','data.json']:
    (kit/'src'/f).write_text((SRC/f).read_text())
portable=(ROOT/'scripts'/'build.py').read_text().replace("OUT=ROOT/'outputs'/'Kemono-Phrasebook'", "OUT=ROOT.parent")
(kit/'scripts'/'build.py').write_text(portable)
(kit/'scripts'/'test-core.cjs').write_text((ROOT/'scripts'/'test-core.cjs').read_text())
print(f'Built: {OUT}\n{len(data["phrases"])} phrases / {len(data["grammars"])} grammar modules / cache {version}')
