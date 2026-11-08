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
test('공통 검색 템플릿과 형식 계약은 두 화면의 접근 가능한 검색을 명시한다',()=>{
 const html=catalog.shared.componentTemplates.headerSearch;
 const {elements}=reportElements(html);
 for(const name of ['toggle','panel','input','status','prev','next','close']){
  assert.equal(elements.filter(n=>Object.hasOwn(n.attrs,'data-report-search-'+name)).length,1,name);
 }
 const toggle=elements.find(n=>Object.hasOwn(n.attrs,'data-report-search-toggle'));
 const panel=elements.find(n=>Object.hasOwn(n.attrs,'data-report-search-panel'));
 assert.equal(toggle.attrs['aria-controls'],panel.attrs.id);
 assert.equal(toggle.attrs['aria-expanded'],'false');
 const input=elements.find(n=>n.tag==='input'&&n.attrs['data-report-search-input']!==undefined);
 assert.ok(input&&elements.some(n=>n.tag==='label'&&n.attrs.for===input.attrs.id));
 assert.ok(elements.some(n=>n.attrs['data-report-search-status']!==undefined&&n.attrs['aria-live']==='polite'));
 const ref=JSON.parse(fs.readFileSync(new URL('../.agents/skills/weekly-game-report/references/report-format-reference.json',import.meta.url),'utf8'));
 assert.equal(ref.componentContracts.reportSearch.controls.length,7);
 assert.match(ref.componentContracts.reportSearch.placement,/데스크톱.*모바일/);
 assert.match(ref.componentContracts.reportSearch.behavior,/details/);
 assert.match(ref.componentContracts.reportSearch.review,/320.*390.*768.*1440/);
 const desktop=reportElements(catalog.shared.componentTemplates.desktopSearch).elements;
 const desktopInput=desktop.find(n=>n.tag==='input'&&n.attrs['data-report-search-input']!==undefined);
 assert.ok(desktopInput&&desktop.some(n=>n.tag==='label'&&n.attrs.for===desktopInput.attrs.id));
 assert.notEqual(desktopInput.attrs.id,input.attrs.id);
 assert.match(ref.componentContracts.scopedToolDisclosure.placement,/목록 바로 앞/);
 assert.match(ref.componentContracts.scopedToolDisclosure.review,/다른 섹션/);
 assert.ok(catalog.shared.rules.some(rule=>rule.includes('상세 일괄 펼치기')));
 assert.deepEqual(catalog.shared.assetContract.deferScripts,[
  'assets/report/share.js','assets/report/reading-experience-scoped.js',
  'assets/report/report-search.js','reports/weekly-YYYY-MM-DD.js'
 ]);
 assert.deepEqual(ref.newIssuePresentationAssets.deferScripts,catalog.shared.assetContract.deferScripts);
 assert.ok(catalog.shared.assetContract.css.includes('assets/report/report-search.css'));
 const disclosure=reportElements(catalog.shared.componentTemplates.scopedDisclosure).elements;
 assert.ok(disclosure.some(n=>n.attrs['data-disclosure-scope']==='game-ai-tools'&&n.attrs.role==='group'&&n.attrs['aria-label']));
 for(const action of ['expand','collapse'])assert.ok(disclosure.some(n=>n.tag==='button'&&n.attrs['data-disclosure-action']===action&&n.attrs['aria-controls']));
});
