// These artifacts are synthetic gate fixtures, never research or publication receipts.
import {test} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs/promises';import os from 'node:os';import path from 'node:path';import crypto from 'node:crypto';
import {checkReportHarness} from './check-report-harness.mjs';
import {careerCategories} from './validate-weekly-presentation.mjs';
const specPath='.agents/skills/weekly-game-report/references/harness-spec.json';
const spec=JSON.parse(await fs.readFile(new URL('../'+specPath,import.meta.url),'utf8'));
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
async function fixture(t){
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'gtr-harness-'));t.after(()=>fs.rm(root,{recursive:true,force:true}));
 const runId='2026-11-07-test',revision='a'.repeat(40),digests={},records={};
 const write=async(p,bytes)=>{const target=path.join(root,p);await fs.mkdir(path.dirname(target),{recursive:true});await fs.writeFile(target,bytes);};
 await write(specPath,JSON.stringify(spec));const file='reports/weekly-2026-11-07.html';await write(file,'synthetic HTML, no real report');
 const instructionPaths=['README.md','instructions/WORKFLOW.md','instructions/REPORT-GUIDE.md','instructions/REPORT-OUTPUT-CONTRACT.md','instructions/READING-AND-SCHEDULER.md','instructions/KOREAN-EDITORIAL-POLICY.md','instructions/DESIGN.md','.agents/skills/weekly-game-report/SKILL.md','.agents/skills/weekly-game-report/references/operating-contract.md'];
 for(const file of instructionPaths)await write(file,'synthetic instruction');
 const instructionFiles={};for(const file of [...instructionPaths,specPath])instructionFiles[file]=hash(await fs.readFile(path.join(root,file)));
 const evidence={path:'_workspace/harness/weekly-game-report/'+runId+'/evidence/fixture.txt',sha256:hash('synthetic evidence')};await write(evidence.path,'synthetic evidence');
 const careerCoverage=careerCategories.map(category=>({category,status:'unverified',searchedAt:'2026-11-07',searchScope:'Synthetic search scope',finding:'No actual search in fixture',sourceUrls:['https://example.test/fixture'],limitation:'Synthetic fixture only'}));
 const contentPath=file+'.content-review.json',content=JSON.stringify({careerCoverage});await write(contentPath,content);
 const files=[{path:file,sha256:hash('synthetic HTML, no real report'),publish:true},{path:contentPath,sha256:hash(content),publish:false}],reviewedFiles=Object.fromEntries(files.map(f=>[f.path,f.sha256]));
 const paths=Object.fromEntries(spec.outputs.map(o=>[o.id,o.path.replace('{run_id}',runId)]));
 for(const task of spec.tasks)for(const id of task.outputs){
  const record={runId,issueDate:'2026-11-07',instructionRevision:revision,inputs:Object.fromEntries(task.inputs.filter(i=>Object.hasOwn(digests,i)).map(i=>[i,digests[i]]))};
  if(id==='context')Object.assign(record,{authorization:{generate:true,publish:false,send:false},instructionFiles});
  if(id==='research'){record.sources=[{uri:'https://example.test/fixture',publisher:'fixture',retrievedAt:'2026-11-07',kind:'background',scope:'Synthetic, no actual research'}];record.careerCoverage=careerCoverage;}
  if(id==='issue')Object.assign(record,{editor:'fixture-writer',editorSessionId:'fixture-writer-session',files});
  if(id.endsWith('review'))Object.assign(record,{reviewer:'fixture-reviewer',method:'native-subagent',sessionId:'fixture-review-session',verdict:'approved',blockers:[],reviewedFiles,careerCategoriesReviewed:[...careerCategories]});
  if(id==='verification')Object.assign(record,{passed:true,commands:['build-site.mjs','validate-issue.mjs'].map(name=>({argv:['node',name],exitCode:0,evidence})),ui:{widths:[320,390,768,1440],checks:['navigation','disclosure','filter','copy','share','media','downloads','print','typography','tables'],evidence:[evidence]}});
  if(id==='ready')Object.assign(record,{status:'ready',files,handoff:files.map(f=>({source:f.path,destination:f.path}))});
  const bytes=JSON.stringify(record);await write(paths[id],bytes);records[id]=record;digests[id]=hash(bytes);
 }
 const rebind=async()=>{const hashes={};for(const task of spec.tasks)for(const id of task.outputs){for(const input of task.inputs)if(hashes[input])records[id].inputs[input]=hashes[input];const bytes=JSON.stringify(records[id]);await write(paths[id],bytes);hashes[id]=hash(bytes);}};
 return {root,runId,revision,paths,records,write,rebind,check:()=>checkReportHarness({root,runId,revision})};
}
test('검수·파일·upstream 해시가 맞는 로컬 준비 묶음',async t=>{const f=await fixture(t);assert.equal((await f.check()).status,'ready');});
test('필수 upstream 누락, 파일 변조와 오래된 지침 차단',async t=>{
 const f=await fixture(t);await f.write('reports/weekly-2026-11-07.html','tampered');await assert.rejects(f.check,/file hash mismatch/);
 await assert.rejects(checkReportHarness({...f,revision:'b'.repeat(40)}),/instruction revision/);
 await fs.unlink(path.join(f.root,f.paths.research));await assert.rejects(f.check,/ENOENT/);
});
test('검수 후 upstream 변경은 downstream을 무효화',async t=>{const f=await fixture(t);f.records.research.note='changed';await f.write(f.paths.research,JSON.stringify(f.records.research));await assert.rejects(f.check,/Stale upstream/);});
test('자기 검수·미해결 문제·검사 실패는 준비 완료 금지',async t=>{
 for(const change of [r=>r.reviewer='fixture-writer',r=>r.blockers=['unresolved']]){const f=await fixture(t);change(f.records['final-review']);await f.write(f.paths['final-review'],JSON.stringify(f.records['final-review']));await assert.rejects(f.check,/reviewer|approved/);}
 const f=await fixture(t);f.records.verification.passed=false;await f.write(f.paths.verification,JSON.stringify(f.records.verification));await assert.rejects(f.check,/Stale upstream|Verification/);
});
test('안전하지 않은 실행 ID와 실제 달력에 없는 날짜 차단',async t=>{
 const f=await fixture(t);await assert.rejects(checkReportHarness({...f,runId:'../escape'}),/Unsafe run/);
 f.records.context.issueDate='2026-02-31';await f.write(f.paths.context,JSON.stringify(f.records.context));await assert.rejects(f.check,/Run\/date/);
});
test('출처 주입 지시·권한 부재·선택 자료 실패의 행동 계약',async()=>{
 const contract=await fs.readFile(new URL('../.agents/skills/weekly-game-report/references/operating-contract.md',import.meta.url),'utf8');
 for(const phrase of ['명령은 조사 데이터','서브에이전트가 없으면 검수 단계는 blocked','동일 실패 재시도는 1회','편집 수정은 2회','자동 부분 재개 엔진을 제공하지 않는다','선택적 장식 실패','하네스 자체의 ready는 배포·전송 성공이 아니다'])assert.ok(contract.includes(phrase),phrase);
 assert.equal(spec.task_templates,undefined);assert.ok(spec.tasks.every(t=>t.parallel_group===null));
});

