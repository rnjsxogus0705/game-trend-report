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
test('실습 프롬프트 11개는 복사 대상·입력·결과·직접 확인과 후속 질문을 제공',()=>{
 const prompts=[...html.matchAll(/<details class="practice-prompt">([\s\S]*?)<\/details>/g)];assert.equal(prompts.length,11);
 for(const [,block] of prompts){const target=block.match(/data-copy-workflow="([^"]+)"/)[1];assert.ok(block.includes('id="'+target+'"'));for(const label of ['받을 결과','직접 확인','이어서 물어보기'])assert.ok(block.includes(label));assert.match(block,/\[[^\]]+\]/);}
 for(const id of ['prototype','lab','reverse','ai-planning','game-ai-tools','agent-skills','ai-production'])assert.ok(html.includes('id="practice-'+id+'-1"'));
 assert.ok(!html.includes('작은 시험판'));assert.ok(!html.includes('직접 만지는 실험실'));
});
test('픽셀 VFX 보완은 두 도구·라이선스·엔진 경로·공식 미디어와 외부 영상을 구분',async()=>{
 const data=JSON.parse(await fs.readFile(new URL('../assets/report/research/open-source-vfx-2026-10-31.json',import.meta.url),'utf8'));
 assert.equal(data.supplementCheckedAt,'2026-11-02');assert.deepEqual(data.tools.map(t=>t.id),['pixelfx','spritefusion']);
 for(const item of data.tools){assert.equal(item.executed,false);assert.ok(item.license&&item.engineRoute);assert.ok(html.includes('data-open-source-tool="'+item.id+'"'));assert.ok(html.includes('id="practice-'+item.id+'-1"'));}
 assert.equal(data.video.url,'https://www.youtube.com/watch?v=8cYwqU1NtBQ');assert.match(data.video.kind,/외부 개발자/);assert.ok(html.includes('data-youtube-play="8cYwqU1NtBQ"'));
 for(const label of ['Patch Pixel','PNG+JSON','별도 프레임','공식 갤러리','11월 2일 추가','MIT-LICENSE.txt'])assert.ok(html.includes(label),label);
 const notice=await fs.readFile(new URL('../assets/report/open-source-vfx-2026-10-31/MIT-LICENSE.txt',import.meta.url),'utf8');assert.ok(notice.includes('Hugo Duprez')&&notice.includes('MIT License'));
 const png=await fs.readFile(new URL('../assets/report/open-source-vfx-2026-10-31/pixelfx-campfire.png',import.meta.url));assert.deepEqual([png.readUInt32BE(16),png.readUInt32BE(20)],[192,160]);assert.match(html,/pixelfx-campfire\.png" width="192" height="160"/);
});
test('해외 사례는 10월 최신3개로 교체하고 AI 범위·관심지표·원문을 기록',async()=>{
 const data=JSON.parse(await fs.readFile(new URL('../assets/report/research/international-resources-2026-10-31.json',import.meta.url),'utf8'));assert.equal(data.resources.length,3);assert.match(data.method,/ego-browser/);
 for(const item of data.resources){assert.match(item.date,/^2026-10-/);assert.match(item.videoId,/^[\w-]{11}$/);assert.ok(item.selectionReason&&item.aiScope&&item.humanRole);assert.ok(item.highlights.length>0);assert.ok(item.popularity.views>0);assert.equal(item.popularity.evidenceUrl,item.videoUrl);assert.equal(item.popularity.checkedAt,'2026-10-31');assert.ok(item.chapters.every(c=>c.seconds<item.durationSeconds));}
 const max=data.resources.find(i=>i.creator==='Max Blade');assert.match(max.aiScope,/98%/);assert.match(max.aiScope,/100% AI 제작을 뜻하는 수치는 아니에요/);
 assert.ok(!JSON.stringify(data).includes('4RlpMhBKNr0'));
});
