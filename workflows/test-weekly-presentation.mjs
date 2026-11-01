import {test} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs/promises';
import {validateWeeklyPresentation} from './validate-weekly-presentation.mjs';
const html=await fs.readFile(new URL('../reports/weekly-2026-10-31.html',import.meta.url),'utf8');
const future=html.replace('../assets/report/report.js','weekly-2026-11-07.js');
const check=value=>validateWeeklyPresentation(value,{reportDate:'2026-11-07'});
test('이번 디자인과 다음 호 스크립트 계약 검증',()=>{validateWeeklyPresentation(html,{reportDate:'2026-10-31'});check(future);});
test('CSS 마지막 순서와 필수 스크립트 누락 차단',()=>{assert.throws(()=>check(future.replace('weekly-editorial.css','missing.css')),/stylesheet must be last/);assert.throws(()=>check(future.replace('reading-experience.js','missing.js')),/required report script/);});
test('과거 호 차트 스크립트 재사용 차단',()=>assert.throws(()=>check(html),/issue-specific/));
test('요약 세 항목과 주제 이동 누락 차단',()=>{assert.throws(()=>check(future.replace('<dd>AI가','<p>AI가').replace('확인해요.</dd>','확인해요.</p>')),/takeaways/);assert.throws(()=>check(future.replace('<a href="#careers"><strong>','<a href="#sources"><strong>')),/topic links/);});
test('범주 밖 본문과 잘못된 목차 차단',()=>{assert.throws(()=>check(future.replace('data-report-part="tools"','data-report-part="wrong"')),/category structure/);assert.throws(()=>check(future.replace('<a href="#github-trending">GitHub 트렌딩','<a href="#games">GitHub 트렌딩')),/Navigation links/);});
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