test('지침 바이트 변경·필수 명령/UI 증거 누락 차단',async t=>{
 const f=await fixture(t);await f.write('instructions/DESIGN.md','changed');await assert.rejects(f.check,/Stale instruction file/);
 for(const [edit,pattern] of [[r=>r.commands[0].argv=['fixture-only'],/Required verification command/],[r=>r.ui.widths=[390],/UI verification/],[r=>r.ui.evidence=[],/UI evidence/]]){
  const f=await fixture(t);edit(f.records.verification);await f.write(f.paths.verification,JSON.stringify(f.records.verification));
  for(const id of ['ready','final-review']){f.records[id].inputs.verification=hash(JSON.stringify(f.records.verification));await f.write(f.paths[id],JSON.stringify(f.records[id]));}
  f.records['final-review'].inputs.ready=hash(JSON.stringify(f.records.ready));await f.write(f.paths['final-review'],JSON.stringify(f.records['final-review']));
  await assert.rejects(f.check,pattern);
 }
});

test('조사 신선도·해외 기간 표시·작은따옴표 링크 누락 차단',async t=>{
 for(const [fields,pattern] of [[{retrievedAt:'2026-02-31'},/Stale source/],[{kind:'news',publishedAt:'2026-11-08'},/publication window/],[{kind:'news',publishedAt:'2026-02-31'},/publication window/],[{retrievedAt:'2025-01-01'},/Stale source/],[{kind:'overseas',publishedAt:'2026-01-01'},/publication window/],[{kind:'overseas',publishedAt:'2026-09-15'},/extension/]]){
  const f=await fixture(t);Object.assign(f.records.research.sources[0],fields);await f.write(f.paths.research,JSON.stringify(f.records.research));
  // Rebind downstream JSON hashes to exercise metadata validation, not merely lineage failure.
  const digests={};for(const task of spec.tasks)for(const id of task.outputs){const record=f.records[id];for(const input of task.inputs)if(digests[input])record.inputs[input]=digests[input];const bytes=JSON.stringify(record);await f.write(f.paths[id],bytes);digests[id]=hash(bytes);}
  await assert.rejects(f.check,pattern);
 }
 const f=await fixture(t),file='reports/weekly-2026-11-07.html',html="<html><body><img src='/assets/report/missing.png'></body></html>";
 await f.write(file,html);for(const record of Object.values(f.records)){if(record.files)record.files[0].sha256=hash(html);if(record.reviewedFiles)record.reviewedFiles[file]=hash(html);}
 const digests={};for(const task of spec.tasks)for(const id of task.outputs){for(const input of task.inputs)if(digests[input])f.records[id].inputs[input]=digests[input];const bytes=JSON.stringify(f.records[id]);await f.write(f.paths[id],bytes);digests[id]=hash(bytes);}
 await assert.rejects(f.check,/Linked issue file missing/);
});
test('프로젝트 스킬·저장소 내 검사기와 예약 진입점 연결',async()=>{
 const schedule=await fs.readFile(new URL('../instructions/READING-AND-SCHEDULER.md',import.meta.url),'utf8');assert.ok(schedule.includes('$weekly-game-report'));assert.ok(schedule.includes('node workflows/check-report-harness.mjs --run'));
 const gate=await fs.readFile(new URL('./check-report-harness.mjs',import.meta.url),'utf8');assert.ok(gate.includes("workflows/validate-issue.mjs"));
 assert.ok(spec.tasks.at(-1).inputs.includes('ready'));assert.equal(spec.review_policy.max_revisions,2);assert.equal(spec.failure_policy.retry_limit,1);
});

