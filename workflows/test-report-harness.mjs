// These artifacts are synthetic gate fixtures, never research or publication receipts.
import {test} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs/promises';import os from 'node:os';import path from 'node:path';import crypto from 'node:crypto';
import {checkReportHarness} from './check-report-harness.mjs';
import {verifyDeliveryHarness} from './discord-delivery.mjs';
import {careerCategories} from './validate-weekly-presentation.mjs';
import {DatabaseSync} from 'node:sqlite';import {execFileSync} from 'node:child_process';
const specPath='.agents/skills/weekly-game-report/references/harness-spec.json';
const spec=JSON.parse(await fs.readFile(new URL('../'+specPath,import.meta.url),'utf8'));
const watchlistPath='instructions/AI-SOLO-CREATOR-WATCHLIST.json';
const watchlist=JSON.parse(await fs.readFile(new URL('../'+watchlistPath,import.meta.url),'utf8'));
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const ledgerLink='<a href="../assets/report/research/ai-solo-creators-2026-11-07.json">영상 원장</a>';
const syntheticHtml='<html><body><main id="report">synthetic HTML, no real report'+ledgerLink+'</main></body></html>';
async function fixture(t){
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'gtr-harness-'));t.after(()=>fs.rm(root,{recursive:true,force:true}));
 const runId='2026-11-07-test',revision='a'.repeat(40),digests={},records={};
 const write=async(p,bytes)=>{const target=path.join(root,p);await fs.mkdir(path.dirname(target),{recursive:true});await fs.writeFile(target,bytes);};
 await write(specPath,JSON.stringify(spec));const file='reports/weekly-2026-11-07.html';await write(file,syntheticHtml);
 const instructionPaths=['README.md','DESIGN.md','instructions/WORKFLOW.md','instructions/REPORT-GUIDE.md','instructions/REPORT-OUTPUT-CONTRACT.md','instructions/READING-AND-SCHEDULER.md','instructions/KOREAN-EDITORIAL-POLICY.md','instructions/DESIGN.md','instructions/QUALITY-PIPELINE.md','instructions/FORMAT-REFERENCE.md','.agents/skills/weekly-game-report/references/report-format-reference.json','.agents/skills/weekly-game-report/references/section-templates.json','.codex/agents/report-content-reviewer.toml','.codex/agents/report-ui-reviewer.toml','.codex/agents/report-orchestrator.toml','.codex/agents/report-section-writer.toml','.agents/skills/weekly-game-report/SKILL.md','.agents/skills/weekly-game-report/references/operating-contract.md'];
 for(const file of instructionPaths)await write(file,'synthetic instruction');await write(watchlistPath,JSON.stringify(watchlist));
 await write('assets/report/DESIGN.md','synthetic instruction');
 const instructionFiles={};for(const file of [...instructionPaths,specPath,watchlistPath])instructionFiles[file]=hash(await fs.readFile(path.join(root,file)));
 const evidence={path:'_workspace/harness/weekly-game-report/'+runId+'/evidence/fixture.txt',sha256:hash('synthetic evidence')};await write(evidence.path,'synthetic evidence');
 const careerCoverage=careerCategories.map(category=>({category,status:'unverified',searchedAt:'2026-11-07',searchScope:'Synthetic search scope',finding:'No actual search in fixture',sourceUrls:['https://example.test/fixture'],limitation:'Synthetic fixture only'}));
 const contentPath=file+'.content-review.json',content=JSON.stringify({careerCoverage});await write(contentPath,content);
 const ledgerPath='assets/report/research/ai-solo-creators-2026-11-07.json',ledger=JSON.stringify({reportDate:'2026-11-07',videos:[]});await write(ledgerPath,ledger);
 const pipelinePath=file+'.pipeline.json',summaryPath=file+'.summary.txt',pipeline=JSON.stringify({runId,summarySha256:hash('synthetic summary')});await write(pipelinePath,pipeline);await write(summaryPath,'synthetic summary');
 const files=[{path:file,sha256:hash(syntheticHtml),publish:true},{path:contentPath,sha256:hash(content),publish:false},{path:ledgerPath,sha256:hash(ledger),publish:true},{path:pipelinePath,sha256:hash(pipeline),publish:false},{path:summaryPath,sha256:hash('synthetic summary'),publish:false}],reviewedFiles=Object.fromEntries(files.map(f=>[f.path,f.sha256]));
 const paths=Object.fromEntries(spec.outputs.map(o=>[o.id,o.path.replace('{run_id}',runId)]));
 for(const task of spec.tasks)for(const id of task.outputs){
  const record={runId,issueDate:'2026-11-07',instructionRevision:revision,inputs:Object.fromEntries(task.inputs.filter(i=>Object.hasOwn(digests,i)).map(i=>[i,digests[i]]))};
  if(id==='context')Object.assign(record,{authorization:{generate:true,publish:false,send:false},instructionFiles});
  if(id==='research'){record.sources=[{uri:'https://example.test/fixture',publisher:'fixture',retrievedAt:'2026-11-07',kind:'background',scope:'Synthetic, no actual research'},...watchlist.referenceVideos.map(v=>({uri:v.videoUrl,publisher:'fixture',retrievedAt:'2026-11-07',kind:'background',scope:'Synthetic reference'}))];record.careerCoverage=careerCoverage;record.creatorContentSearch={channels:watchlist.channels.map(({handle})=>({handle,status:'unverified',searchedAt:'2026-11-07',sourceUrls:['https://example.test/fixture'],finding:'Synthetic fixture only',limitation:'Synthetic fixture only'})),referenceVideos:watchlist.referenceVideos.map(v=>({videoId:v.videoId,status:'unverified',searchedAt:'2026-11-07',sourceUrls:[v.videoUrl],finding:'Synthetic fixture only',limitation:'Synthetic fixture only'})),selectedVideos:[],discovery:{searchedAt:'2026-11-07',queries:['AI 게임 개발','AI game development'],sourceUrls:[],finding:'Synthetic search; no actual discovery'},duplicateReview:{searchedAt:'2026-11-07',priorIssuePaths:[],finding:'Synthetic first issue; no prior ledger'}};record.openSourceToolSearch={status:'unverified',searchedAt:'2026-11-07',searchScope:'Synthetic open-source tools search',finding:'No actual search',sourceUrls:['https://example.test/fixture'],limitation:'Synthetic fixture only',publicAssets:{status:'unverified',searchedAt:'2026-11-07',searchScope:'Synthetic public assets search',finding:'No actual search',sourceUrls:['https://example.test/fixture'],limitation:'Synthetic fixture only'}};}
  if(id==='issue')Object.assign(record,{editor:'fixture-writer',editorSessionId:'fixture-writer-session',files});
  if(id.endsWith('review'))Object.assign(record,{reviewer:'fixture-reviewer',method:'native-subagent',sessionId:'fixture-review-session',verdict:'approved',blockers:[],reviewedFiles,publicAssetsReviewed:true,careerCategoriesReviewed:[...careerCategories],referenceVideoIdsReviewed:watchlist.referenceVideos.map(v=>v.videoId)});
  if(id==='verification')Object.assign(record,{passed:true,commands:['build-site.mjs','validate-issue.mjs'].map(name=>({argv:['node',name],exitCode:0,evidence})),ui:{widths:[320,390,768,1440],checks:['navigation','disclosure','filter','copy','share','media','downloads','print','typography','tables'],evidence:[evidence]}});
  if(id==='ready')Object.assign(record,{status:'ready',files,handoff:files.filter(f=>f.path.startsWith('reports/')).map(f=>({source:f.path,destination:f.path}))});
  const bytes=JSON.stringify(record);await write(paths[id],bytes);records[id]=record;digests[id]=hash(bytes);
 }
 const rebind=async()=>{const hashes={};for(const task of spec.tasks)for(const id of task.outputs){for(const input of task.inputs)if(hashes[input])records[id].inputs[input]=hashes[input];const bytes=JSON.stringify(records[id]);await write(paths[id],bytes);hashes[id]=hash(bytes);}};
 return {root,runId,revision,paths,records,write,rebind,check:()=>checkReportHarness({root,runId,revision})};
}
async function correctionFixture(t){
 const f=await fixture(t),previousIssueSha256=hash(syntheticHtml),checkedAt='2026-11-08T12:00:00+09:00',priorRunId='2026-11-07-prior';
 execFileSync('git',['init','-q'],{cwd:f.root});execFileSync('git',['config','user.email','fixture@example.test'],{cwd:f.root});execFileSync('git',['config','user.name','Fixture'],{cwd:f.root});execFileSync('git',['add','reports/weekly-2026-11-07.html'],{cwd:f.root});execFileSync('git',['commit','-qm','prior issue'],{cwd:f.root});
 const gitCommit=execFileSync('git',['rev-parse','HEAD'],{cwd:f.root,encoding:'utf8'}).trim(),ledgerPath=path.join(f.root,'_workspace/weekly-game-report.sqlite3');await fs.mkdir(path.dirname(ledgerPath),{recursive:true});
 const ledgerDb=new DatabaseSync(ledgerPath);ledgerDb.exec('CREATE TABLE receipt_records(run TEXT,kind TEXT,path TEXT,sha256 TEXT,document TEXT)');
 const priorPublicationEvidence=[];
 for(const provider of ['pages','vercel']){
  const path='_workspace/harness/weekly-game-report/'+f.runId+'/evidence/prior-'+provider+'.json';
  const sourcePath='reports/weekly-2026-11-07.html.'+(provider==='pages'?'published':'vercel-published')+'.json';
  const url=provider==='pages'?'https://rnjsxogus0705.github.io/game-trend-report/reports/weekly-2026-11-07.html':'https://game-trend-report.vercel.app/reports/weekly-2026-11-07.html';
  const browserPath='_workspace/harness/weekly-game-report/'+f.runId+'/evidence/prior-'+provider+'.png',browserBytes='synthetic '+provider+' browser evidence';await f.write(browserPath,browserBytes);
  const bytes=JSON.stringify({schemaVersion:1,runId:priorRunId,issueDate:'2026-11-07',provider,url,verifiedAt:'2026-11-08T01:00:00Z',gitCommit,sha256:previousIssueSha256,status:'published_verified',verificationScope:'Synthetic prior publication verification',files:[{path:'reports/weekly-2026-11-07.html',url,status:200,expectedSha256:previousIssueSha256,sha256:previousIssueSha256,bytes:Buffer.byteLength(syntheticHtml),matched:true}],browserEvidence:[{path:browserPath,sha256:hash(browserBytes)}]});
  await f.write(path,bytes);await f.write(sourcePath,bytes);priorPublicationEvidence.push({path,sourcePath,sha256:hash(bytes)});
  ledgerDb.prepare('INSERT INTO receipt_records VALUES(?,?,?,?,?)').run(priorRunId,'publication',sourcePath,hash(bytes),bytes);
 }
 ledgerDb.close();
 f.records.context.correction={checkedAt,previousIssueSha256,priorRunId,reason:'발행 후 원문 재확인과 화면 수정',priorPublicationEvidence};
 f.records.research.correctionSources=[{uri:'https://example.test/correction',publisher:'fixture correction',retrievedAt:'2026-11-08',kind:'correction',scope:'발행 후 정정 근거만 확인',limitation:'2026-11-07 발행 당시 확인으로 소급하지 않음'}];
 const htmlPath='reports/weekly-2026-11-07.html',html=syntheticHtml.replace('</main>','<aside id="correction-notice" data-correction-date="2026-11-08">2026년 11월 8일 사후 정정 안내</aside></main>'),currentIssueSha256=hash(html);
 await f.write(htmlPath,html);f.records.issue.files.find(file=>file.path===htmlPath).sha256=currentIssueSha256;
 f.records.issue.correction={checkedAt,previousIssueSha256,currentIssueSha256,reason:f.records.context.correction.reason};
 for(const id of ['editorial-review','final-review'])Object.assign(f.records[id],{correctionReviewed:true,correctionCheckedAt:checkedAt,previousIssueSha256,currentIssueSha256,correctionSourcesReviewed:['https://example.test/correction'],reviewedFiles:{...f.records[id].reviewedFiles,[htmlPath]:currentIssueSha256}});
 await f.rebind();return {...f,htmlPath,previousIssueSha256,checkedAt};
}
test('검수·파일·upstream 해시가 맞는 로컬 준비 묶음',async t=>{const f=await fixture(t);assert.equal((await f.check()).status,'ready');});
test('발행 후 정정은 실제 확인일·전후 해시·두 배포 영수증·독립 검수에 결속된다',async t=>{
 const f=await correctionFixture(t);assert.equal((await f.check()).status,'ready');
});
test('긴 script·style 뒤 정정 고지를 실제 위치에서 확인한다',async t=>{
 const f=await correctionFixture(t),file=f.htmlPath;
 const old=await fs.readFile(path.join(f.root,file),'utf8');
 const html=old.replace('<main id="report">','<style>.example::before{content:"<p>🕹"}</style><script>const value="<span>가짜 고지</span>";</script><main id="report">');
 const current=hash(html);await f.write(file,html);f.records.issue.files.find(item=>item.path===file).sha256=current;f.records.issue.correction.currentIssueSha256=current;
 for(const id of ['editorial-review','final-review']){f.records[id].currentIssueSha256=current;f.records[id].reviewedFiles[file]=current;}
 await f.rebind();assert.equal((await f.check()).status,'ready');
});
test('사후 재확인은 별도 관측을 보존하고 정정 출처 내 중복을 차단한다',async t=>{
 const futureWeekly=await correctionFixture(t);futureWeekly.records.research.sources[0].retrievedAt='2026-11-08';await futureWeekly.rebind();await assert.rejects(futureWeekly.check,/Stale source retrieval/);
 const duplicate=await correctionFixture(t);duplicate.records.research.correctionSources[0].uri=duplicate.records.research.sources[0].uri;for(const id of ['editorial-review','final-review'])duplicate.records[id].correctionSourcesReviewed=[duplicate.records.research.sources[0].uri];await duplicate.rebind();assert.equal((await duplicate.check()).status,'ready');
 const weeklyAlias=await correctionFixture(t);weeklyAlias.records.research.correctionSources[0].uri='https://EXAMPLE.TEST/fixture/?utm_source=weekly#top';for(const id of ['editorial-review','final-review'])weeklyAlias.records[id].correctionSourcesReviewed=['https://EXAMPLE.TEST/fixture/?utm_source=weekly#top'];await weeklyAlias.rebind();assert.equal((await weeklyAlias.check()).status,'ready');
 const correctionAlias=await correctionFixture(t),alias={...correctionAlias.records.research.correctionSources[0],uri:'https://EXAMPLE.TEST/correction/?utm_medium=test#fragment'};correctionAlias.records.research.correctionSources.push(alias);for(const id of ['editorial-review','final-review'])correctionAlias.records[id].correctionSourcesReviewed.push(alias.uri);await correctionAlias.rebind();await assert.rejects(correctionAlias.check,/separate and unique/);
 const distinctQueries=await correctionFixture(t);distinctQueries.records.research.correctionSources[0].uri='https://example.test/correction?version=1';distinctQueries.records.research.correctionSources.push({...distinctQueries.records.research.correctionSources[0],uri:'https://EXAMPLE.TEST/correction/?version=2&utm_source=test#fragment'});for(const id of ['editorial-review','final-review'])distinctQueries.records[id].correctionSourcesReviewed=distinctQueries.records.research.correctionSources.map(source=>source.uri);await distinctQueries.rebind();assert.equal((await distinctQueries.check()).status,'ready');
 const early=await correctionFixture(t);early.records.research.correctionSources[0].retrievedAt='2026-11-07';await early.rebind();await assert.rejects(early.check,/outside the correction window/);
 const afterCheck=await correctionFixture(t);afterCheck.records.research.correctionSources[0].retrievedAt='2026-11-08T04:00:00Z';await afterCheck.rebind();await assert.rejects(afterCheck.check,/outside the correction window/);
});
test('주간·사후 확인 날짜는 Asia\/Seoul 달력과 UTC 15시 경계를 따른다',async t=>{
 const issueEnd=await fixture(t);issueEnd.records.research.sources[0].retrievedAt='2026-11-07T14:59:59Z';await issueEnd.rebind();assert.equal((await issueEnd.check()).status,'ready');
 const nextKoreanDay=await fixture(t);nextKoreanDay.records.research.sources[0].retrievedAt='2026-11-07T15:00:00Z';await nextKoreanDay.rebind();await assert.rejects(nextKoreanDay.check,/Stale source retrieval/);
 const windowStart=await fixture(t);windowStart.records.research.sources[0].retrievedAt='2026-10-30T15:00:00Z';await windowStart.rebind();assert.equal((await windowStart.check()).status,'ready');
 const beforeWindow=await fixture(t);beforeWindow.records.research.sources[0].retrievedAt='2026-10-30T14:59:59Z';await beforeWindow.rebind();await assert.rejects(beforeWindow.check,/Stale source retrieval/);
 const correctionStart=await correctionFixture(t),checkedAt='2026-11-08T02:00:00Z';correctionStart.records.context.correction.checkedAt=checkedAt;correctionStart.records.issue.correction.checkedAt=checkedAt;for(const id of ['editorial-review','final-review'])correctionStart.records[id].correctionCheckedAt=checkedAt;await correctionStart.rebind();assert.equal((await correctionStart.check()).status,'ready');
 const stillIssueDay=await correctionFixture(t),tooEarly='2026-11-07T14:59:59Z';stillIssueDay.records.context.correction.checkedAt=tooEarly;stillIssueDay.records.issue.correction.checkedAt=tooEarly;for(const id of ['editorial-review','final-review'])stillIssueDay.records[id].correctionCheckedAt=tooEarly;await stillIssueDay.rebind();await assert.rejects(stillIssueDay.check,/after the issue date/);
});
test('정정 표시·전후 해시·독립 검수·이전 배포 증거의 누락과 변조를 차단한다',async t=>{
 const notice=await correctionFixture(t),html=syntheticHtml.replace('</main>','<p>정정 표시 없는 변경</p></main>'),current=hash(html);await notice.write(notice.htmlPath,html);notice.records.issue.files.find(file=>file.path===notice.htmlPath).sha256=current;notice.records.issue.correction.currentIssueSha256=current;for(const id of ['editorial-review','final-review']){notice.records[id].currentIssueSha256=current;notice.records[id].reviewedFiles[notice.htmlPath]=current;}await notice.rebind();await assert.rejects(notice.check,/Visible correction notice/);
 for(const markup of ['<template><aside id="correction-notice" data-correction-date="2026-11-08">2026년 11월 8일 사후 정정 안내</aside></template>','<details><aside id="correction-notice" data-correction-date="2026-11-08">2026년 11월 8일 사후 정정 안내</aside></details>','<dialog><aside id="correction-notice" data-correction-date="2026-11-08">2026년 11월 8일 사후 정정 안내</aside></dialog>','<aside id="correction-notice" data-correction-date="2026-11-08" hidden>2026년 11월 8일 사후 정정 안내</aside>','<aside id="correction-notice" data-correction-date="2026-11-08" aria-hidden="true">2026년 11월 8일 사후 정정 안내</aside>','<aside id="correction-notice" data-correction-date="2026-11-08"><script>2026년 11월 8일 사후 정정 안내</script></aside>']){
  const hidden=await correctionFixture(t),hiddenHtml=syntheticHtml.replace('</main>',markup+'</main>'),hiddenSha=hash(hiddenHtml);await hidden.write(hidden.htmlPath,hiddenHtml);hidden.records.issue.files.find(file=>file.path===hidden.htmlPath).sha256=hiddenSha;hidden.records.issue.correction.currentIssueSha256=hiddenSha;for(const id of ['editorial-review','final-review']){hidden.records[id].currentIssueSha256=hiddenSha;hidden.records[id].reviewedFiles[hidden.htmlPath]=hiddenSha;}await hidden.rebind();await assert.rejects(hidden.check,/Visible correction notice/);
 }
 const review=await correctionFixture(t);delete review.records['final-review'].correctionReviewed;await review.rebind();await assert.rejects(review.check,/Independent correction review/);
 const prior=await correctionFixture(t),evidence=prior.records.context.correction.priorPublicationEvidence[0];await prior.write(evidence.path,'{}');await assert.rejects(prior.check,/evidence hash mismatch/);
 const browser=await correctionFixture(t),browserEvidence=browser.records.context.correction.priorPublicationEvidence[0],browserReceipt=JSON.parse(await fs.readFile(path.join(browser.root,browserEvidence.path),'utf8'));await browser.write(browserReceipt.browserEvidence[0].path,'tampered browser evidence');await assert.rejects(browser.check,/browser evidence hash mismatch/);
 const forged=await correctionFixture(t),forgedEvidence=forged.records.context.correction.priorPublicationEvidence[0],forgedReceipt=JSON.parse(await fs.readFile(path.join(forged.root,forgedEvidence.path),'utf8'));forgedReceipt.gitCommit='a'.repeat(40);const forgedBytes=JSON.stringify(forgedReceipt);await forged.write(forgedEvidence.path,forgedBytes);await forged.write(forgedEvidence.sourcePath,forgedBytes);forgedEvidence.sha256=hash(forgedBytes);await forged.rebind();await assert.rejects(forged.check,/not in the ledger|commit/);
 const future=await correctionFixture(t);future.records.context.correction.checkedAt='2999-11-08';future.records.issue.correction.checkedAt='2999-11-08';for(const id of ['editorial-review','final-review'])future.records[id].correctionCheckedAt='2999-11-08';await future.rebind();await assert.rejects(future.check,/not in the future/);
 const futureTime=await correctionFixture(t),later=new Date(Date.now()+10*60*1000).toISOString();futureTime.records.context.correction.checkedAt=later;futureTime.records.issue.correction.checkedAt=later;for(const id of ['editorial-review','final-review'])futureTime.records[id].correctionCheckedAt=later;await futureTime.rebind();await assert.rejects(futureTime.check,/not in the future/);
 const same=await correctionFixture(t);same.records.context.correction.previousIssueSha256=same.records.issue.correction.currentIssueSha256;for(const id of ['editorial-review','final-review'])same.records[id].previousIssueSha256=same.records.context.correction.previousIssueSha256;same.records.issue.correction.previousIssueSha256=same.records.context.correction.previousIssueSha256;await same.rebind();await assert.rejects(same.check,/prior publication receipt|must change/);
});
test('본문의 실제 영상 공개 원장 링크가 누락되거나 위조되면 차단한다',async t=>{
 for(const replacement of ['',ledgerLink.replaceAll('<','&lt;').replaceAll('>','&gt;'),ledgerLink.replace('2026-11-07','2026-10-31'),`<pre><code>${ledgerLink}</code></pre>`]){
  const f=await fixture(t),html=syntheticHtml.replace(ledgerLink,replacement),file='reports/weekly-2026-11-07.html';await f.write(file,html);f.records.issue.files.find(x=>x.path===file).sha256=hash(html);for(const id of ['editorial-review','final-review'])f.records[id].reviewedFiles[file]=hash(html);await f.rebind();await assert.rejects(f.check,/Creator public ledger link missing/);
 }
 const f=await fixture(t),html=syntheticHtml.replace('../assets/','/assets/'),file='reports/weekly-2026-11-07.html';await f.write(file,html);f.records.issue.files.find(x=>x.path===file).sha256=hash(html);for(const id of ['editorial-review','final-review'])f.records[id].reviewedFiles[file]=hash(html);await f.rebind();assert.equal((await f.check()).status,'ready');
});
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
test('루트 DESIGN.md 지침의 누락과 변경을 차단한다',async t=>{
 const f=await fixture(t);delete f.records.context.instructionFiles['DESIGN.md'];await f.rebind();await assert.rejects(f.check,/Stale instruction file: DESIGN.md/);
 const changed=await fixture(t);await changed.write('DESIGN.md','modified');await assert.rejects(changed.check,/Stale instruction file: DESIGN.md/);
});
test('디자인 호환 사본 누락이나 변조는 하네스를 차단한다',async t=>{
 const f=await fixture(t);await f.write('assets/report/DESIGN.md','different');await assert.rejects(f.check,/Design compatibility mirror/);
 await fs.unlink(path.join(f.root,'assets/report/DESIGN.md'));await assert.rejects(f.check,/Design compatibility mirror/);
});

