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
  'assets/report/share-v2.js','assets/report/reading-experience-scoped-v2.js',
  'assets/report/report-search.js','reports/weekly-YYYY-MM-DD.js'
 ]);
 assert.deepEqual(ref.newIssuePresentationAssets.deferScripts,catalog.shared.assetContract.deferScripts);
 assert.ok(catalog.shared.assetContract.css.includes('assets/report/report-search.css'));
 const disclosure=reportElements(catalog.shared.componentTemplates.scopedDisclosure).elements;
 assert.ok(disclosure.some(n=>n.attrs['data-disclosure-scope']==='game-ai-tools'&&n.attrs.role==='group'&&n.attrs['aria-label']));
 for(const action of ['expand','collapse'])assert.ok(disclosure.some(n=>n.tag==='button'&&n.attrs['data-disclosure-action']===action&&n.attrs['aria-controls']));
});
test('섹션 요약·그림 템플릿은 읽을 수 있는 텍스트와 이미지 설명을 함께 제공한다',()=>{
 const template=catalog.shared.componentTemplates.sectionInfographic;
 const {elements}=reportElements(template);
 const group=elements.find(n=>n.attrs.class==='infographic-summary');
 const heading=elements.find(n=>n.tag==='h3');
 const image=elements.find(n=>n.tag==='img');
 assert.ok(group&&heading&&group.attrs['aria-labelledby']===heading.attrs.id);
 assert.ok(image&&image.attrs.alt&&image.attrs.width&&image.attrs.height&&image.attrs.loading==='lazy');
 assert.ok(elements.some(n=>n.tag==='figcaption'));
 assert.equal(elements.filter(n=>n.tag==='li').length,3);
 assert.match(catalog.shared.sectionVisualContract.shape.points,/2~3/);
 assert.match(catalog.shared.sectionVisualContract.status,/미승인/);
 const ref=JSON.parse(fs.readFileSync(new URL('../.agents/skills/weekly-game-report/references/report-format-reference.json',import.meta.url),'utf8'));
 assert.deepEqual(ref.newIssuePresentationAssets.css,['assets/report/reading-experience.css','assets/report/section-infographic.css','assets/report/report-theme.css','assets/report/report-search.css']);
 assert.deepEqual(ref.newIssuePresentationAssets.css,catalog.shared.assetContract.css);
 assert.deepEqual(ref.newIssuePresentationAssets.deferScripts,['assets/report/share-v2.js','assets/report/reading-experience-scoped-v2.js','assets/report/report-search.js','reports/weekly-YYYY-MM-DD.js']);
 assert.deepEqual(ref.newIssuePresentationAssets.deferScripts,catalog.shared.assetContract.deferScripts);
 for(const asset of ['assets/report/share-v2.js','assets/report/reading-experience-scoped-v2.js','assets/report/report-theme.css','assets/report/report-theme.js','assets/report/section-infographic.css'])assert.ok(ref.presentationFilePaths.includes(asset));
 assert.match(ref.componentContracts.sectionInfographic.review,/320.*390.*768.*1440/);
 assert.ok(fs.readFileSync(new URL('../assets/report/section-infographic.css',import.meta.url),'utf8').includes('.infographic-summary'));
});

test('테마 자산은 첫 화면 이전 실행과 세 가지 상태 및 아이콘 접근성 계약을 제공한다',()=>{
 const ref=JSON.parse(fs.readFileSync(new URL('../.agents/skills/weekly-game-report/references/report-format-reference.json',import.meta.url),'utf8'));
 assert.deepEqual(catalog.shared.assetContract.headScripts,['assets/report/report-theme.js']);
 assert.deepEqual(ref.newIssuePresentationAssets.headScripts,catalog.shared.assetContract.headScripts);
 const icon=reportElements(catalog.shared.componentTemplates.inlineActionIcon).elements.find(n=>n.tag==='svg');
 assert.equal(icon.attrs['aria-hidden'],'true');assert.equal(icon.attrs.focusable,'false');
 assert.match(catalog.shared.themeContract.control,/시스템.*라이트.*다크/);
 assert.match(catalog.shared.themeContract.review,/화면 폭.*인쇄/);
 assert.ok(fs.readFileSync(new URL('../assets/report/report-theme.js',import.meta.url),'utf8').includes("choices=['system','light','dark']"));
 assert.ok(fs.readFileSync(new URL('../assets/report/report-theme.css',import.meta.url),'utf8').includes('.reading-detail'));
});

