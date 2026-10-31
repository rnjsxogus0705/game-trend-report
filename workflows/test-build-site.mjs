import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {renderIndex,buildSite} from './build-site.mjs';
const issue=(name,title='테스트 리포트')=>({name,title,description:'실제 조사 설명',type:name.startsWith('weekly')?'weekly':'monthly',date:name.replace(/^(weekly|monthly)-|\.html$/g,'')});
test('최신 버튼은 더 최근 월간이 있어도 최신 주간을 연다',()=>{
 const html=renderIndex([issue('monthly-2026-11.html'),issue('weekly-2026-10-24.html'),issue('weekly-2026-10-31.html')]);
 assert.match(html,/class="primary-link" href="reports\/weekly-2026-10-31.html"/);
 assert.ok(html.indexOf('2026년 11월')<html.indexOf('2026년 10월'));
 assert.equal((html.match(/class="month-group"/g)||[]).length,2);
 assert.equal((html.match(/data-default-open="true"/g)||[]).length,1);
 assert.match(html,/<option value="2026">2026년/);
});
test('주간 없음·빈 목록·제목 이스케이프',()=>{
 assert.match(renderIndex([issue('monthly-2026-10.html')]),/class="primary-link" href="reports\/welcome.html"/);
 assert.match(renderIndex([]),/첫 리포트를 준비하고 있어요/);
 const html=renderIndex([issue('weekly-2026-10-31.html','<img src=x onerror="alert(1)">')]);
 assert.ok(!html.includes('<img src=x'));
 assert.match(html,/&lt;img src=x onerror=&quot;alert\(1\)&quot;&gt;/);
});
test('동기화 환경의 과거 호 보존과 콘텐츠 검증',async()=>{
 const base=await fs.mkdtemp(path.join(os.tmpdir(),'gtr-build-'));
 try {
  const source=path.join(base,'reports'),site=path.join(base,'site');
  await fs.mkdir(source);await fs.mkdir(path.join(site,'reports'),{recursive:true});
  const content='<html lang="ko"><title>검증된 보고서</title><meta name="description" content="확인한 근거"><body>'+ '<h2>분석</h2>'.repeat(5)+'<a href="https://example.com">원문</a>'.repeat(5)+'확인일 '+'조사 결과 '.repeat(1000)+'</body></html>';
  await fs.writeFile(path.join(source,'weekly-2026-10-31.html'),content);
  await fs.writeFile(path.join(site,'reports','monthly-2026-10.html'),content);
  await buildSite({source,site});
  assert.equal(await fs.readFile(path.join(site,'reports','weekly-2026-10-31.html'),'utf8'),content);
  assert.match(await fs.readFile(path.join(site,'index.html'),'utf8'),/전체 2개 리포트/);
  await fs.writeFile(path.join(source,'weekly-2026-11-07.html'),'<h2>빈 보고서</h2>');
  await assert.rejects(buildSite({source,site}),/lacks substantive research/);
 }finally{await fs.rm(base,{recursive:true,force:true});}
});
