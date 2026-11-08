import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {reportElements,validateSectionPractices} from './validate-weekly-presentation.mjs';

const catalog=JSON.parse(fs.readFileSync(new URL('../.agents/skills/weekly-game-report/references/section-templates.json',import.meta.url),'utf8'));
test('22섹션·중첩 소유와 실제 렌더 필드를 유지한다',()=>{
 assert.equal(catalog.sections.length,22);
 assert.equal(new Set(catalog.sections.map(s=>s.id)).size,22);
 const renderer=fs.readFileSync(new URL('./render-report-section.mjs',import.meta.url),'utf8');
 for(const section of catalog.sections){
  assert.ok(section.fields.length&&section.reviews.length&&section.components.length,section.id);
  assert.equal(section.packetContract.sectionId,section.id);
  for(const key of Object.keys(section.packetContract.candidate))assert.ok(renderer.includes('candidate.'+key),section.id+': unsupported '+key);
  for(const key of section.packetContract.historicalRendererKeys)assert.ok(section.packetContract.candidate[key],section.id+': historical field missing '+key);
  if(section.parent)assert.equal(section.lane,catalog.sections.find(s=>s.id===section.parent).lane);
 }
 assert.ok(catalog.sections.find(s=>s.id==='reading').packetContract.candidate.media.includes('videoId'));
 for(const id of ['brief','issue-summary','top10','game-ai-tools','agent-skills','github-trending'])assert.ok(!catalog.sections.find(s=>s.id===id).packetContract.candidate.lead);
 const sources=catalog.sections.find(s=>s.id==='sources').packetContract.candidate;
 assert.ok(sources.table&&sources.requestedLedgerUrl&&sources.sourceUrls&&sources.limitation);
 assert.ok(sources.requestedLedgerUrl.includes('user-requested-YYYY-MM-DD.json'));
});
test('영상 빈 예시는 실제 핸들러·제목·이미지·원문 구조를 보존한다',()=>{
 const html=catalog.shared.componentTemplates.lazyVideo;
 assert.ok(!html.includes('\\"'),'Literal escaped quotes break HTML attributes');
 const {elements}=reportElements(html);
 assert.ok(elements.some(n=>n.tag==='button'&&n.attrs['data-play-video']&&n.attrs['data-youtube-play']&&n.attrs['data-video-title']));
 assert.ok(elements.some(n=>n.tag==='img'&&n.attrs.alt&&n.attrs.loading==='lazy'));
 assert.ok(elements.some(n=>n.tag==='div'&&n.attrs.class==='video-slot'));
 assert.ok(elements.some(n=>n.tag==='a'&&n.attrs.href));
 const practice=reportElements(catalog.shared.componentTemplates.practice).elements;
 assert.ok(practice.some(n=>n.attrs.class==='practice-prompt'));
 assert.ok(practice.some(n=>n.tag==='button'&&n.attrs['data-copy-workflow']));
 assert.doesNotThrow(()=>validateSectionPractices('<section id="prototype">'+catalog.shared.componentTemplates.practice+'</section>',{sectionIds:['prototype']}));
});
