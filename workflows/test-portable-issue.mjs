// Synthetic review fixtures prove wiring only. They are never publication receipts or research evidence.
import {test} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs/promises';import path from 'node:path';import os from 'node:os';import crypto from 'node:crypto';import {execFileSync} from 'node:child_process';import {fileURLToPath} from 'node:url';
const repo=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const manifest=JSON.parse(await fs.readFile(path.join(repo,'instructions/sync-manifest.json'),'utf8'));
const digest=value=>crypto.createHash('sha256').update(value).digest('hex');
const careerCoverage=['startups','events','bootcamps','admissions','news'].map(category=>({category,status:'unverified',searchedAt:'2026-11-07',searchScope:'Synthetic official source search',finding:'No real research in this fixture',sourceUrls:['https://example.test/fixture'],limitation:'Synthetic fixture only'}));
test('정식 디자인 기준은 운영 루트로 복사되고 기존 위치의 상대 링크로 열린다',async t=>{
 assert.ok(manifest.files.some(entry=>entry.repo==='DESIGN.md'&&entry.local==='DESIGN.md'));
 assert.ok(manifest.files.some(entry=>entry.repo==='instructions/DESIGN.md'&&entry.local==='redesign/DESIGN.md'));
 const sync=await fs.readFile(path.join(repo,'workflows/sync-instructions.ps1'),'utf8');assert.match(sync,/'DESIGN\.md'\s*=\s*'DESIGN\.md'/);
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'gtr-design-sync-'));t.after(()=>fs.rm(root,{recursive:true,force:true}));
 for(const entry of manifest.files.filter(e=>e.repo==='DESIGN.md'||e.repo==='instructions/DESIGN.md')){const target=path.join(root,entry.local);await fs.mkdir(path.dirname(target),{recursive:true});await fs.copyFile(path.join(repo,entry.repo),target);}
 const pointer=await fs.readFile(path.join(root,'redesign/DESIGN.md'),'utf8');assert.match(pointer,/\]\(\.\.\/DESIGN\.md\)/);
 assert.equal(digest(await fs.readFile(path.join(root,'DESIGN.md'))),digest(await fs.readFile(path.join(repo,'DESIGN.md'))));
 assert.equal(digest(await fs.readFile(path.resolve(root,'redesign','../DESIGN.md'))),digest(await fs.readFile(path.join(repo,'DESIGN.md'))));
});
test('Google 디자인 원칙 조사 출처가 기존 참고 폴더에 동일하게 복사된다',async t=>{
 const repoPath='instructions/references/google-design-md/source-reference-2026-11-07.json',local='redesign/references/google-design-md/source-reference-2026-11-07.json';
 assert.ok(manifest.files.some(entry=>entry.repo===repoPath&&entry.local===local));
 const sync=await fs.readFile(path.join(repo,'workflows/sync-instructions.ps1'),'utf8');assert.ok(sync.includes("'google-design-md/source-reference-2026-11-07.json'"));
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'gtr-design-source-'));t.after(()=>fs.rm(root,{recursive:true,force:true}));const target=path.join(root,local);await fs.mkdir(path.dirname(target),{recursive:true});await fs.copyFile(path.join(repo,repoPath),target);
 const copied=await fs.readFile(target);assert.equal(digest(copied),digest(await fs.readFile(path.join(repo,repoPath))));assert.equal(JSON.parse(copied).sources.length,5);
});
async function fixture(t){
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'gtr-new-pc-'));t.after(()=>fs.rm(root,{recursive:true,force:true}));
 const reports=path.join(root,'reports'),siteReports=path.join(root,'site/reports');await fs.mkdir(reports);await fs.mkdir(siteReports,{recursive:true});
 for(const entry of manifest.files){const target=path.join(root,entry.local);await fs.mkdir(path.dirname(target),{recursive:true});await fs.copyFile(path.join(repo,entry.repo),target);}
 await fs.mkdir(path.join(root,'site/instructions'),{recursive:true});await fs.copyFile(path.join(repo,'DESIGN.md'),path.join(root,'site/DESIGN.md'));await fs.copyFile(path.join(repo,'instructions/DESIGN.md'),path.join(root,'site/instructions/DESIGN.md'));
 const html=(await fs.readFile(path.join(repo,'reports/weekly-2026-10-31.html'),'utf8')).replaceAll('2026-10-31','2026-11-07').replace('../assets/report/report.js','weekly-2026-11-07.js').replace('<main class="content" id="report">','<main class="content" id="report"><button id="report-share" type="button" aria-haspopup="dialog" aria-label="리포트 공유 메뉴 열기">공유</button>');
 const htmlPath=path.join(reports,'weekly-2026-11-07.html');await fs.writeFile(htmlPath,html);
 for(const [,url]of html.matchAll(/(?:href|src)="([^"]+)"/g)){
  if(url.startsWith('#')||/^(https?:|data:|mailto:)/.test(url))continue;
  const assetUrl=url.split(/[?#]/)[0];
  const localIssueAsset=/\.(?:md|js|json)$/.test(assetUrl)&&!assetUrl.includes('..');
  const target=path.resolve(localIssueAsset?reports:siteReports,assetUrl);
  if(url.endsWith('/')){await fs.mkdir(target,{recursive:true});continue;}
  await fs.mkdir(path.dirname(target),{recursive:true});await fs.writeFile(target,'synthetic fixture asset');
 }
 await fs.copyFile(path.join(root,'site/DESIGN.md'),path.join(root,'site/assets/report/DESIGN.md'));
 await fs.cp(path.join(root,'site/assets'),path.join(root,'assets'),{recursive:true});
 const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
 const categories=['ai-only-lab','games','ai-trends','ai-planning','game-ai','ai-releases','techniques','github-trending','game-ai-tools','careers','opportunities','agent-skills'];
 const checks=Object.fromEntries(['sourcesVerified','releaseStatesChecked','aiScopeSeparated','hotnessEvidenceChecked','jobsSampleDisclosed','previousIssueCompared','techniqueReproducibilityReviewed','mobileChecked','shareChecked'].map(key=>[key,true]));
 const content={schemaVersion:2,reportDate:'2026-11-07',sha256:digest(html),sections:ids,checks,careerCoverage,coverage:categories.map(category=>({category,status:'unverified',sourceUrls:['https://example.test/fixture'],limitation:'Synthetic fixture, not research'}))};
 const qualityIds=['research','overseas','selection','practice','visuals','media','layout','korean','files'];
 content.qualityReview={instructionRevision:'a'.repeat(40),editor:'fixture-editor',reviewer:'fixture-reviewer',blockingFindings:[],criteria:qualityIds.map(id=>({id,status:'limited',evidence:'Synthetic fixture tests wiring only',limitation:'Not a real review'}))};
 const files=(await fs.readdir(reports)).filter(name=>name.endsWith('.md')||name.endsWith('.html'));
 const naturalnessReview={editor:'fixture-editor',reviewer:'fixture-reviewer',coverage:['body','headings','tables','captions','collapsed','copy','downloads','terms'],sectionIdsReviewed:ids,changes:[],fileHashes:Object.fromEntries(await Promise.all(files.map(async name=>[name,digest(await fs.readFile(path.join(reports,name)))]))),externalVerified:false,method:'Synthetic fixture, not an actual language review'};
 await fs.writeFile(htmlPath+'.content-review.json','\uFEFF'+JSON.stringify(content));await fs.writeFile(htmlPath+'.language-review.json','\uFEFF'+JSON.stringify({naturalnessReview}));
 const seed=async()=>{
  await fs.mkdir(path.join(root,'workflows'),{recursive:true});
  await fs.writeFile(path.join(root,'.synthetic-report-test'),'test-only');
  await fs.copyFile(path.join(repo,'workflows/report-ledger.py'),path.join(root,'workflows/report-ledger.py'));
  execFileSync(process.platform==='win32'?'py':'python3',[...(process.platform==='win32'?['-3']:[]),path.join(repo,'workflows/fixtures/report-ledger-fixture.py'),root,htmlPath],{cwd:root,stdio:'pipe'});
 };
 await seed();
 const run=()=>execFileSync(process.execPath,[path.join(root,'validate-issue.mjs'),htmlPath],{encoding:'utf8',stdio:'pipe'});
 return {root,htmlPath,html,naturalnessReview,run,seed};
}
test('새 PC manifest 배치와 UTF-8 BOM 영수증으로 전체 검증 실행',async t=>{
 const f=await fixture(t);assert.match(f.run(),/Content contract/);
 const sync=await fs.readFile(path.join(repo,'workflows/sync-instructions.ps1'),'utf8');
 for(const name of ['validate-weekly-presentation.mjs','validate-language-review.mjs'])assert.ok(sync.includes("'"+name+"'"));
});
test('새 PC에서도 디자인 누락과 독립 검수 누락은 통과하지 못함',async t=>{
 const f=await fixture(t);await fs.writeFile(f.htmlPath,f.html.replace('weekly-editorial.css','missing.css'));
 assert.throws(f.run,error=>String(error.stderr).includes('stylesheet must be last'));
 await fs.writeFile(f.htmlPath,f.html);await fs.writeFile(f.htmlPath+'.language-review.json','\uFEFF'+JSON.stringify({naturalnessReview:{...f.naturalnessReview,reviewer:'fixture-editor'}}));
 assert.throws(f.run,error=>String(error.stderr).includes('distinct nonempty'));
});
test('08시 전송 경로가 전체 검증 실패를 전송 전에 차단',async()=>{
 const source=await fs.readFile(path.join(repo,'workflows/dispatch-report.ps1'),'utf8');
 const validation=source.indexOf("'validate-issue.mjs'");assert.ok(validation>=0);assert.ok(source.indexOf('$LASTEXITCODE -ne 0',validation)>validation);assert.ok(source.indexOf("'send-report.ps1'")>validation);
});
test('새 PC의 발행·전송 검사도 다섯 진로 조사 기록을 요구',async t=>{
 const f=await fixture(t),file=f.htmlPath+'.content-review.json',original=JSON.parse((await fs.readFile(file,'utf8')).replace(/^\uFEFF/,''));
 for(const change of [r=>delete r.careerCoverage,r=>r.careerCoverage.pop(),r=>r.careerCoverage[0].searchedAt='2026-02-31',r=>r.careerCoverage[0].searchedAt='2026-11-08',r=>r.careerCoverage[0].searchScope='',r=>r.careerCoverage[0].limitation='']){
  const review=structuredClone(original);change(review);await fs.writeFile(file,JSON.stringify(review));assert.throws(f.run,error=>String(error.stderr).includes('Career research'));
 }
});

