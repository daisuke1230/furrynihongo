'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),C=require('../src/core.js'),base=JSON.parse(fs.readFileSync(path.join(root,'src/data.json'),'utf8')),s=C.defaults();
assert.equal(base.phrases.length,430);assert.equal(new Set(base.phrases.map(p=>p.id)).size,430);assert.equal(base.phrases.filter(p=>p.kind==='word'&&!p.hidden).length,143);assert.equal(base.phrases.filter(p=>p.kind!=='word'&&!p.hidden).length,286);assert.deepEqual(C.validateBundle(base,base).errors,[]);assert.deepEqual(C.duplicates(base.phrases),[]);
assert.equal(C.search(base,{q:'コンビニ',kind:'phrase'},s)[0].id,'kp-058');assert.equal(C.search(base,{q:'こんびに',kind:'phrase'},s)[0].id,'kp-058');assert.equal(C.search(base,{q:'ｺﾝﾋﾞﾆ',kind:'phrase'},s)[0].id,'kp-058');assert.equal(C.search(base,{category:'photo',kind:'phrase'},s).length,36);
s.favorites=['kp-012'];assert.deepEqual(C.search(base,{scope:'favorites'},s).map(p=>p.id),['kp-012']);
for(const n of [4,6,8])for(let i=0;i<100;i++){const items=C.sample(base.phrases,n);assert.equal(items.length,n);for(const k of ['id','semanticGroup'])assert.equal(new Set(items.map(p=>p[k])).size,n);assert.equal(new Set(items.map(p=>C.key(p.texts['zh-TW']))).size,n);}
const custom=structuredClone(base.phrases[0]);custom.id='custom-test';custom.texts={'ja-JP':'初めて来ました。','zh-TW':'我第一次來。','en-US':'This is my first time here.'};custom.readings={'ja-Hira':'はじめてきました。'};custom.relatedIds=[];custom.followUpIds=[];
const bundle={schemaVersion:1,phrases:[custom],categories:[],grammars:[]},parsed=C.parseImport(bundle,s,base);assert.deepEqual(parsed.errors,[]);const imported=C.mergeImport(s,parsed,base,false);assert.equal(imported.custom.phrases.length,1);assert.equal(C.search(C.allData(base,imported),{q:'first time'},imported).length,1);assert.equal(s.custom.phrases.length,0);
const modified=structuredClone(custom);modified.texts['zh-TW']='第一次參加。';const p2=C.parseImport({...bundle,phrases:[modified]},imported,base);assert.equal(C.mergeImport(imported,p2,base,false).custom.phrases[0].texts['zh-TW'],'我第一次來。');assert.equal(C.mergeImport(imported,p2,base,true).custom.phrases[0].texts['zh-TW'],'第一次參加。');
for(const [field,value] of [['id','__proto__'],['categoryId','missing'],['difficulty',9],['readings',{'ja-Hira':'漢字'}],['texts',{'ja-JP':'','zh-TW':'不完整'}],['audioUrl','javascript:alert(1)'],['grammarIds',['missing']],['relatedIds',['missing']]])assert.ok(C.validateBundle({...bundle,phrases:[{...custom,[field]:value}]},base).errors.length,field);
const backup={kind:'kemono-backup',schemaVersion:1,custom:imported.custom,overrides:[],user:{...imported,favorites:['custom-test'],settings:{...imported.settings,theme:'dark',rate:.75}}};const restored=C.mergeImport(C.defaults(),C.parseImport(backup,C.defaults(),base),base,true);assert.equal(restored.settings.theme,'dark');assert.equal(restored.settings.rate,.75);assert.deepEqual(restored.favorites,['custom-test']);assert.equal(restored.custom.phrases.length,1);
assert.equal(C.cleanSettings({theme:'evil',rate:200,fontSize:20}).rate,1);
console.log('PASS core: 286 phrases + 143 active words, references/readings, kana search, filters, 300 non-ambiguous samples, imports/conflicts/backup, invalid data rejection.');

