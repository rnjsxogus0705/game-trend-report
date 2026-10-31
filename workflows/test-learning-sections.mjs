import {test} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs/promises';import vm from 'node:vm';
const html=await fs.readFile(new URL('../reports/weekly-2026-10-31.html',import.meta.url),'utf8');
const artifact=JSON.parse(await fs.readFile(new URL('../assets/report/validation-result.json',import.meta.url),'utf8'));
test('학습용 오류 막대가 원본 기록의 2·2·1·1과 일치',()=>{
 const counts=Object.fromEntries(['DUPLICATE_ID','MISSING_ID','INVALID_COST','INVALID_COOLDOWN','UNKNOWN_STATE'].map(code=>[code,artifact.brokenErrors.filter(e=>e.code===code).length]));
 assert.deepEqual([counts.DUPLICATE_ID+counts.MISSING_ID,counts.INVALID_COST,counts.INVALID_COOLDOWN,counts.UNKNOWN_STATE],[2,2,1,1]);
 assert.deepEqual([...html.matchAll(/data-error-count="(\d+)"/g)].map(m=>Number(m[1])),[2,2,1,1]);assert.equal(artifact.cleanErrors.length,0);
});
test('가상 실험의 재현성과 확률 경계 조건',async()=>{
 const context={};vm.runInNewContext(await fs.readFile(new URL('../assets/report/report.js',import.meta.url),'utf8'),context);
 const simulate=context.ReportSimulation,first=simulate(.3,10);assert.equal(first.counts.reduce((a,b)=>a+b,0),1000);assert.equal(JSON.stringify(first),JSON.stringify(simulate(.3,10)));assert.ok(Math.abs(first.mean-3)<.25);
 assert.equal(simulate(0,10).counts[0],1000);assert.equal(simulate(1,10).counts[10],1000);
});
test('두 섹션의 그림·근거 안내와 기존 조작 요소 유지',()=>{
 for(const marker of ['prototype-guide.webp','lab-guide.webp','learning-section-guide','lab-explanation','data-check="hypothesis"','id="chance"','id="trials"','id="simulation-chart"','id="simulation-table"'])assert.ok(html.includes(marker),marker);
 assert.equal((html.match(/class="github-selection"/g)||[]).length,3);assert.ok(html.includes('github-selection-2026-10-31.json'));
});