test('새 PC에서도 품질 검수 누락·같은 검수자·미해결 문제·근거 누락 차단',async t=>{
 const f=await fixture(t),file=f.htmlPath+'.content-review.json';
 const original=JSON.parse((await fs.readFile(file,'utf8')).replace(/^\uFEFF/,''));
 for(const [change,message] of [
  [review=>delete review.qualityReview,'independent reviewer'],
  [review=>review.qualityReview.reviewer=review.qualityReview.editor,'independent reviewer'],
  [review=>review.qualityReview.blockingFindings=['Unresolved fixture problem'],'blocking findings'],
  [review=>review.qualityReview.criteria.find(item=>item.id==='overseas').evidence='','evidence or limitation: overseas'],
  [review=>delete review.qualityReview.criteria.find(item=>item.id==='media').limitation,'evidence or limitation: media'],
  [review=>review.qualityReview.criteria.push(review.qualityReview.criteria[0]),'must be unique']
 ]){
  const review=structuredClone(original);change(review);await fs.writeFile(file,JSON.stringify(review));
  assert.throws(f.run,error=>String(error.stderr).includes(message));
 }
});
test('새 PC의 최신 지침·예약 전문과 검사 모듈 연결',async()=>{
 const schedule=await fs.readFile(path.join(repo,'instructions/READING-AND-SCHEDULER.md'),'utf8');
 const prompt=schedule.split('**매주 토요일 07:00 — 조사·작성·배포**')[1].split('**매주 토요일 08:00')[0];
 for(const text of ['ego-browser skill','qualityReview','blockingFindings','독립 검수','실습 프롬프트 DOM 계약','30일','90일','100%','공동작성','image_gen','320/390/768/1440'])assert.ok((text==='320/390/768/1440'?schedule:prompt).includes(text),text);
 const output=await fs.readFile(path.join(repo,'instructions/REPORT-OUTPUT-CONTRACT.md'),'utf8');
 for(const id of ['research','overseas','selection','practice','visuals','media','layout','korean','files'])assert.ok(output.includes('| '+id+' |'),id);
 const sync=await fs.readFile(path.join(repo,'workflows/sync-instructions.ps1'),'utf8');
 for(const name of ['REPORT-OUTPUT-CONTRACT.md','READING-AND-SCHEDULER.md','KOREAN-EDITORIAL-POLICY.md']){
  assert.ok(manifest.files.some(entry=>entry.repo==='instructions/'+name));assert.ok(sync.includes(name));
 }
});

