import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const file='reports/weekly-2026-10-31.html';
const previous=execFileSync('git',['show','d7156f9:'+file],{cwd:root,encoding:'utf8'});
const current=await fs.readFile(path.join(root,file),'utf8');
const audit=JSON.parse(await fs.readFile(path.join(root,'instructions/KOREAN-REVIEW-2026-10-31.json'),'utf8'));
let approved=previous;
for(const change of audit.changes.filter(change=>change.file===file)){
 const unmark=value=>value.replace(/<\/?mark\b[^>]*>/g,'');
 if(approved.includes(change.before))approved=approved.replace(change.before,change.after);
 else if(approved.includes(unmark(change.before)))approved=approved.replace(unmark(change.before),unmark(change.after));
 else assert.ok(current.includes(change.after),'추가된 설명의 교정 결과를 찾을 수 없음: '+change.after);
}

function withoutSkillAdditions(html){
 for(const className of ['skill-selection-map','skill-selection','skill-evidence-figure','learning-section-guide','lab-explanation','github-selection-map','github-selection','career-guide','career-deadlines']){
  let found;
  while((found=[...html.matchAll(/<([a-z]+)\b[^>]*class="([^"]*)"[^>]*>/g)].find(match=>match[2].split(/\s+/).includes(className)))){
   const tail=html.slice(found.index+found[0].length),tags=new RegExp('<(/?)'+found[1]+'\\b[^>]*>','g');let depth=1,end;
   for(const match of tail.matchAll(tags)){depth+=match[1]?-1:1;if(!depth){end=found.index+found[0].length+match.index+match[0].length;break;}}
   assert.ok(end,'Unclosed new skill block');html=html.slice(0,found.index)+html.slice(end);
  }
 }
 return html.replace(/<p class="caption"><svg[\s\S]*?<\/svg> 이 호의 선택 기준<\/p>/g,'');
}
const bodyText=html=>withoutSkillAdditions(html).match(/<body\b[^>]*>([\s\S]*?)<\/body>/i)[1]
 .replace(/<header\b[^>]*data-editorial-cover[\s\S]*?<\/header>/i,'').replace(/<section\b[^>]*data-editorial-summary[\s\S]*?<\/section>/i,'').replace('<a href="#issue-summary">이번 호 한눈에 보기</a>','')
 .replace(/<details class="mobile-nav">[\s\S]*?<\/details>/i,'').replace(/<figure class="idea-concept"[\s\S]*?<\/figure>/g,'').replace(/<figure class="route-visual"[\s\S]*?<\/figure>/g,'').replace(/<ol class="production-route-flow"[\s\S]*?<\/ol>/g,'').replace(/<dl class="route-checks"[\s\S]*?<\/dl>/g,'').replace(/<figure class="chapter-visual"[\s\S]*?<\/figure>/g,'').replace(/<div class="top-evidence">[\s\S]*?<\/div>/g,'').replace(/<p class="top-visual-note"[^>]*>[\s\S]*?<\/p>/g,'').replace(/<aside\b[^>]*>[\s\S]*?<\/aside>/gi,'').replace(/<p\b[^>]*data-editorial-ui[\s\S]*?<\/p>/gi,'').replace(/<summary\b[^>]*data-editorial-ui[\s\S]*?<\/summary>/gi,'')
 .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi,'')
 .replace(/<\/?mark\b[^>]*>/g,'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();
assert.deepEqual(bodyText(current).split(/\s+/).sort(),bodyText(approved).split(/\s+/).sort(),'승인된 문장 교정 외 본문 누락·중복이 없어야 합니다.');
const urls=html=>[...html.replace(/<details class="mobile-nav">[\s\S]*?<\/details>/i,'').replace(/<aside\b[^>]*>[\s\S]*?<\/aside>/gi,'').matchAll(/(?:href|src)="([^"]+)"/g)].map(m=>!/^https?:/.test(m[1])&&/\.(css|js)\?/.test(m[1])?m[1].split('?')[0]:m[1]).filter(s=>!s.includes('weekly-editorial.css')&&s!=='#issue-summary');
const remaining=urls(current);for(const url of urls(previous)){const index=remaining.indexOf(url);assert.ok(index>=0,'기존 링크 보존: '+url);remaining.splice(index,1);}
assert.deepEqual([...current.matchAll(/data-report-part="([^"]+)"/g)].map(m=>m[1]),['overview','tools','making','resources']);
assert.deepEqual([...current.matchAll(/data-toc-group="([^"]+)"/g)].map(m=>m[1]),['overview','tools','making','resources']);
assert.ok(current.includes('<body class="weekly-editorial">'),'주간 디자인 옵트인');
assert.equal((current.match(/<h1\b/g)||[]).length,1);
assert.match(current,/<h2>이번 주 꼭 볼 TOP 10<\/h2>/);
assert.equal((current.match(/class="top-ten-item"/g)||[]).length,10);
const cssLinks=[...current.matchAll(/<link[^>]+rel="stylesheet"[^>]+href="([^"]+)"/g)].map(m=>m[1].split('?')[0]);
assert.equal(cssLinks.at(-1),'../assets/report/weekly-editorial.css');
console.log('본문·기존 링크 보존과 카테고리 일치, 단일 h1, TOP 10, 마지막 주간 스타일 연결 검사 통과');
for(const name of audit.filesReviewed.filter(name=>name.endsWith('.md'))){
 let expected=execFileSync('git',['show','d7156f9:'+name],{cwd:root,encoding:'utf8'});
 for(const change of audit.changes.filter(change=>change.file===name)){
  assert.ok(expected.includes(change.before),'Markdown 교정 원문: '+name);
  expected=expected.replace(change.before,change.after);
 }
 assert.equal(await fs.readFile(path.join(root,name),'utf8'),expected,'승인된 교정 외 Markdown 변경: '+name);
}
const embedded=[...current.matchAll(/<code[^>]*id="((?:idea|ai-production)-code-[123])"[^>]*>([\s\S]*?)<\/code>/g)];
const decode=value=>value.replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&amp;/g,'&');
assert.equal(embedded.length,6);
for(const [,id,text] of embedded){
 const suffix=id.startsWith('ai-production')?'ai-plan-':'idea-';
 const name=`reports/weekly-2026-10-31-${suffix}0${id.at(-1)}.md`;
 assert.equal(decode(text).trim(),(await fs.readFile(path.join(root,name),'utf8')).trim(),'복사용 기획/다운로드 불일치: '+id);
}
console.log('호별 Markdown 9개와 HTML 복사용 기획 6개 동기화 검사 통과');