test('상단 네 영역은 핵심을 먼저 보이고 부가 조건을 인접한 기본 닫힌 상세로 보존한다',()=>{
 const contract=catalog.shared.informationHierarchyContract;
 assert.deepEqual(contract.priorityAreas.map(item=>item.selector),['#issue-summary','#top10','#game-ai-tools','#game-ai-tools .media-resource']);
 assert.equal(contract.priorityAreas[3].requiredHeading,'코드로 만드는 픽셀 효과와 공개 3D 자산');
 assert.match(contract.collapsed,/기본 닫힌.*details\.reading-detail/);
 assert.match(contract.collapsed,/별도 최상위 섹션으로 분리하지 않는다/);
 for(const word of ['날짜','마감','자격','비용','라이선스','출처','미확인 한계'])assert.ok(contract.preserve.includes(word));
 assert.match(contract.caption,/짧게/);assert.match(contract.caption,/실행 결과가 아니라는/);
 assert.match(contract.review,/320.*390.*768.*1440/);
 const detail=reportElements(catalog.shared.componentTemplates.supplementalDetail).elements.find(node=>node.tag==='details');
 assert.ok(detail&&detail.attrs.open===undefined&&detail.attrs.class==='reading-detail');
 assert.ok(reportElements(catalog.shared.componentTemplates.supplementalDetail).elements.some(node=>node.tag==='summary'));
 assert.ok(reportElements(catalog.shared.componentTemplates.supplementalDetail).elements.some(node=>node.attrs.class==='detail-meta'));
 const ref=JSON.parse(fs.readFileSync(new URL('../.agents/skills/weekly-game-report/references/report-format-reference.json',import.meta.url),'utf8'));
 assert.equal(ref.componentContracts.progressiveDisclosure.priorityAreas.length,4);
 assert.match(ref.componentContracts.progressiveDisclosure.decisionMetadata,/날짜.*자격.*비용.*라이선스/);
});

test('TOP 10과 도구 카드의 공식 미디어는 기본 화면에 두고 미확인 미디어는 원문 대체를 쓴다',()=>{
 const contract=catalog.shared.primaryMediaContract;
 assert.ok(contract.targets.includes('#top10 .top-ten-item'));
 assert.match(contract.placement,/details\.reading-detail 밖/);
 assert.match(contract.fallback,/임의 이미지.*채우지 않는다/);
 assert.match(contract.fallback,/공식 원문 링크/);
 assert.match(contract.detailBoundary,/긴 라이선스 조건.*상세/);
 assert.match(contract.review,/320.*390.*768.*1440/);
 const media=reportElements(catalog.shared.componentTemplates.primaryCardMedia).elements;
 const figure=media.find(node=>node.tag==='figure'),image=media.find(node=>node.tag==='img'),caption=media.find(node=>node.tag==='figcaption');
 assert.ok(figure&&figure.attrs.class.includes('official-media'));
 assert.ok(image&&image.attrs.alt&&image.attrs.width&&image.attrs.height&&image.attrs.loading==='lazy');
 assert.ok(caption);
 const fallback=reportElements(catalog.shared.componentTemplates.primaryCardMediaFallback).elements;
 assert.ok(fallback.some(node=>node.attrs.class==='media-fallback'));
 assert.ok(fallback.some(node=>node.tag==='a'&&node.attrs.href));
 const ref=JSON.parse(fs.readFileSync(new URL('../.agents/skills/weekly-game-report/references/report-format-reference.json',import.meta.url),'utf8'));
 assert.match(ref.componentContracts.primaryCardMedia.visible,/reading-detail 밖/);
 assert.match(ref.componentContracts.primaryCardMedia.fallback,/공식 원문/);
});

test('선택적 부가정보는 역할·본문·메타데이터를 보존하는 공통 상세 구조를 쓴다',()=>{
 const detail=reportElements(catalog.shared.componentTemplates.supplementalDetail).elements;
 assert.ok(detail.some(n=>n.tag==='details'&&n.attrs.class==='reading-detail'&&n.attrs['data-detail-kind']));
 assert.ok(detail.some(n=>n.tag==='summary'));
 assert.ok(detail.some(n=>n.attrs.class==='detail-body'));
 assert.ok(detail.some(n=>n.attrs.class==='detail-meta'));
 const ref=JSON.parse(fs.readFileSync(new URL('../.agents/skills/weekly-game-report/references/report-format-reference.json',import.meta.url),'utf8'));
 assert.match(ref.componentContracts.supplementalDisclosure.placement,/핵심 판단.*펼침 밖/);
 assert.match(ref.componentContracts.supplementalDisclosure.content,/확인일.*출처.*미확인 한계/);
 assert.match(ref.componentContracts.supplementalDisclosure.review,/320.*390.*768.*1440/);
 const css=fs.readFileSync(new URL('../assets/report/report-theme.css',import.meta.url),'utf8');
 for(const selector of ['[data-detail-kind]','.detail-body','.detail-meta'])assert.ok(css.includes(selector));
});