test('Windows와 Mac 예약 모두 스킬·다섯 진로 범주·검수 게이트로 연결',async()=>{
 const schedule=await fs.readFile(path.join(repo,'instructions/READING-AND-SCHEDULER.md'),'utf8');
 const windows=schedule.split('**매주 토요일 07:00 — 조사·작성·배포**')[1].split('**매주 토요일 08:00')[0];
 const mac=schedule.split('**macOS 매주 토요일 08:00 — 생성·검수 후 배포·전송**')[1].split('```text')[1].split('```')[0];
 for(const prompt of [windows,mac])for(const text of ['$weekly-game-report','careerCoverage','careerCategoriesReviewed','startups','events','bootcamps','admissions','news','check-report-harness.mjs','openSourceToolSearch','pixelfx','Sprite Fusion'])assert.ok(prompt.includes(text),text);
 for(const text of ['Asia/Seoul','--check','--send','1565894418156879942','1566098427052298342','sent/pending'])assert.ok(mac.includes(text),text);
 const spec=JSON.parse(await fs.readFile(path.join(repo,'.agents/skills/weekly-game-report/references/harness-spec.json'),'utf8'));
 for(const id of ['research','editorial-review','final-review'])assert.ok(spec.tasks.find(task=>task.id===id).completion.includes(id==='research'?'careerCoverage':'careerCategoriesReviewed'));
});