assert.equal(C.search(base,{kind:'word'},s).length,143);
assert.equal(C.search(base,{kind:'phrase'},s).length,286);
for(const [cat,words,phrases] of [['parade',10,12],['private',13,24],['room',14,30],['intimacy',15,27],['sexual',23,40]]){
 assert.equal(C.search(base,{kind:'word',category:cat},s).length,words);
 assert.equal(C.search(base,{kind:'phrase',category:cat},s).length,phrases);
 assert.equal(C.sample(C.search(base,{kind:'phrase',category:cat},s),8).length,8);
}
assert.equal(base.categories.find(c=>c.id==='care').name,'界限與協助');
const heard=base.phrases.find(p=>p.id==='kp-151');
assert.match(heard.usageNote,/可能/);assert.ok(heard.followUpIds.includes('kp-153'));assert.ok(heard.followUpIds.includes('kp-155'));
assert.equal(C.search(base,{kind:'word',q:'わんないと'},s)[0].id,'kv-098');
for(const field of [{kind:'unknown'},{usageNote:23},{usageNote:'x'.repeat(1001)}])assert.ok(C.validateBundle({...bundle,phrases:[{...custom,...field}]},base).errors.length);
const legacy={kind:'kemono-backup',schemaVersion:1,custom:{phrases:[],categories:[],grammars:[]},overrides:[],user:{favorites:['kp-012'],recent:[{id:'kp-012',at:Date.now()}],records:[],settings:{rate:.75}}};
const parsedLegacy=C.parseImport(legacy,C.defaults(),base);assert.deepEqual(parsedLegacy.errors,[]);
const migrated=C.mergeImport(C.defaults(),parsedLegacy,base,true);assert.deepEqual(migrated.favorites,['kp-012']);assert.equal(C.allData(base,migrated).phrases.length,430);
console.log('PASS expansion: kind filters, 5 new scenarios, heard-to-response links, optional-field validation, legacy backup compatibility.');

assert.equal(C.search(base,{},s).length,429);
assert.equal(C.search(base,{q:'避妊'},s).length,0);
assert.equal(C.sample([base.phrases.find(p=>p.id==='kv-097')],1).length,0);
const legacyHidden={...legacy,overrides:[{...base.phrases.find(p=>p.id==='kv-097'),hidden:undefined,usageNote:'既有使用者修改'}]};
assert.deepEqual(C.parseImport(legacyHidden,C.defaults(),base).errors,[]);
assert.equal(C.search(base,{category:'photo',kind:'word'},s).length,17);
for(const id of ['kp-161','kp-168','kp-173','kp-178','kp-191','kp-192'])assert.ok(base.phrases.find(p=>p.id===id).followUpIds.length);
assert.match(base.phrases.find(p=>p.id==='kp-196').texts['zh-TW'],/幫對方/);
assert.match(base.phrases.find(p=>p.id==='kp-197').texts['zh-TW'],/接受/);
assert.ok(C.validateBundle({...bundle,phrases:[{...custom,hidden:'yes'}]},base).errors.length);
console.log('PASS new content: photography directions/poses/gaze/hands, male consent roles, retired term excluded from search/practice, older user edits remain importable.');

assert.match(base.phrases.find(p=>p.id==='kp-191').texts['ja-JP'],/してくれる/);assert.match(base.phrases.find(p=>p.id==='kp-192').texts['ja-JP'],/してもいい/);assert.ok(base.phrases.find(p=>p.id==='kp-191').followUpIds.includes('kp-196'));assert.ok(base.phrases.find(p=>p.id==='kp-192').followUpIds.includes('kp-197'));

const separated=C.search(base,{},C.defaults()),wordStart=separated.findIndex(p=>p.kind==='word');
assert.equal(wordStart,286);assert.ok(separated.slice(wordStart).every(p=>p.kind==='word'));
const recentState={...C.defaults(),recent:[{id:'kv-121',at:4},{id:'kp-203',at:3},{id:'kp-001',at:2}]};
assert.deepEqual(C.search(base,{scope:'recent'},recentState).map(p=>p.id),['kp-203','kp-001','kv-121']);
assert.equal(C.search(base,{q:'ノーゴム',kind:'word'},s)[0].id,'kv-123');
for(const [heard,response] of [['kp-203','kp-209'],['kp-215','kp-217'],['kp-219','kp-225']])assert.ok(base.phrases.find(p=>p.id===heard).followUpIds.includes(response));
const byId=Object.fromEntries(base.phrases.map(p=>[p.id,p]));
for(const pair of [['kv-096','kv-122'],['kv-121','kv-123'],['kv-126','kv-127']])assert.equal(C.sample(pair.map(id=>byId[id]),2).length,1);
console.log('PASS grouping and additions: sentences before words, recent order within groups, condom slang/conditions, indirect invitation and role-confirmation response links, synonym exclusion.');

