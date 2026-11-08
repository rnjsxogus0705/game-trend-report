import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';

const source=await fs.readFile(new URL('../assets/report/report-theme.js',import.meta.url),'utf8');
function run(initial='system',dark=false,storageError=false){
 const saved=new Map([['game-trend-report-theme',initial]]),events={},mediaEvents={};
 const media={matches:dark,addEventListener:(name,fn)=>mediaEvents[name]=fn};
 const button={dataset:{},attrs:{},querySelector:()=>button.text,addEventListener:(name,fn)=>events[name]=fn,setAttribute:(name,value)=>button.attrs[name]=value,text:{textContent:''}};
 const doc={documentElement:{dataset:{}},readyState:'complete',querySelector:()=>({querySelector:()=>null,insertBefore(){}}),getElementById:()=>null,createElement:()=>button};
 const storage={getItem:k=>{if(storageError)throw Error('blocked');return saved.get(k)},setItem:(k,v)=>{if(storageError)throw Error('blocked');saved.set(k,v)}};
 vm.runInNewContext(source,{document:doc,localStorage:storage,matchMedia:()=>media,addEventListener:(name,fn)=>events[name]=fn});
 return {doc,button,saved,media,events,mediaEvents};
}
test('시스템·라이트·다크 순환과 저장, 시스템 변경 및 인쇄 복원',()=>{
 const x=run('system',true);assert.equal(x.doc.documentElement.dataset.theme,'dark');assert.equal(x.button.text.textContent,'시스템');
 x.events.click();assert.equal(x.doc.documentElement.dataset.theme,'light');assert.equal(x.saved.get('game-trend-report-theme'),'light');
 x.events.click();assert.equal(x.doc.documentElement.dataset.theme,'dark');
 x.events.beforeprint();assert.equal(x.doc.documentElement.dataset.theme,'light');x.events.afterprint();assert.equal(x.doc.documentElement.dataset.theme,'dark');
 x.events.click();x.media.matches=false;x.mediaEvents.change();assert.equal(x.doc.documentElement.dataset.theme,'light');assert.equal(x.button.text.textContent,'시스템');
});
test('저장소가 차단되어도 테마 전환은 작동한다',()=>{const x=run('dark',false,true);x.events.click();assert.equal(x.doc.documentElement.dataset.theme,'light');x.events.click();assert.equal(x.doc.documentElement.dataset.theme,'dark');});
