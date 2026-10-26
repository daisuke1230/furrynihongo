'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),C=require('../src/core.js'),base=JSON.parse(fs.readFileSync(path.join(root,'src/data.json'),'utf8')),s=C.defaults();
assert.equal(base.phrases.length,260);assert.equal(new Set(base.phrases.map(p=>p.id)).size,260);assert.equal(base.phrases.filter(p=>p.kind==='word').length,100);assert.equal(base.phrases.filter(p=>p.kind!=='word').length,160);assert.deepEqual(C.validateBundle(base,base).errors,[]);assert.deepEqual(C.duplicates(base.phrases),[]);
assert.equal(C.search(base,{q:'コンビニ',kind:'phrase'},s)[0].id,'kp-058');assert.equal(C.search(base,{q:'こんびに',kind:'phrase'},s)[0].id,'kp-058');assert.equal(C.search(base,{q:'ｺﾝﾋﾞﾆ',kind:'phrase'},s)[0].id,'kp-058');assert.equal(C.search(base,{category:'photo',kind:'phrase'},s).length,10);
s.favorites=['kp-012'];assert.deepEqual(C.search(base,{scope:'favorites'},s).map(p=>p.id),['kp-012']);
for(const n of [4,6,8])for(let i=0;i<100;i++){const items=C.sample(base.phrases,n);assert.equal(items.length,n);for(const k of ['id','semanticGroup'])assert.equal(new Set(items.map(p=>p[k])).size,n);assert.equal(new Set(items.map(p=>C.key(p.texts['zh-TW']))).size,n);}
const custom=structuredClone(base.phrases[0]);custom.id='custom-test';custom.texts={'ja-JP':'初めて来ました。','zh-TW':'我第一次來。','en-US':'This is my first time here.'};custom.readings={'ja-Hira':'はじめてきました。'};custom.relatedIds=[];custom.followUpIds=[];
const bundle={schemaVersion:1,phrases:[custom],categories:[],grammars:[]},parsed=C.parseImport(bundle,s,base);assert.deepEqual(parsed.errors,[]);const imported=C.mergeImport(s,parsed,base,false);assert.equal(imported.custom.phrases.length,1);assert.equal(C.search(C.allData(base,imported),{q:'first time'},imported).length,1);assert.equal(s.custom.phrases.length,0);
const modified=structuredClone(custom);modified.texts['zh-TW']='第一次參加。';const p2=C.parseImport({...bundle,phrases:[modified]},imported,base);assert.equal(C.mergeImport(imported,p2,base,false).custom.phrases[0].texts['zh-TW'],'我第一次來。');assert.equal(C.mergeImport(imported,p2,base,true).custom.phrases[0].texts['zh-TW'],'第一次參加。');
for(const [field,value] of [['id','__proto__'],['categoryId','missing'],['difficulty',9],['readings',{'ja-Hira':'漢字'}],['texts',{'ja-JP':'','zh-TW':'不完整'}],['audioUrl','javascript:alert(1)'],['grammarIds',['missing']],['relatedIds',['missing']]])assert.ok(C.validateBundle({...bundle,phrases:[{...custom,[field]:value}]},base).errors.length,field);
const backup={kind:'kemono-backup',schemaVersion:1,custom:imported.custom,overrides:[],user:{...imported,favorites:['custom-test'],settings:{...imported.settings,theme:'dark',rate:.75}}};const restored=C.mergeImport(C.defaults(),C.parseImport(backup,C.defaults(),base),base,true);assert.equal(restored.settings.theme,'dark');assert.equal(restored.settings.rate,.75);assert.deepEqual(restored.favorites,['custom-test']);assert.equal(restored.custom.phrases.length,1);
assert.equal(C.cleanSettings({theme:'evil',rate:200,fontSize:20}).rate,1);
console.log('PASS core: 160 phrases + 100 words, references/readings, kana search, filters, 300 non-ambiguous samples, imports/conflicts/backup, invalid data rejection.');

assert.equal(C.search(base,{kind:'word'},s).length,100);
assert.equal(C.search(base,{kind:'phrase'},s).length,160);
for(const cat of ['parade','private','room','intimacy','sexual']){
 assert.equal(C.search(base,{kind:'word',category:cat},s).length,10);
 assert.equal(C.search(base,{kind:'phrase',category:cat},s).length,12);
 assert.equal(C.sample(C.search(base,{kind:'phrase',category:cat},s),8).length,8);
}
assert.equal(base.categories.find(c=>c.id==='care').name,'界限與協助');
const heard=base.phrases.find(p=>p.id==='kp-151');
assert.match(heard.usageNote,/可能/);assert.ok(heard.followUpIds.includes('kp-153'));assert.ok(heard.followUpIds.includes('kp-155'));
assert.equal(C.search(base,{kind:'word',q:'わんないと'},s)[0].id,'kv-098');
for(const field of [{kind:'unknown'},{usageNote:23},{usageNote:'x'.repeat(1001)}])assert.ok(C.validateBundle({...bundle,phrases:[{...custom,...field}]},base).errors.length);
const legacy={kind:'kemono-backup',schemaVersion:1,custom:{phrases:[],categories:[],grammars:[]},overrides:[],user:{favorites:['kp-012'],recent:[{id:'kp-012',at:Date.now()}],records:[],settings:{rate:.75}}};
const parsedLegacy=C.parseImport(legacy,C.defaults(),base);assert.deepEqual(parsedLegacy.errors,[]);
const migrated=C.mergeImport(C.defaults(),parsedLegacy,base,true);assert.deepEqual(migrated.favorites,['kp-012']);assert.equal(C.allData(base,migrated).phrases.length,260);
console.log('PASS expansion: 100 words, 60 new conversations, kind filters, 5 new scenarios, heard-to-response links, optional-field validation, legacy backup compatibility.');