test('첫 호 비교 불가 기록은 근거·본문·이전호 부재를 모두 요구',async t=>{
 const f=await fixture(t);let html=f.html.replace('</body>','<p>전주 비교 자료가 없어 수치 변화를 비교하지 않습니다.</p></body>');await fs.writeFile(f.htmlPath,html);
 const reviewPath=f.htmlPath+'.content-review.json';const review=JSON.parse((await fs.readFile(reviewPath,'utf8')).replace(/^\uFEFF/,''));review.sha256=digest(html);review.checks.previousIssueCompared=false;review.previousIssueComparison={status:'not_comparable',scope:'first_issue',priorIssue:null,reason:'Synthetic first-issue inventory',evidence:'Synthetic directory inventory only'};
 await fs.writeFile(reviewPath,JSON.stringify(review));const language=f.naturalnessReview;language.fileHashes[path.basename(f.htmlPath)]=digest(html);await fs.writeFile(f.htmlPath+'.language-review.json',JSON.stringify({naturalnessReview:language}));
 await f.seed();assert.match(f.run(),/Content contract/);
 const original=structuredClone(review);delete review.previousIssueComparison.priorIssue;await fs.writeFile(reviewPath,JSON.stringify(review));assert.throws(f.run,error=>String(error.stderr).includes('comparison evidence'));
 await fs.writeFile(reviewPath,JSON.stringify(original));await fs.writeFile(path.join(f.root,'site/reports/weekly-2026-10-24.html'),'prior');assert.throws(f.run,error=>String(error.stderr).includes('Earlier weekly issue'));
});
