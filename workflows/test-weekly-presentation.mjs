import {test} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs/promises';
import {validateWeeklyPresentation} from './validate-weekly-presentation.mjs';
const html=await fs.readFile(new URL('../reports/weekly-2026-10-31.html',import.meta.url),'utf8');
const share='<button id="report-share" type="button" aria-haspopup="dialog" aria-label="리포트 공유 메뉴 열기">공유</button>';
const future=html.replace('../assets/report/report.js','weekly-2026-11-07.js').replace('<main class="content" id="report">','<main class="content" id="report">'+share);
const check=value=>validateWeeklyPresentation(value,{reportDate:'2026-11-07'});
test('이번 디자인과 다음 호 스크립트 계약 검증',()=>{validateWeeklyPresentation(html,{reportDate:'2026-10-31'});check(future);});
test('신규·이전 AI 사례와 읽을거리 영상은 섹션 안 출처와 내용으로 검증한다',async()=>{
 const {validateAiCaseAndVideoResources}=await import('./validate-weekly-presentation.mjs');
 const newCase='<article data-selected-video="abcdefghijk"><h3>제작 과정</h3><p>AI 역할: 코드 초안. 사람 역할: 선택과 확인.</p><a href="https://www.youtube.com/watch?v=abcdefghijk">원문</a></article>';
 const video='<article data-kind="video"><h3>게임 제작 영상</h3><a href="https://www.youtube.com/watch?v=12345678901">원문</a></article>';
 const wrap=(c,v)=>`<section id="ai-only-lab">${c}</section><section id="reading">${v}</section>`;
 assert.doesNotThrow(()=>validateAiCaseAndVideoResources(wrap(newCase,video)));
 const legacy='<article data-ai-case="assisted"><h3>기존 사례</h3><a href="https://example.com/case">원문</a></article>';
 const legacyVideo='<article data-ai-resource="video"><h4>참고 영상</h4><a href="https://www.youtube.com/watch?v=12345678901">원문</a></article>';
 assert.doesNotThrow(()=>validateAiCaseAndVideoResources(`<section id="ai-only-lab">${legacy}${legacyVideo}</section><section id="reading"></section>`));
 for(const invalid of [newCase.replace('abcdefghijk','invalid'),newCase.replace('watch?v=abcdefghijk','watch?v=12345678901'),newCase.replace(/<a .*?<\/a>/,''),newCase.replace('AI 역할: 코드 초안.',''),newCase.replace('사람 역할: 선택과 확인.',''),newCase.replace('AI 역할: 코드 초안.','AI 역할:'),newCase.replace('사람 역할: 선택과 확인.','사람 역할:'),newCase.replace('<h3>제작 과정</h3>','')])assert.throws(()=>validateAiCaseAndVideoResources(wrap(invalid,video)),/AI case/);
 assert.throws(()=>validateAiCaseAndVideoResources(wrap('',video)+newCase),/AI case/);
 assert.throws(()=>validateAiCaseAndVideoResources(wrap(newCase,'')+video),/video resource/);
 assert.throws(()=>validateAiCaseAndVideoResources(wrap(newCase,video.replace('https://www.youtube.com/watch?v=12345678901','https://example.com/article'))),/video resource/);
 assert.throws(()=>validateAiCaseAndVideoResources(wrap(newCase,video.replace('<h3>게임 제작 영상</h3>',''))),/video resource/);
 assert.throws(()=>validateAiCaseAndVideoResources(wrap(newCase,video+video.replace('<h3>게임 제작 영상</h3>',''))),/video resource/);
 assert.throws(()=>validateAiCaseAndVideoResources(wrap(newCase,video.replace('<a href="https://www.youtube.com','<a href="https://example.com/article">기사</a><a href="https://www.youtube.com'))),/video resource/);
 assert.throws(()=>validateAiCaseAndVideoResources(wrap('<article data-ai-case="assisted">출처 없음</article>',video)),/AI case/);
});
test('정적 공유 버튼과 공통 셸 누락을 차단한다',()=>{
 assert.throws(()=>check(future.replace(share,'')),/share button/);
 assert.throws(()=>check(future.replace(share,share+share)),/share button/);
 assert.throws(()=>check(future.replace('aria-haspopup="dialog"','aria-haspopup="menu"')),/share button/);
 assert.throws(()=>check(future.replace(share,'<button id="report-share" type="button" aria-haspopup="dialog"></button>')),/share button/);
 assert.throws(()=>check(future.replace(share,'').replace('<main class="content" id="report">',share+'<main class="content" id="report">')),/share button/);
 assert.throws(()=>check(future.replace('id="print-button"','id="missing-print"')),/print button/);
 assert.throws(()=>check(future.replace('<footer class="footer">','<div class="footer">').replace('</footer>','</div>')),/footer/);
 assert.throws(()=>check(future.replace('<a href="../">리포트 아카이브</a>','<a href="https://example.test">리포트 아카이브</a>')),/archive/);
 assert.throws(()=>check(future.replace('id="sources"','id="missing-sources"')),/category structure|Section is outside|source section/);
});
test('CSS 마지막 순서와 필수 스크립트 누락 차단',()=>{assert.throws(()=>check(future.replace('weekly-editorial.css','missing.css')),/stylesheet must be last/);assert.throws(()=>check(future.replace('reading-experience.js','missing.js')),/required report script/);});
test('과거 호 차트 스크립트 재사용 차단',()=>assert.throws(()=>check(html),/issue-specific/));
test('요약 세 항목과 주제 이동 누락 차단',()=>{assert.throws(()=>check(future.replace('<dd>AI가','<p>AI가').replace('확인해요.</dd>','확인해요.</p>')),/takeaways/);assert.throws(()=>check(future.replace('<a href="#careers"><strong>','<a href="#sources"><strong>')),/topic links/);});
test('범주 밖 본문과 잘못된 목차 차단',()=>{assert.throws(()=>check(future.replace('data-report-part="tools"','data-report-part="wrong"')),/category structure/);assert.throws(()=>check(future.replace('<a href="#github-trending">GitHub 트렌딩','<a href="#games">GitHub 트렌딩')),/Navigation links/);});
test('Unity 하위 섹션이 있을 때만 도구 목차의 지정 위치를 허용한다',()=>{
 const guide='<section id="unity-official-guide"><h3>Unity 공식 도구</h3></section>';
 const link='<a href="#unity-official-guide">Unity 공식 도구</a>';
 const tool='<section class="chapter" id="game-ai-tools">';
 const nav='<a href="#game-ai-tools">게임 AI 도구 비교</a>';
 const withGuide=future.replace(tool,tool+guide),valid=withGuide.replace(nav,nav+link);
 assert.notEqual(withGuide,future);assert.notEqual(valid,withGuide);
 assert.doesNotThrow(()=>check(valid));
 assert.throws(()=>check(withGuide),/Navigation links/);
 assert.throws(()=>check(future.replace(nav,nav+link)),/Navigation links/);
 assert.throws(()=>check(valid.replace(nav+link,nav+link+link)),/Navigation links/);
 assert.throws(()=>check(valid.replace(nav+link,link+nav)),/Navigation links/);
 assert.throws(()=>check(valid.replace(tool+guide,tool).replace('<main class="content" id="report">','<main class="content" id="report">'+guide)),/inside game-ai-tools/);
 assert.throws(()=>check(valid.replace(tool+guide,tool).replace('<div class="card-flat" id="agent-skills">','<div class="card-flat" id="agent-skills">'+guide)),/inside game-ai-tools/);
 assert.throws(()=>check(valid.replace(tool+guide,tool+guide+guide)),/unique ID/);
});
test('새 탐색 셸은 자산·검색 양식·범위별 펼침을 함께 검증한다',async()=>{
 const {validateNavigationEnhancements:validate}=await import('./validate-weekly-presentation.mjs');
 const panel=(id,mobile=false)=>`<form id="${id}" data-report-search-panel role="search" aria-label="본문 검색" ${mobile?'hidden':''}><label for="${id}-input">검색</label><input id="${id}-input" type="search" data-report-search-input><button type="submit">찾기</button><p data-report-search-status role="status" aria-live="polite"></p><button type="button" data-report-search-prev aria-label="이전"></button><button type="button" data-report-search-next aria-label="다음"></button>${mobile?'<button type="button" data-report-search-close>닫기</button>':''}</form>`;
 const html=`<html><head><link rel="stylesheet" href="../assets/report/weekly-editorial.css"><link rel="stylesheet" href="../assets/report/report-search.css"><script defer src="../assets/report/share.js"></script><script defer src="../assets/report/reading-experience-scoped.js"></script><script defer src="../assets/report/report-search.js"></script><script defer src="weekly-2026-11-14.js"></script></head><body><header><button type="button" data-report-search-toggle aria-controls="mobile-search" aria-expanded="false">검색</button>${panel('mobile-search',true)}</header><nav id="side-nav">${panel('desktop-search')}</nav><section id="game-ai-tools"><div data-disclosure-scope="game-ai-tools" role="group" aria-label="도구 상세"><button type="button" data-disclosure-action="expand" aria-controls="detail-a detail-b">펼치기</button><button type="button" data-disclosure-action="collapse" aria-controls="detail-a detail-b">접기</button></div><details id="detail-a"></details><details id="detail-b"></details></section></body></html>`;
 const checkNew=value=>validate(value,{reportDate:'2026-11-14'});
 assert.equal(validate('<html></html>',{reportDate:'2026-11-07'}),false);
 assert.throws(()=>checkNew('<html></html>'),/stylesheet/);
 assert.equal(checkNew(html),true);
 // Scoped controls may be inserted by the scoped script after HTML parsing.
 assert.equal(checkNew(html.replace(/<div data-disclosure-scope="game-ai-tools"[\s\S]*?<\/div>/,'')),true);
 const bad=[
  html.replace('report-search.css','missing.css'),
  html.replace('reading-experience-scoped.js','reading-experience.js'),
  html.replace('<script defer src="../assets/report/report-search.js"></script>','<script defer src="../assets/report/report-search.js"></script><script defer src="../assets/report/reading-experience.js"></script>'),
  html.replace('<script defer src="../assets/report/report-search.js"></script>','<script src="../assets/report/report-search.js"></script>'),
  html.replace('data-report-search-status','data-missing-status'),
  html.replace('for="desktop-search-input"','for="wrong"'),
  html.replace('aria-controls="mobile-search"','aria-controls="wrong"'),
  html.replace('data-report-search-close','data-missing-close'),
  html.replace('aria-controls="detail-a detail-b">접기','aria-controls="detail-a">접기'),
  html.replace('id="detail-b"','id="detail-a"')
 ];
 for(const value of bad)assert.throws(()=>checkNew(value));
 assert.throws(()=>validate(html.replace('report-search.js','missing.js'),{reportDate:'2026-11-07'}));
});
test('강조·모바일 대안·단일 표지 제목 누락 차단',()=>{assert.throws(()=>check(future.replace(/<\/?mark\b[^>]*>/g,'')),/highlighted/);assert.throws(()=>check(future.replace('<nav id="mobile-links">','<nav id="missing-mobile-links">')),/mobile navigation/);assert.throws(()=>check(future.replace('<h1>','<h2>').replace('</h1>','</h2>')),/one h1/);});
test('TOP 10 공개 영역 수와 잘못된 HTML 구조 차단',()=>{assert.throws(()=>check(future.replace('class="top-ten-item"','class="missing-item"')),/three items/);assert.throws(()=>check(future.replace('</dl>','</div>')),/nesting/);});
test('범주 구분선 제목과 요약 역할도 재현',()=>{assert.throws(()=>check(future.replace('id="part-tools" data-editorial-ui>AI 도구와 기술','id="part-tools" data-editorial-ui>다른 이름')),/divider label/);assert.throws(()=>check(future.replace('<dt>핵심 판단</dt>','<dt>다른 이름</dt>')),/takeaway labels/);});
test('TOP 10 출처·선정 이유·실행 누락 차단',()=>{assert.throws(()=>check(future.replace('class="top-why"','class="missing-why"')),/visible evidence/);assert.throws(()=>check(future.replace('class="top-source"','class="missing-source"')),/visible evidence/);});
test('여섯 아이디어의 설명 그림 누락 차단',()=>assert.throws(()=>check(future.replace('class="idea-concept"','class="missing-concept"')),/six ideas/));
test('스킬 선정 이유·강점·한계 누락 차단',()=>assert.throws(()=>check(future.replace('class="note skill-selection"','class="note missing-selection"')),/Agent Skill needs/));

