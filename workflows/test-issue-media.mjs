import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';

test('영상은 클릭 후 검증된 ID로만 임베드하고 전체화면·대체 링크를 유지한다',async()=>{
 const source=await fs.readFile(new URL('../reports/weekly-2026-11-07.js',import.meta.url),'utf8');
 const listeners={},created=[],nodes={'tool-goal':{addEventListener(){}},'print-button':{addEventListener(){}},'read-percent':{},'read-bar':{style:{}}};
 const document={documentElement:{scrollHeight:1000},addEventListener:(type,fn)=>listeners[type]=fn,getElementById:id=>nodes[id],createElement:tag=>{const node={tag};created.push(node);return node;}};
 vm.runInNewContext(source,{document,window:{print(){}},addEventListener(){},innerHeight:1000,scrollY:0,navigator:{clipboard:{}}});
 assert.equal(created.length,0);
 let inserted,removed=false;
 const play={dataset:{playVideo:'abcdefghijk',videoTitle:'공식 제작 시연'},parentElement:{querySelector:()=>({replaceChildren:node=>inserted=node})},remove:()=>removed=true};
 await listeners.click({target:{closest:()=>play}});
 assert.equal(inserted.src,'https://www.youtube-nocookie.com/embed/abcdefghijk');
 assert.equal(inserted.title,'공식 제작 시연');assert.equal(inserted.allowFullscreen,true);
 assert.equal(inserted.loading,'lazy');assert.match(inserted.allow,/picture-in-picture/);assert.equal(removed,true);
 play.dataset.playVideo='bad/path?autoplay=1';await listeners.click({target:{closest:()=>play}});assert.equal(created.length,1);
 play.dataset.playVideo='abcdefghijk';play.parentElement.querySelector=()=>null;
 await listeners.click({target:{closest:()=>play}});assert.equal(created.length,1);
});