test('조사 신선도·해외 기간 표시·작은따옴표 링크 누락 차단',async t=>{
 for(const [fields,pattern] of [[{retrievedAt:'2026-02-31'},/Stale source/],[{kind:'news',publishedAt:'2026-11-08'},/publication window/],[{kind:'news',publishedAt:'2026-02-31'},/publication window/],[{retrievedAt:'2025-01-01'},/Stale source/],[{kind:'overseas',publishedAt:'2026-01-01'},/publication window/],[{kind:'overseas',publishedAt:'2026-09-15'},/extension/]]){
  const f=await fixture(t);Object.assign(f.records.research.sources[0],fields);await f.write(f.paths.research,JSON.stringify(f.records.research));
  // Rebind downstream JSON hashes to exercise metadata validation, not merely lineage failure.
  const digests={};for(const task of spec.tasks)for(const id of task.outputs){const record=f.records[id];for(const input of task.inputs)if(digests[input])record.inputs[input]=digests[input];const bytes=JSON.stringify(record);await f.write(f.paths[id],bytes);digests[id]=hash(bytes);}
  await assert.rejects(f.check,pattern);
 }
 const f=await fixture(t),file='reports/weekly-2026-11-07.html',html=syntheticHtml.replace('</main>',"<img src='/assets/report/missing.png'></main>");
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
test('AI 게임 제작 오픈소스 탐색의 누락·오래된 조사·미결속 출처·한계 누락 차단',async t=>{
 for(const [change,pattern] of [
  [r=>delete r.openSourceToolSearch,/Open-source tool search record/],
  [r=>r.openSourceToolSearch.searchScope='',/Open-source tool search record/],
  [r=>r.openSourceToolSearch.searchedAt='2026-10-01',/Open-source tool search date/],
  [r=>r.openSourceToolSearch.searchedAt='2026-11-08',/Open-source tool search date/],
  [r=>r.openSourceToolSearch.sourceUrls=['https://example.test/not-read'],/Open-source tool search sources/],
  [r=>delete r.openSourceToolSearch.limitation,/Open-source tool search limitation/]
 ]){const f=await fixture(t);change(f.records.research);await f.rebind();await assert.rejects(f.check,pattern);}
});

test('제작 채널과 신규 콘텐츠 조사 누락·신선도·출처·한계 차단',async t=>{
 for(const [change,pattern] of [
  [r=>delete r.creatorContentSearch,/Creator channel coverage/],
  [r=>r.creatorContentSearch.channels.pop(),/Creator channel coverage/],
  [r=>r.creatorContentSearch.channels[1].handle=r.creatorContentSearch.channels[0].handle,/Creator channel coverage/],
  [r=>r.creatorContentSearch.channels[0].searchedAt='2026-10-01',/Creator channel search date/],
  [r=>r.creatorContentSearch.channels[0].sourceUrls=['https://example.test/not-read'],/Creator channel sources/],
  [r=>delete r.creatorContentSearch.channels[0].limitation,/Creator channel limitation/],
  [r=>r.creatorContentSearch.discovery.queries=[],/Creator discovery queries/],
  [r=>r.creatorContentSearch.discovery.queries=['AI 게임 개발'],/Creator discovery queries/],
  [r=>r.creatorContentSearch.discovery.searchedAt='2026-11-08',/Creator discovery date/],
  [r=>r.creatorContentSearch.discovery.sourceUrls=['https://example.test/not-read'],/Creator discovery sources/],
  [r=>delete r.creatorContentSearch.duplicateReview,/Creator duplicate review record/],
  [r=>r.creatorContentSearch.duplicateReview.searchedAt='2026-10-01',/Creator duplicate review date/],
  [r=>r.creatorContentSearch.duplicateReview.priorIssuePaths=['assets/report/research/ai-solo-creators-2026-10-31.json'],/Creator duplicate review prior issue path/],
  [r=>r.creatorContentSearch.duplicateReview.priorIssuePaths=['../private/secret.json'],/Creator duplicate review prior issue path/]
 ]){const f=await fixture(t);change(f.records.research);await f.rebind();await assert.rejects(f.check,pattern);}
 const prior=await fixture(t),old='assets/report/research/ai-solo-creators-2026-10-24.json',latest='assets/report/research/ai-solo-creators-2026-10-31.json';
 await prior.write(old,'{}');await prior.write(latest,'{}');
 await assert.rejects(prior.check,/Creator duplicate review prior issue coverage missing or duplicate/);
 for(const bad of [old,'assets/report/research/ai-solo-creators-2026-11-07.json','assets/report/research/ai-solo-creators-2026-11-08.json','assets/report/research/prior.json','assets/report/research/ai-solo-creators-2026-02-31.json']){
  if(bad!==old&&!bad.endsWith('2026-11-07.json'))await prior.write(bad,'{}');prior.records.research.creatorContentSearch.duplicateReview.priorIssuePaths=[bad];await prior.rebind();await assert.rejects(prior.check,/Creator duplicate review (prior issue coverage missing or duplicate|prior issue path invalid)/);
 }
 prior.records.research.creatorContentSearch.duplicateReview.priorIssuePaths=[latest,latest];await prior.rebind();await assert.rejects(prior.check,/Creator duplicate review prior issue coverage/);
 prior.records.research.creatorContentSearch.duplicateReview.priorIssuePaths=[old,latest];await prior.rebind();assert.equal((await prior.check()).status,'ready');
 const f=await fixture(t);await f.write(watchlistPath,JSON.stringify({...watchlist,purpose:'changed'}));await assert.rejects(f.check,/Stale instruction file/);
});

test('개별 참고 영상 조사·독립 검수의 누락과 출처를 차단',async t=>{
 for(const [change,pattern] of [
  [r=>delete r.creatorContentSearch.referenceVideos,/Creator reference coverage/],
  [r=>r.creatorContentSearch.referenceVideos.pop(),/Creator reference coverage/],
  [r=>r.creatorContentSearch.referenceVideos[1].videoId=r.creatorContentSearch.referenceVideos[0].videoId,/Creator reference coverage/],
  [r=>r.creatorContentSearch.referenceVideos[0].sourceUrls=['https://example.test/fixture'],/Creator reference sources/],
  [r=>delete r.creatorContentSearch.referenceVideos[0].limitation,/Creator reference limitation/]
 ]){const f=await fixture(t);change(f.records.research);await f.rebind();await assert.rejects(f.check,pattern);}
 for(const id of ['editorial-review','final-review']){const f=await fixture(t);f.records[id].referenceVideoIdsReviewed.pop();await f.rebind();await assert.rejects(f.check,/Independent creator reference review/);}
});

test('선정 영상과 공개 원장의 일치·재소개 사유 검사',async t=>{
 const ledgerPath='assets/report/research/ai-solo-creators-2026-11-07.json';
 const good={videoId:'m5EE54v3QGI',sourceUrl:'https://www.youtube.com/watch?v=m5EE54v3QGI',selectionReason:'Synthetic reason'};
 async function setLedger(f,data){const bytes=JSON.stringify(data);await f.write(ledgerPath,bytes);f.records.issue.files.find(x=>x.path===ledgerPath).sha256=hash(bytes);for(const id of ['editorial-review','final-review'])f.records[id].reviewedFiles[ledgerPath]=hash(bytes);}
 async function select(f,item){f.records.research.creatorContentSearch.selectedVideos=[item];f.records.research.sources.push({uri:item.sourceUrl,publisher:'fixture',retrievedAt:'2026-11-07',kind:'background',scope:'Synthetic selection'});await setLedger(f,{reportDate:'2026-11-07',videos:[item]});await f.rebind();}
 for(const change of [v=>v.videoId='bad',v=>v.sourceUrl='https://example.test/not-read',v=>v.selectionReason='']){const f=await fixture(t),v={...good};change(v);f.records.research.creatorContentSearch.selectedVideos=[v];await f.rebind();await assert.rejects(f.check,/Creator selected videos invalid/);}
 const absent=await fixture(t);absent.records.issue.files.splice(2,1);await absent.rebind();await assert.rejects(absent.check,/Creator public ledger missing/);
 const hidden=await fixture(t);hidden.records.issue.files[2].publish=false;await hidden.rebind();await assert.rejects(hidden.check,/Private evidence outside|Creator public ledger/);
 for(const data of [{reportDate:'2026-11-06',videos:[]},{reportDate:'2026-11-07',videos:[good]}]){const f=await fixture(t);await setLedger(f,data);await f.rebind();await assert.rejects(f.check,/Creator public ledger date or selected videos differ/);}
 const tamper=await fixture(t);await tamper.write(ledgerPath,'{}');await assert.rejects(tamper.check,/Issue file hash mismatch/);
 const f=await fixture(t),prior='assets/report/research/ai-solo-creators-2026-10-31.json';await f.write(prior,JSON.stringify({channels:[{videoId:good.videoId}]}));f.records.research.creatorContentSearch.duplicateReview.priorIssuePaths=[prior];await select(f,{...good});await assert.rejects(f.check,/Creator repeated video reason missing/);
 await select(f,{...good,repeatReason:'New development since previous coverage'});assert.equal((await f.check()).status,'ready');
 const older='assets/report/research/ai-solo-creators-2026-10-24.json';await f.write(older,JSON.stringify({videos:[{videoId:good.videoId}]}));await f.write(prior,JSON.stringify({channels:[]}));f.records.research.creatorContentSearch.duplicateReview.priorIssuePaths=[older,prior];await select(f,{...good});await assert.rejects(f.check,/Creator repeated video reason missing/);
 await select(f,{...good,repeatReason:'New development since older coverage'});assert.equal((await f.check()).status,'ready');
 const fresh=await fixture(t);await select(fresh,{...good});assert.equal((await fresh.check()).status,'ready');
 const reference=await fixture(t),referenceVideo=watchlist.referenceVideos[0],referenceSelection={videoId:referenceVideo.videoId,sourceUrl:referenceVideo.videoUrl,selectionReason:'Synthetic reference selection'};await reference.write(prior,JSON.stringify({referenceVideos:[{videoId:referenceVideo.videoId}]}));reference.records.research.creatorContentSearch.duplicateReview.priorIssuePaths=[prior];await select(reference,referenceSelection);await assert.rejects(reference.check,/Creator repeated video reason missing/);
 await select(reference,{...referenceSelection,repeatReason:'New context for previously introduced reference'});assert.equal((await reference.check()).status,'ready');
});


test('공개 자산·데이터셋 조사와 독립 검수 누락 차단',async t=>{
 for(const [change,pattern] of [
  [r=>delete r.openSourceToolSearch.publicAssets,/Public assets search record/],
  [r=>r.openSourceToolSearch.publicAssets.searchScope='',/Public assets search record/],
  [r=>r.openSourceToolSearch.publicAssets.searchedAt='2026-10-01',/Public assets search date/],
  [r=>r.openSourceToolSearch.publicAssets.searchedAt='2026-11-08',/Public assets search date/],
  [r=>r.openSourceToolSearch.publicAssets.sourceUrls=['https://example.test/not-read'],/Public assets search sources/],
  [r=>r.openSourceToolSearch.publicAssets.sourceUrls=[],/Public assets search sources/],
  [r=>delete r.openSourceToolSearch.publicAssets.limitation,/Public assets search limitation/]
 ]){const f=await fixture(t);change(f.records.research);await f.rebind();await assert.rejects(f.check,pattern);}
 for(const id of ['editorial-review','final-review']){const f=await fixture(t);delete f.records[id].publicAssetsReviewed;await f.rebind();await assert.rejects(f.check,/Independent public assets review/);}
 for(const status of ['updated','no_material_change','unverified']){const f=await fixture(t);f.records.research.openSourceToolSearch.publicAssets.status=status;await f.rebind();assert.equal((await f.check()).status,'ready');}
});

test('발행일별 사용자 요청 메모의 누락 해시·변경·삭제를 차단',async t=>{
 const f=await fixture(t),brief='instructions/ISSUE-BRIEF-2026-11-07.md';await f.write(brief,'Required additions');await assert.rejects(f.check,/issue brief/);
 f.records.context.instructionFiles[brief]=hash('Required additions');await f.rebind();assert.equal((await f.check()).status,'ready');
 await f.write(brief,'Changed additions');await assert.rejects(f.check,/issue brief/);await fs.unlink(path.join(f.root,brief));await assert.rejects(f.check,/ENOENT/);
 const other=await fixture(t);await other.write('instructions/ISSUE-BRIEF-2026-11-14.md','Different issue');assert.equal((await other.check()).status,'ready');
});

test('SQLite 품질 파이프라인 지침의 변경도 이전 승인을 무효화한다',async t=>{
 const f=await fixture(t);await f.write('instructions/QUALITY-PIPELINE.md','changed');await assert.rejects(f.check,/Stale instruction file/);
});
test('전송 요약과 파이프라인 영수증은 비공개 파일 목록과 독립 검수에 포함해야 한다',async t=>{
 for(const suffix of ['.pipeline.json','.summary.txt']){
  const f=await fixture(t);f.records.issue.files=f.records.issue.files.filter(file=>!file.path.endsWith(suffix));await f.rebind();
  await assert.rejects(f.check,/Private reviewed report artifact missing/);
 }
 const f=await fixture(t);f.records.issue.files.find(file=>file.path.endsWith('.summary.txt')).publish=true;await f.rebind();
 await assert.rejects(f.check,/Private reviewed report artifact missing/);
 const mismatch=await fixture(t);const pipelinePath='reports/weekly-2026-11-07.html.pipeline.json',bytes=JSON.stringify({summarySha256:'a'.repeat(64)});await mismatch.write(pipelinePath,bytes);mismatch.records.issue.files.find(file=>file.path===pipelinePath).sha256=hash(bytes);await mismatch.rebind();
 await assert.rejects(mismatch.check,/Pipeline summary hash differs/);
});
test('Windows UTF-8 BOM 파이프라인 영수증을 해시 그대로 검수한다',async t=>{
 const f=await fixture(t),p='reports/weekly-2026-11-07.html.pipeline.json';
 const bytes='\uFEFF'+JSON.stringify({runId:f.runId,summarySha256:hash('synthetic summary')});
 await f.write(p,bytes);f.records.issue.files.find(file=>file.path===p).sha256=hash(bytes);
 for(const id of ['editorial-review','final-review'])f.records[id].reviewedFiles[p]=hash(bytes);
 await f.rebind();assert.equal((await f.check()).status,'ready');
});

test('전송 전 최종 독립 검수에 요약과 영수증이 결속되어야 한다',async t=>{
 const f=await fixture(t);assert.equal((await verifyDeliveryHarness({root:f.root,issueDate:'2026-11-07'})).status,'ready');
 const summary='reports/weekly-2026-11-07.html.summary.txt',pipeline='reports/weekly-2026-11-07.html.pipeline.json';
 await f.write(summary,'changed summary');await f.write(pipeline,JSON.stringify({runId:f.runId,summarySha256:hash('changed summary')}));
 await assert.rejects(verifyDeliveryHarness({root:f.root,issueDate:'2026-11-07'}),/Issue file hash mismatch/);
 const missing=await fixture(t);await fs.unlink(path.join(missing.root,missing.paths['final-review']));
 await assert.rejects(verifyDeliveryHarness({root:missing.root,issueDate:'2026-11-07'}),/ENOENT/);
});
test('독립 검수 에이전트 지침의 누락·변경을 차단한다',async t=>{
 for(const file of ['.codex/agents/report-content-reviewer.toml','.codex/agents/report-ui-reviewer.toml','.codex/agents/report-orchestrator.toml','.codex/agents/report-section-writer.toml']){
  const absent=await fixture(t);delete absent.records.context.instructionFiles[file];await absent.rebind();await assert.rejects(absent.check,/Stale instruction file/);
  const modified=await fixture(t);await modified.write(file,'tampered agent instruction');await assert.rejects(modified.check,/Stale instruction file/);
 }
});
async function requestedFixture(t){
 const f=await fixture(t),input='_workspace/harness/'+f.runId+'/user-material.md',source='https://example.test/fixture';
 await f.write(input,'사용자가 제공한 필수 자료');f.records.context.requestInputs=[{path:input,sha256:hash('사용자가 제공한 필수 자료'),kind:'user_material'}];
 const items=[{id:'item-a',sourceUrl:source,repeatReason:'사용자가 이 호에 재확인을 명시함'},{id:'item-b',sourceUrl:source,repeatReason:'같은 출처의 다른 필수 항목'}];
 const ledgerPath='assets/report/research/requested-2026-11-07.json';f.records.research.userRequestedContent={inputSha256:hash('사용자가 제공한 필수 자료'),requiredItemIds:items.map(item=>item.id),items,publicLedgerPath:ledgerPath};
 const ledger=JSON.stringify({reportDate:'2026-11-07',items});await f.write(ledgerPath,ledger);
 f.records.issue.files.push({path:ledgerPath,sha256:hash(ledger),publish:true});
 for(const id of ['editorial-review','final-review']){f.records[id].reviewedFiles[ledgerPath]=hash(ledger);f.records[id].requestedItemsReviewed=['item-a','item-b'];}
 const html=syntheticHtml.replace('</main>','<p data-requested-item="item-a">A</p><p data-requested-item="item-b">B</p></main>'),htmlPath='reports/weekly-2026-11-07.html';await f.write(htmlPath,html);f.records.issue.files.find(file=>file.path===htmlPath).sha256=hash(html);
 for(const id of ['editorial-review','final-review'])f.records[id].reviewedFiles[htmlPath]=hash(html);
 await f.rebind();return {...f,input,ledgerPath,htmlPath};
}
test('사용자 필수 자료·항목·공개 원장·독립 검수를 해시와 출처로 결속한다',async t=>{
 const f=await requestedFixture(t);assert.equal((await f.check()).status,'ready');
 const altered=await requestedFixture(t);await altered.write(altered.input,'수정된 자료');await assert.rejects(altered.check,/User request input hash mismatch/);
 const absent=await requestedFixture(t);delete absent.records.research.userRequestedContent;await absent.rebind();await assert.rejects(absent.check,/User requested content research missing/);
 const badInput=await requestedFixture(t);badInput.records.context.requestInputs[0].path='../outside';await badInput.rebind();await assert.rejects(badInput.check,/Unsafe artifact path/);
 const missingId=await requestedFixture(t);missingId.records.research.userRequestedContent.items.pop();await missingId.rebind();await assert.rejects(missingId.check,/Requested items differ/);
 const duplicate=await requestedFixture(t);duplicate.records.research.userRequestedContent.requiredItemIds=['item-a','item-a'];await duplicate.rebind();await assert.rejects(duplicate.check,/Invalid requested item IDs/);
 const source=await requestedFixture(t);source.records.research.userRequestedContent.items[0].sourceUrl='https://unlinked.example/';await source.rebind();await assert.rejects(source.check,/source not in research/);
 const repeat=await requestedFixture(t);repeat.records.research.userRequestedContent.items[0].repeatReason='';await repeat.rebind();await assert.rejects(repeat.check,/repeat reason missing/);
 const coverage=await requestedFixture(t);coverage.records['final-review'].requestedItemsReviewed=['item-a'];await coverage.rebind();await assert.rejects(coverage.check,/independent review coverage/);
 const marker=await requestedFixture(t),html=syntheticHtml.replace('</main>','<p data-requested-item="item-a">A</p></main>');await marker.write(marker.htmlPath,html);marker.records.issue.files.find(file=>file.path===marker.htmlPath).sha256=hash(html);for(const id of ['editorial-review','final-review'])marker.records[id].reviewedFiles[marker.htmlPath]=hash(html);await marker.rebind();await assert.rejects(marker.check,/Requested items missing/);
 const ledger=await requestedFixture(t),bytes=JSON.stringify({reportDate:'2026-11-07',items:[]});await ledger.write(ledger.ledgerPath,bytes);ledger.records.issue.files.find(file=>file.path===ledger.ledgerPath).sha256=hash(bytes);for(const id of ['editorial-review','final-review'])ledger.records[id].reviewedFiles[ledger.ledgerPath]=hash(bytes);await ledger.rebind();await assert.rejects(ledger.check,/Requested public ledger differs/);
});
test('포맷 참조 파일 해시 누락과 변경을 차단한다',async t=>{
 for(const file of ['instructions/FORMAT-REFERENCE.md','.agents/skills/weekly-game-report/references/report-format-reference.json','.agents/skills/weekly-game-report/references/section-templates.json']){
  const absent=await fixture(t);delete absent.records.context.instructionFiles[file];await absent.rebind();await assert.rejects(absent.check,/Stale instruction file/);
  const modified=await fixture(t);await modified.write(file,'modified format');await assert.rejects(modified.check,/Stale instruction file/);
 }
});
