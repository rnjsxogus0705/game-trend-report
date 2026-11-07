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
  await fs.writeFile(path.join(site,'reports','monthly-2026-09.html'),content);
  await buildSite({source,site});
  assert.equal(await fs.readFile(path.join(site,'reports','weekly-2026-10-31.html'),'utf8'),content);
  assert.match(await fs.readFile(path.join(site,'index.html'),'utf8'),/전체 2개 리포트/);
  await fs.writeFile(path.join(source,'weekly-2026-11-07.html'),'<h2>빈 보고서</h2>');
  await assert.rejects(buildSite({source,site}),/lacks substantive research/);
 }finally{await fs.rm(base,{recursive:true,force:true});}
});
test('추가 Markdown은 명시한 첨부만 게시하고 미연결 문서는 중단',async()=>{
 const base=await fs.mkdtemp(path.join(os.tmpdir(),'gtr-attachments-'));
 try{
  const source=path.join(base,'reports'),site=path.join(base,'site');await fs.mkdir(source);
  const name='weekly-2026-11-07-tool-comparison.md',body='첨부 비교 내용 '.repeat(100);
  const html='<h2>분석</h2>'.repeat(5)+'<a href="https://example.com">출처</a>'.repeat(5)+'확인일 '+'조사 '.repeat(1500)+`<a href="${name}" download>비교표</a>`;
  await fs.writeFile(path.join(source,'weekly-2026-11-07.html'),html);await fs.writeFile(path.join(source,name),body);
  await buildSite({site,source});assert.equal(await fs.readFile(path.join(site,'reports',name),'utf8'),body);
  await fs.writeFile(path.join(source,'weekly-2026-11-07-private-notes.md'),body);
  await assert.rejects(buildSite({site,source}),/explicitly linked/);
 }finally{await fs.rm(base,{recursive:true,force:true});}
});

test('삭제한 월간호는 이전 PC의 원본·출력에 남아 있어도 복원하지 않음',async t=>{
 const base=await fs.mkdtemp(path.join(os.tmpdir(),'gtr-withdrawn-'));t.after(()=>fs.rm(base,{recursive:true,force:true}));
 const source=path.join(base,'source'),site=path.join(base,'site');await fs.mkdir(source);await fs.mkdir(path.join(site,'reports'),{recursive:true});
 const name='monthly-2026-10.html';await fs.writeFile(path.join(source,name),'withdrawn');await fs.writeFile(path.join(site,'reports',name),'withdrawn');
 await buildSite({source,site});await assert.rejects(fs.access(path.join(site,'reports',name)),{code:'ENOENT'});
 assert.ok(!(await fs.readFile(path.join(site,'index.html'),'utf8')).includes(name));assert.ok(!renderIndex([issue(name)]).includes(name));
});

test('일정은 제작 시작 시각과 검수 후 전송을 구분한다',()=>{
 const html=renderIndex([]);assert.match(html,/매주 토요일 오전 8시 제작 시작 · 한국 시간/);assert.match(html,/토요일 08:00 제작 시작 · 검수 및 배포 완료 후 전송/);assert.doesNotMatch(html,/07:00|08:00 링크 전송/);
});
