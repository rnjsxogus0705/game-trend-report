import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';

test('모두 펼침은 생성 그룹과 기존·추가 네이티브 원문 상세를 함께 토글한다',async()=>{
 const first={open:false},native={open:false},navigation={open:false},details=[first,native],buttons=[];
 const main={querySelectorAll:selector=>selector==='section.chapter'?[]:selector==='#report details'?details:selector==='details'?[navigation,...details]:[first],querySelector:()=>({after(){}})};
 const document={querySelector:()=>main,querySelectorAll:()=>[],getElementById:()=>null,addEventListener(){},createElement:tag=>({setAttribute(){},append(node){if(tag==='div')buttons.push(node);},addEventListener(type,callback){this[type]=callback;}})};
 const source=await fs.readFile(new URL('../assets/report/reading-experience.js',import.meta.url),'utf8');
 vm.runInNewContext(source,{document,globalThis:{},addEventListener(){},location:{hash:''},requestAnimationFrame(){}});
 assert.equal(buttons.length,2);buttons[0].click();assert.deepEqual(details.map(x=>x.open),[true,true]);assert.equal(navigation.open,false);
 const added={open:false};details.push(added);buttons[0].click();assert.equal(added.open,true);
 navigation.open=true;buttons[1].click();assert.ok(details.every(x=>x.open===false));assert.equal(navigation.open,true);
});