test('학습 프롬프트 누락·잘못된 복사 대상 차단',()=>{
 assert.throws(()=>check(future.replace('id="practice-lab-1"','id="missing-practice-lab-1"')),/Practice prompt needs a copy target/);
 assert.throws(()=>check(future.replace('data-copy-workflow="practice-prototype-1"','data-copy-workflow="missing-prompt"')),/Practice prompt needs a copy target/);
 assert.throws(()=>check(future.replace('class="practice-prompt"','class="missing-prompt"')),/Missing practice prompts/);
});

test('취업·진로 다섯 범주의 근거와 모집 상태 누락 차단',()=>{
 for(const category of ['startups','events','bootcamps','admissions','news']){
  assert.match(html,new RegExp('data-career-category="'+category+'"'));
  assert.throws(()=>check(future.replace('data-career-category="'+category+'"','data-career-category="missing"')),/Career coverage missing/);
 }
 assert.throws(()=>check(future.replaceAll('data-career-status="planned"','data-missing-status="planned"')),/Career status missing/);
});
test('수동 안내는 위젯 개수에 포함하지 않고 불완전한 위젯은 거부한다',async()=>{
 const {validateSectionPractices}=await import('./validate-weekly-presentation.mjs');
 const guide='<div class="practice-prompt practice-note"><p>수동 안내</p></div>';
 const valid='<div class="practice-prompt"><pre id="target">[입력]을 정리</pre><button data-copy-workflow="target">복사</button><p>받을 결과 직접 확인 이어서 물어보기</p></div>';
 const wrap=s=>`<section id="reverse">${s}</section>`;
 assert.doesNotThrow(()=>validateSectionPractices(wrap(guide+valid),{sectionIds:['reverse']}));
 assert.throws(()=>validateSectionPractices(wrap(guide),{sectionIds:['reverse']}),/Missing practice/);
 for(const bad of [valid.replace(/<button[^>]*>.*?<\/button>/,''),valid.replace(/<pre[^>]*>.*?<\/pre>/,''),valid.replace('data-copy-workflow="target"','data-copy-workflow="wrong"'),valid.replace('[입력]','입력'),valid.replace('이어서 물어보기','후속 질문')])assert.throws(()=>validateSectionPractices(wrap(guide+bad),{sectionIds:['reverse']}),/Practice prompt/);
 assert.throws(()=>validateSectionPractices(wrap(valid+'<div class="practice-prompt"><button>가짜</button></div>'),{sectionIds:['reverse']}),/Practice prompt/);
});
test('읽을거리 실제 분류와 빈 범주의 조사 한계를 검증한다',async()=>{
 const {validateReadingResources}=await import('./validate-weekly-presentation.mjs');
 const resource=(kind,url)=>`<article data-kind="${kind}"><p><a href="${url}">자료 제목</a></p></article>`;
 const article=resource('article','https://example.com/article'),video=resource('video','https://www.youtube.com/watch?v=abcdefghijk'),post=resource('post','https://example.com/post');const wrap=s=>`<section id="reading">${s}</section>`;const issueDate='2026-11-07';
 assert.deepEqual(validateReadingResources(wrap(article+video+post),{review:{},issueDate}),{article:1,video:1,post:1});
 assert.throws(()=>validateReadingResources(wrap(article+video+resource('post','https://youtu.be/abcdefghijk')),{review:{},issueDate}),/video kind/);
 assert.throws(()=>validateReadingResources(wrap(article+video),{review:{},issueDate}),/Missing reading search coverage: post/);
 const missing={kind:'post',count:0,status:'unverified',searchedAt:'2026-11-07',searchScope:'운영기관 공지',finding:'확인하지 못함',limitation:'접근 불가',sourceUrls:[]};
 assert.equal(validateReadingResources(wrap(article+video),{review:{readingCoverage:[missing]},issueDate}).post,0);
 assert.throws(()=>validateReadingResources(wrap(article+video),{review:{readingCoverage:[{...missing,searchedAt:'2026-10-01'}]},issueDate}),/Missing reading search coverage/);
 assert.throws(()=>validateReadingResources(wrap(article+video),{review:{readingCoverage:[{...missing,count:1}]},issueDate}),/count mismatch/);
 assert.throws(()=>validateReadingResources(wrap(article+video)+'<div data-kind="post"><a href="https://example.com">범위 밖</a></div>',{review:{},issueDate}),/Missing reading search coverage: post/);
 assert.throws(()=>validateReadingResources(wrap(article+video+'<div data-kind="post"></div>'),{review:{},issueDate}),/primary source/);
 const withReference='<article data-kind="article"><a href="https://example.com/article">기사</a><a href="https://youtube.com/watch?v=abcdefghijk">참고 영상</a></article>';assert.doesNotThrow(()=>validateReadingResources(wrap(withReference+video+post),{review:{},issueDate}));
});

test('아이디어 원문을 펼치고 접으면 스크롤 없이 읽기 진행률을 다시 계산한다',async()=>{
 const vm=await import('node:vm');const source=await fs.readFile(new URL('../reports/weekly-2026-11-07.js',import.meta.url),'utf8');
 const listeners={},nodes={'tool-goal':{addEventListener(){}},'print-button':{addEventListener(){}},'read-percent':{textContent:''},'read-bar':{style:{width:''}}};
 const document={documentElement:{scrollHeight:11000},addEventListener:(type,callback,options)=>{listeners[type]={callback,options};},getElementById:id=>nodes[id]};
 vm.runInNewContext(source,{document,window:{print(){}},addEventListener(){},innerHeight:1000,scrollY:1000,navigator:{clipboard:{writeText(){}}}});
 assert.equal(nodes['read-percent'].textContent,'10%');assert.equal(listeners.toggle.options,true);
 document.documentElement.scrollHeight=21000;listeners.toggle.callback({});assert.equal(nodes['read-percent'].textContent,'5%');assert.equal(nodes['read-bar'].style.width,'5%');
 document.documentElement.scrollHeight=11000;listeners.toggle.callback({});assert.equal(nodes['read-percent'].textContent,'10%');
});
