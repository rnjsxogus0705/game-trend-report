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
  const localIssueAsset=/\.(?:md|js|json)$/.test(url)&&!url.includes('..');
  const target=path.resolve(localIssueAsset?reports:siteReports,url);
  if(url.endsWith('/')){await fs.mkdir(target,{recursive:true});continue;}
  await fs.mkdir(path.dirname(target),{recursive:true});await fs.writeFile(target,'synthetic fixture asset');
 }
 const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
 const categories=['ai-only-lab','games','ai-trends','ai-planning','game-ai','ai-releases','techniques','github-trending','game-ai-tools','careers','opportunities','agent-skills'];
 const checks=Object.fromEntries(['sourcesVerified','releaseStatesChecked','aiScopeSeparated','hotnessEvidenceChecked','jobsSampleDisclosed','previousIssueCompared','techniqueReproducibilityReviewed','mobileChecked','shareChecked'].map(key=>[key,true]));
 const content={schemaVersion:2,reportDate:'2026-11-07',sha256:digest(html),sections:ids,checks,coverage:categories.map(category=>({category,status:'unverified',sourceUrls:['https://example.test/fixture'],limitation:'Synthetic fixture, not research'}))};
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
