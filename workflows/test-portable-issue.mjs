// Synthetic review fixtures prove wiring only. They are never publication receipts or research evidence.
import {test} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs/promises';import path from 'node:path';import os from 'node:os';import crypto from 'node:crypto';import {execFileSync} from 'node:child_process';import {fileURLToPath} from 'node:url';
const repo=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const manifest=JSON.parse(await fs.readFile(path.join(repo,'instructions/sync-manifest.json'),'utf8'));
const digest=value=>crypto.createHash('sha256').update(value).digest('hex');
async function fixture(t){
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'gtr-new-pc-'));t.after(()=>fs.rm(root,{recursive:true,force:true}));
 const reports=path.join(root,'reports'),siteReports=path.join(root,'site/reports');await fs.mkdir(reports);await fs.mkdir(siteReports,{recursive:true});
 for(const entry of manifest.files){const target=path.join(root,entry.local);await fs.mkdir(path.dirname(target),{recursive:true});await fs.copyFile(path.join(repo,entry.repo),target);}
 const html=(await fs.readFile(path.join(repo,'reports/weekly-2026-10-31.html'),'utf8')).replaceAll('2026-10-31','2026-11-07').replace('../assets/report/report.js','weekly-2026-11-07.js');
 const htmlPath=path.join(reports,'weekly-2026-11-07.html');await fs.writeFile(htmlPath,html);
 for(const [,url]of html.matchAll(/(?:href|src)="([^"]+)"/g)){
  if(url.startsWith('#')||/^(https?:|data:|mailto:)/.test(url))continue;
  const assetUrl=url.split(/[?#]/)[0];
  const localIssueAsset=/\.(?:md|js|json)$/.test(assetUrl)&&!assetUrl.includes('..');
  const target=path.resolve(localIssueAsset?reports:siteReports,assetUrl);
  if(url.endsWith('/')){await fs.mkdir(target,{recursive:true});continue;}
  await fs.mkdir(path.dirname(target),{recursive:true});await fs.writeFile(target,'synthetic fixture asset');
 }
 const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
 const categories=['ai-only-lab','games','ai-trends','ai-planning','game-ai','ai-releases','techniques','github-trending','game-ai-tools','careers','opportunities','agent-skills'];
 const checks=Object.fromEntries(['sourcesVerified','releaseStatesChecked','aiScopeSeparated','hotnessEvidenceChecked','jobsSampleDisclosed','previousIssueCompared','techniqueReproducibilityReviewed','mobileChecked','shareChecked'].map(key=>[key,true]));
 const content={schemaVersion:2,reportDate:'2026-11-07',sha256:digest(html),sections:ids,checks,coverage:categories.map(category=>({category,status:'unverified',sourceUrls:['https://example.test/fixture'],limitation:'Synthetic fixture, not research'}))};
 const qualityIds=['research','overseas','selection','practice','visuals','media','layout','korean','files'];
 content.qualityReview={instructionRevision:'a'.repeat(40),editor:'fixture-editor',reviewer:'fixture-reviewer',blockingFindings:[],criteria:qualityIds.map(id=>({id,status:'limited',evidence:'Synthetic fixture tests wiring only',limitation:'Not a real review'}))};
 const files=(await fs.readdir(reports)).filter(name=>name.endsWith('.md')||name.endsWith('.html'));
 const naturalnessReview={editor:'fixture-editor',reviewer:'fixture-reviewer',coverage:['body','headings','tables','captions','collapsed','copy','downloads','terms'],sectionIdsReviewed:ids,changes:[],fileHashes:Object.fromEntries(await Promise.all(files.map(async name=>[name,digest(await fs.readFile(path.join(reports,name)))]))),externalVerified:false,method:'Synthetic fixture, not an actual language review'};
 await fs.writeFile(htmlPath+'.content-review.json','\uFEFF'+JSON.stringify(content));await fs.writeFile(htmlPath+'.language-review.json','\uFEFF'+JSON.stringify({naturalnessReview}));
 const run=()=>execFileSync(process.execPath,[path.join(root,'validate-issue.mjs'),htmlPath],{encoding:'utf8',stdio:'pipe'});
 return {root,htmlPath,html,naturalnessReview,run};
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

test('첫 호 비교 불가 기록은 근거·본문·이전호 부재를 모두 요구',async t=>{
 const f=await fixture(t);let html=f.html.replace('</body>','<p>전주 비교 자료가 없어 수치 변화를 비교하지 않습니다.</p></body>');await fs.writeFile(f.htmlPath,html);
 const reviewPath=f.htmlPath+'.content-review.json';const review=JSON.parse((await fs.readFile(reviewPath,'utf8')).replace(/^\uFEFF/,''));review.sha256=digest(html);review.checks.previousIssueCompared=false;review.previousIssueComparison={status:'not_comparable',scope:'first_issue',priorIssue:null,reason:'Synthetic first-issue inventory',evidence:'Synthetic directory inventory only'};
 await fs.writeFile(reviewPath,JSON.stringify(review));const language=f.naturalnessReview;language.fileHashes[path.basename(f.htmlPath)]=digest(html);await fs.writeFile(f.htmlPath+'.language-review.json',JSON.stringify({naturalnessReview:language}));
 assert.match(f.run(),/Content contract/);
 const original=structuredClone(review);delete review.previousIssueComparison.priorIssue;await fs.writeFile(reviewPath,JSON.stringify(review));assert.throws(f.run,error=>String(error.stderr).includes('comparison evidence'));
 await fs.writeFile(reviewPath,JSON.stringify(original));await fs.writeFile(path.join(f.root,'site/reports/weekly-2026-10-24.html'),'prior');assert.throws(f.run,error=>String(error.stderr).includes('Earlier weekly issue'));
});
