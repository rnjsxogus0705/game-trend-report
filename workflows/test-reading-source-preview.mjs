import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';

test('출처의 카드 영상은 복제하지 않고 다른 섹션 미리보기 탐색은 유지한다',async()=>{
 const source=await fs.readFile(new URL('../assets/report/reading-experience-scoped-v2.js',import.meta.url),'utf8');
 const start=source.indexOf('  function showMedia(section,head){');
 const end=source.indexOf('  function showSkillVideos(section,head){',start);
 assert.ok(start>=0&&end>start);
 const showMedia=vm.runInNewContext('('+source.slice(start,end).trim()+')');
 let queries=0;
 const section=id=>({id,querySelector(){queries++;return null;}});
 showMedia(section('sources'),{});
 assert.equal(queries,0,'출처 목록에서 카드의 영상을 재복제하지 않는다');
 showMedia(section('games'),{});
 assert.equal(queries,1,'다른 섹션의 미디어 탐색은 그대로 시작한다');
});