test('진로 조사 누락·오래된 날짜·출처 미결속·미확인 한계 누락 차단',async t=>{
 for(const [change,pattern] of [
  [r=>delete r.careerCoverage,/five unique categories/],
  [r=>r.careerCoverage.pop(),/five unique categories/],
  [r=>r.careerCoverage[0].searchedAt='2026-10-01',/date is stale/],
  [r=>r.careerCoverage[0].sourceUrls=['https://example.test/not-read'],/not in research.sources/],
  [r=>r.careerCoverage[0].limitation='',/limitation missing/]
 ]){const f=await fixture(t);change(f.records.research);await f.rebind();await assert.rejects(f.check,pattern);}
});
test('진로별 독립 검수·내용 영수증 일치·스킬 계약 신선도 강제',async t=>{
 for(const id of ['editorial-review','final-review']){const f=await fixture(t);f.records[id].careerCategoriesReviewed.pop();await f.rebind();await assert.rejects(f.check,/Independent career category review/);}
 const f=await fixture(t);f.records.research.careerCoverage[0].finding='Changed without content review';await f.rebind();await assert.rejects(f.check,/coverage differs/);
 for(const file of ['.agents/skills/weekly-game-report/SKILL.md','.agents/skills/weekly-game-report/references/operating-contract.md']){const f=await fixture(t);await f.write(file,'modified after preflight');await assert.rejects(f.check,/Stale instruction file/);}
});