assert.equal(C.defaults().settings.uiLanguage,'zh-TW');
assert.equal(C.cleanSettings({uiLanguage:'ja-JP',displayJapanese:false}).uiLanguage,'ja-JP');
assert.equal(C.cleanSettings({uiLanguage:'en-US'}).uiLanguage,'zh-TW');
assert.equal(C.cleanSettings({}).displayJapanese,true);
assert.equal(C.cleanSettings({displayJapanese:false}).displayJapanese,false);
assert.equal(C.search(base,{q:'写真撮影'},C.defaults()).length,53);
const jaBackup={...backup,user:{...backup.user,settings:{...backup.user.settings,uiLanguage:'ja-JP',displayJapanese:false}}};
const jaRestore=C.mergeImport(C.defaults(),C.parseImport(jaBackup,C.defaults(),base),base,true);
assert.equal(jaRestore.settings.uiLanguage,'ja-JP');assert.equal(jaRestore.settings.displayJapanese,false);
assert.equal(C.mergeImport(C.defaults(),C.parseImport(jaBackup,C.defaults(),base),base,false).settings.uiLanguage,'zh-TW');
assert.equal(migrated.settings.uiLanguage,'zh-TW');
console.log('PASS locales: Japanese metadata search, UI preferences and reverse-display backup, invalid locale fallback and legacy settings.');

for(const localizations of [{'ja-JP':{words:'not-array'}},{'ja-JP':{title:5}},{'ja-JP':null}])assert.ok(C.validateBundle({...bundle,grammars:[{...base.grammars[0],localizations}]},base).errors.length);
console.log('PASS localized metadata validation: reject malformed translated fields before rendering.');

const newRoomPhrases=base.phrases.filter(p=>/^kp-(22[7-9]|2[3-4][0-9]|250)$/.test(p.id));
assert.equal(newRoomPhrases.length,24);
for(const q of ['房號','貼貼','收下東西','暫放物品'])assert.ok(C.search(base,{q},C.defaults()).length>0,q);
for(const [source,reply] of [['kp-227','kp-228'],['kp-230','kp-233'],['kp-230','kp-234'],['kp-237','kp-240'],['kp-244','kp-248'],['kp-242','kp-243']])assert.ok(byId[source].followUpIds.includes(reply));
assert.match(byId['kp-228'].usageNote,/範例房號/);assert.match(byId['kp-228'].texts['ja-JP'],/503/);
assert.match(byId['kp-242'].texts['ja-JP'],/預か/);assert.match(byId['kp-238'].texts['ja-JP'],/受け取/);
assert.equal(C.sample([byId['kp-237'],byId['kp-238']],2).length,1);
console.log('PASS room/cuddling/items: 24 phrases and 8 words, editable example room number, visit acceptance/refusal, closeness boundaries, gift versus temporary custody, similar-question exclusion.');

const casual=C.search(base,{scope:'casual'},C.defaults());assert.equal(casual.length,36);assert.ok(casual.every(p=>p.tags.includes('朋友口語')));
assert.equal(C.search(base,{scope:'casual',category:'social'},C.defaults()).length,20);
assert.equal(C.search(base,{category:'social',kind:'word'},C.defaults()).length,11);
for(const [politeId,casualId] of base.phrases.filter(p=>/^kp-(25[1-9]|26[0-9]|270)$/.test(p.id)).map(p=>[p.relatedIds[0],p.id])){
 assert.equal(byId[politeId].semanticGroup,byId[casualId].semanticGroup);assert.equal(C.sample([byId[politeId],byId[casualId]],2).length,1);
 assert.ok(byId[politeId].relatedIds.includes(casualId));assert.ok(byId[casualId].relatedIds.includes(politeId));
}
for(const [source,reply] of [['kp-271','kp-284'],['kp-274','kp-277'],['kp-280','kp-282'],['kp-280','kp-283']])assert.ok(byId[source].followUpIds.includes(reply));
for(let i=0;i<100;i++){const items=C.sample(casual,8);assert.equal(items.length,8);assert.ok(items.every(p=>p.tags.includes('朋友口語')));assert.equal(new Set(items.map(p=>p.semanticGroup)).size,8);}
assert.ok(C.search(base,{q:'カジュアル'},C.defaults()).some(p=>p.id==='kp-280'));
console.log('PASS casual/contact: 36 casual phrases, 20 bidirectional polite counterparts, same-meaning exclusion, contact invitation/DM acceptance/refusal, casual-only sampling and Japanese-tag search.');
