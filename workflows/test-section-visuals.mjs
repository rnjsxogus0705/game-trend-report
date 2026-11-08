import {test} from 'node:test';
import assert from 'node:assert/strict';
import {validateSectionVisuals,sectionVisualIds} from './validate-weekly-presentation.mjs';
const date='2026-11-14';
const visual=id=>`<div class="report-infographic" data-infographic-id="${id}"><figure class="chapter-concept"><img src="../assets/report/visuals/${id}.webp" alt="${id} 그림" width="1200" height="800" loading="lazy"><figcaption>AI 생성 개념 그림</figcaption></figure><div class="infographic-summary" role="group" aria-labelledby="infographic-summary-${id}"><h3 id="infographic-summary-${id}">핵심 정리</h3><ul><li>첫 번째 요점</li><li>두 번째 요점</li><li>세 번째 요점</li></ul></div></div>`;
const section=(id,child='')=>`<section id="${id}"><div class="chapter-head"><h2>${id}</h2></div>${visual(id)}${child}</section>`;
const page=ids=>`<html><head><link rel="stylesheet" href="../assets/report/section-infographic.css"></head><body>${ids.map(id=>section(id)).join('')}</body></html>`;
test('다음 호부터 22섹션 그림·요약을 요구하고 이전 호와 호환한다',()=>{
 const html=page(sectionVisualIds);assert.equal(sectionVisualIds.length,22);assert.doesNotThrow(()=>validateSectionVisuals(html,{reportDate:date}));
 assert.doesNotThrow(()=>validateSectionVisuals('<html></html>',{reportDate:'2026-11-07'}));
 assert.throws(()=>validateSectionVisuals(html.replace(visual('games'),''),{reportDate:date}),/count mismatch/);
 assert.throws(()=>validateSectionVisuals(html.replace(visual('games'),visual('games')+visual('games')),{reportDate:date}),/count mismatch/);
 assert.throws(()=>validateSectionVisuals(html.replace('<link rel="stylesheet" href="../assets/report/section-infographic.css">',''),{reportDate:date}),/stylesheet/);
 assert.throws(()=>validateSectionVisuals(html.replace(visual('games'),visual('games').replace('<li>두 번째 요점</li><li>세 번째 요점</li>','')),{reportDate:date}),/two or three/);
 assert.throws(()=>validateSectionVisuals(html.replace('alt="games 그림"','alt=""'),{reportDate:date}),/image, caption/);
 assert.throws(()=>validateSectionVisuals(html.replace('aria-labelledby="infographic-summary-games"','aria-labelledby="wrong"'),{reportDate:date}),/accessible name/);
 assert.throws(()=>validateSectionVisuals(html.replace('../assets/report/visuals/games.webp','../assets/report/../private.png'),{reportDate:date}),/image, caption/);
 assert.throws(()=>validateSectionVisuals(html.replace(visual('games'),'<details>'+visual('games')+'</details>'),{reportDate:date}),/missing or duplicated/);
});
test('Unity 별도 섹션이 있다면 그 섹션의 요약도 따로 요구한다',()=>{
 const html=page(sectionVisualIds).replace(section('game-ai-tools'),section('game-ai-tools',section('unity-official-guide')));
 assert.doesNotThrow(()=>validateSectionVisuals(html,{reportDate:date}));assert.throws(()=>validateSectionVisuals(html.replace(visual('unity-official-guide'),''),{reportDate:date}),/count mismatch/);
});
test('최종 시각 검증 섹션은 템플릿 카탈로그와 빠짐없이 일치한다',async()=>{
 const {default:fs}=await import('node:fs/promises');
 const catalog=JSON.parse(await fs.readFile(new URL('../.agents/skills/weekly-game-report/references/section-templates.json',import.meta.url),'utf8'));
 const templateIds=catalog.sections.map(section=>section.id);
 assert.equal(new Set(sectionVisualIds).size,sectionVisualIds.length,'validator section IDs must be unique');
 assert.equal(new Set(templateIds).size,templateIds.length,'template section IDs must be unique');
 assert.deepEqual([...sectionVisualIds].sort(),[...templateIds].sort(),'validator and template section IDs must match');
});
