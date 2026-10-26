/* Shared, dependency-free data model for the standalone and PWA builds. */
(function(root){
'use strict';
const SCHEMA=1, own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
const plain=o=>o!==null&&typeof o==='object'&&!Array.isArray(o)&&[Object.prototype,null].includes(Object.getPrototypeOf(o));
const norm=s=>String(s||'').normalize('NFKC').toLocaleLowerCase().replace(/[ァ-ヶ]/g,c=>String.fromCharCode(c.charCodeAt(0)-0x60)).replace(/\s+/g,' ').trim();
const key=s=>norm(s).replace(/[\s。、，！？!?.,・「」『』]/g,'');
const defaults=()=>({schemaVersion:SCHEMA,custom:{phrases:[],categories:[],grammars:[]},overrides:[],favorites:[],recent:[],records:[],settings:{theme:'light',fontSize:1,hira:true,zh:true,en:false,rate:1,voiceURI:''}});
function allData(base,state){
 const patches=new Map(state.overrides.map(p=>[p.id,p]));
 return {...base,phrases:[...base.phrases.map(p=>patches.get(p.id)||p),...state.custom.phrases],categories:[...base.categories,...state.custom.categories.filter(x=>!base.categories.some(b=>b.id===x.id))],grammars:[...base.grammars,...state.custom.grammars.filter(x=>!base.grammars.some(b=>b.id===x.id))]};
}
function search(data,filters,state){
 const q=norm(filters.q||''), fav=new Set(state.favorites),recent=new Map(state.recent.map((r,i)=>[r.id,i]));
 const result=data.phrases.filter(p=>p.hidden!==true&&(!filters.kind||(p.kind||'phrase')===filters.kind)&&(!filters.category||p.categoryId===filters.category)&&(!filters.grammar||p.grammarIds.includes(filters.grammar))&&(!filters.difficulty||p.difficulty===Number(filters.difficulty))&&(filters.scope!=='favorites'||fav.has(p.id))&&(filters.scope!=='common'||p.common)&&(filters.scope!=='recent'||recent.has(p.id))&&(!q||norm([...Object.values(p.texts),...Object.values(p.readings),...p.tags,p.usageNote||'',data.categories.find(c=>c.id===p.categoryId)?.name||''].join(' ')).includes(q)));
 if(filters.scope==='recent')result.sort((a,b)=>recent.get(a.id)-recent.get(b.id));
 return result;
}
function shuffle(a,rng=Math.random){const b=[...a];for(let i=b.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[b[i],b[j]]=[b[j],b[i]];}return b;}
function sample(pool,n,rng=Math.random){const groups=new Set(),ja=new Set(),zh=new Set(),ids=new Set(),out=[];for(const p of shuffle(pool,rng)){if(p.hidden===true)continue;const g=p.semanticGroup||key(p.texts['ja-JP']),j=key(p.texts['ja-JP']),z=key(p.texts['zh-TW']);if(groups.has(g)||ja.has(j)||zh.has(z)||ids.has(p.id))continue;groups.add(g);ja.add(j);zh.add(z);ids.add(p.id);out.push(p);if(out.length===n)break;}return out;}
function duplicates(phrases){const seen=new Map(),out=[];for(const p of phrases){const k=key(p.texts?.['ja-JP']);if(seen.has(k))out.push([seen.get(k),p.id]);else seen.set(k,p.id);}return out;}
const idValid=x=>typeof x==='string'&&/^[a-zA-Z0-9][a-zA-Z0-9_.-]{0,79}$/.test(x)&&!['__proto__','constructor','prototype'].includes(x);
const textValid=(s,max=1000)=>typeof s==='string'&&s.trim().length>0&&s.length<=max;
function validateBundle(raw,base){
 const errors=[],warnings=[];
 if(!plain(raw)||raw.schemaVersion!==SCHEMA)return {errors:['schemaVersion 必須是 1，且根節點必須是物件。'],warnings};
 if(!Array.isArray(raw.phrases)||raw.phrases.length>5000)errors.push('phrases 必須是陣列，最多 5,000 句。');
 for(const k of ['categories','grammars'])if(raw[k]!==undefined&&(!Array.isArray(raw[k])||raw[k].length>500))errors.push(k+' 必須是陣列，最多 500 筆。');
 if(errors.length)return {errors,warnings};
 const categories=raw.categories||[],grammars=raw.grammars||[];
 const catIds=new Set(base.categories.map(x=>x.id)),gIds=new Set(base.grammars.map(x=>x.id));
 for(const [items,kind] of [[categories,'分類'],[grammars,'文法']]){const seen=new Set();items.forEach((x,i)=>{const prefix=`${kind}第 ${i+1} 筆：`;if(!plain(x)||!idValid(x.id)){errors.push(prefix+'需要有效 ID。');return;}if(seen.has(x.id))errors.push(prefix+'ID 重複。');seen.add(x.id);if(kind==='分類'){if(!textValid(x.name,80))errors.push(prefix+'name 不可空白，最多 80 字。');if(x.description!==undefined&&typeof x.description!=='string')errors.push(prefix+'description 必須是文字。');catIds.add(x.id);}else{for(const k of ['title','group','pattern','explanation'])if(!textValid(x[k]))errors.push(prefix+k+' 不可空白，最多 1,000 字。');for(const k of ['conjugations','words','exampleIds'])if(!Array.isArray(x[k])||x[k].length>100||x[k].some(s=>!textValid(s,500)))errors.push(prefix+k+' 必須是文字陣列，最多 100 筆。');gIds.add(x.id);}});}
 const ids=new Set(),refIds=new Set(base.phrases.map(x=>x.id));raw.phrases.forEach(p=>{if(plain(p)&&idValid(p.id))refIds.add(p.id);});
 raw.phrases.forEach((p,i)=>{const pre=`句子第 ${i+1} 筆：`;if(!plain(p)||!idValid(p.id)){errors.push(pre+'需要有效 ID（英數字、連字號、底線或句點）。');return;}if(ids.has(p.id))errors.push(pre+'ID 重複：'+p.id);ids.add(p.id);
  if(!plain(p.texts)||!textValid(p.texts['zh-TW'])||!textValid(p.texts['ja-JP']))errors.push(pre+'中文與日文不可空白，最多 1,000 字。');
  if(plain(p.texts)&&Object.values(p.texts).some(s=>!textValid(s)))errors.push(pre+'所有翻譯欄位必須是非空白文字。');
  if(!plain(p.readings)||!textValid(p.readings['ja-Hira'])||/[\u3400-\u9fff\u30a1-\u30faA-Za-z]/.test(p.readings['ja-Hira']))errors.push(pre+'readings.ja-Hira 需要平假名（不含漢字、片假名或英文字母）。');
  if(!catIds.has(p.categoryId))errors.push(pre+'找不到分類 '+String(p.categoryId));
  for(const k of ['tags','grammarIds','relatedIds','followUpIds'])if(!Array.isArray(p[k])||p[k].length>100||p[k].some(s=>!textValid(s,100)))errors.push(pre+k+' 必須是文字陣列，最多 100 筆。');
  if(Array.isArray(p.grammarIds)&&p.grammarIds.some(g=>!gIds.has(g)))errors.push(pre+'有不存在的文法 ID。');
  for(const k of ['relatedIds','followUpIds'])if(Array.isArray(p[k])&&p[k].some(x=>!refIds.has(x)))errors.push(pre+k+' 有不存在的句子 ID。');
  if(![1,2,3].includes(p.difficulty))errors.push(pre+'difficulty 必須是 1、2 或 3。');
  if(p.hidden!==undefined&&typeof p.hidden!=='boolean')errors.push(pre+'hidden 必須是 true 或 false。');
  if(p.kind!==undefined&&!['phrase','word'].includes(p.kind))errors.push(pre+'kind 必須是 phrase 或 word。');
  if(p.usageNote!==undefined&&(typeof p.usageNote!=='string'||p.usageNote.length>1000))errors.push(pre+'usageNote 必須是文字，最多 1,000 字。');
  if(typeof p.common!=='boolean')errors.push(pre+'common 必須是 true 或 false。');
  if(!textValid(p.semanticGroup,100))errors.push(pre+'semanticGroup 不可空白。');
  if(p.audioUrl!==null&&p.audioUrl!==undefined&&(typeof p.audioUrl!=='string'||p.audioUrl.length>1000||!/^((\.\/)?audio\/[\w./%-]+|https:\/\/[^\s<>]+)$/.test(p.audioUrl)))errors.push(pre+'audioUrl 只接受 audio/ 相對路徑或 HTTPS URL。');
 });
 grammars.forEach(g=>{if(Array.isArray(g?.exampleIds)&&g.exampleIds.some(id=>!refIds.has(id)))errors.push('文法 '+String(g.id)+' 有不存在的例句 ID。');});
 if(!errors.length){const dup=duplicates(raw.phrases);for(const pair of dup)warnings.push('日文原句重複：'+pair.join(' / '));}
 return {errors:errors.slice(0,40),warnings:warnings.slice(0,40),bundle:raw};
}
function cleanSettings(raw={}){return {theme:['light','dark','system'].includes(raw.theme)?raw.theme:'light',fontSize:[.9,1,1.15,1.3].includes(raw.fontSize)?raw.fontSize:1,hira:raw.hira!==false,zh:raw.zh!==false,en:raw.en===true,rate:[.75,1,1.25].includes(raw.rate)?raw.rate:1,voiceURI:typeof raw.voiceURI==='string'?raw.voiceURI.slice(0,500):''};}
function cleanUser(raw={}){return {favorites:[...new Set((Array.isArray(raw.favorites)?raw.favorites:[]).filter(idValid))].slice(0,10000),recent:(Array.isArray(raw.recent)?raw.recent:[]).filter(r=>plain(r)&&idValid(r.id)&&Number.isFinite(r.at)).slice(0,50),records:(Array.isArray(raw.records)?raw.records:[]).filter(r=>plain(r)&&idValid(r.id)&&Number.isFinite(r.at)&&Number.isInteger(r.total)&&r.total>=1&&r.total<=8&&Number.isInteger(r.mistakes)&&r.mistakes>=0&&Array.isArray(r.wrongIds)&&r.wrongIds.every(idValid)&&Array.isArray(r.phraseIds)&&r.phraseIds.every(idValid)).slice(0,100),settings:cleanSettings(raw.settings)};}
function parseImport(raw,current,base){
 if(raw?.kind!=='kemono-backup')return {...validateBundle(raw,allData(base,current)),kind:'material'};
 if(raw.schemaVersion!==SCHEMA||!plain(raw.custom)||!Array.isArray(raw.overrides)||!plain(raw.user))return {errors:['備份格式不完整或版本不支援。'],warnings:[]};
 const b={schemaVersion:SCHEMA,categories:raw.custom.categories,grammars:raw.custom.grammars,phrases:[...(raw.custom.phrases||[]),...raw.overrides]};
 if(!Array.isArray(raw.custom.phrases))return {errors:['custom.phrases 必須是陣列。'],warnings:[]};
 const v=validateBundle(b,allData(base,current));
 if(raw.custom.phrases.some(p=>base.phrases.some(b=>b.id===p.id)))v.errors.push('自訂句子 ID 不可使用內建 ID。');
 if(raw.overrides.some(p=>!base.phrases.some(b=>b.id===p.id)))v.errors.push('overrides 只能包含內建句子的 ID。');
 return {...v,kind:'backup',user:cleanUser(raw.user)};
}
function mergeImport(state,parsed,base,replace){
 const next=JSON.parse(JSON.stringify(state)),b=parsed.bundle;
 const merge=(dest,items)=>{for(const item of items){const idx=dest.findIndex(p=>p.id===item.id);if(idx<0)dest.push(item);else if(replace)dest[idx]=item;}};
 merge(next.custom.categories,b.categories||[]);merge(next.custom.grammars,b.grammars||[]);
 for(const p of b.phrases){if(base.phrases.some(x=>x.id===p.id)){if(replace){const original=base.phrases.find(x=>x.id===p.id);if(JSON.stringify(p)===JSON.stringify(original))next.overrides=next.overrides.filter(x=>x.id!==p.id);else merge(next.overrides,[p]);}}else merge(next.custom.phrases,[p]);}
 if(parsed.kind==='backup'){const u=parsed.user;next.favorites=[...new Set([...next.favorites,...u.favorites])];next.recent=[...new Map([...next.recent,...u.recent].sort((a,b)=>b.at-a.at).map(r=>[r.id,r])).values()].sort((a,b)=>b.at-a.at).slice(0,50);next.records=[...new Map([...next.records,...u.records].map(r=>[r.id,r])).values()].sort((a,b)=>b.at-a.at).slice(0,100);if(replace)next.settings=u.settings;}
 return next;
}
const api={SCHEMA,norm,key,defaults,allData,search,shuffle,sample,duplicates,validateBundle,cleanSettings,cleanUser,parseImport,mergeImport};
if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.KemonoCore=api;
})(typeof window==='undefined'?globalThis:window);
