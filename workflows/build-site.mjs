import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';

const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const reportPattern = /^(weekly-\d{4}-\d{2}-\d{2}|monthly-\d{4}-\d{2})\.html$/;
// Explicitly withdrawn issues must not return from an older scheduler's source folder.
const withdrawnReports = new Set(['monthly-2026-10.html']);
export function renderIndex(issues) {
 const reports = issues.filter(issue=>!withdrawnReports.has(issue.name)).sort((a,b) => b.date.localeCompare(a.date) || a.name.localeCompare(b.name));
 const latest = reports.find(r => r.type === 'weekly');
 const months = [...new Set(reports.map(r => r.date.slice(0,7)))];
 const years = [...new Set(reports.map(r => r.date.slice(0,4)))];
 const monthLabel = month => `${month.slice(0,4)}년 ${Number(month.slice(5))}월`;
 const arrow = '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>';
 const rows = month => reports.filter(r => r.date.startsWith(month)).map(r => `<article class="issue-row" data-type="${r.type}" data-year="${r.date.slice(0,4)}"><time datetime="${r.date}">${r.date.replaceAll('-','.')}</time><span class="issue-type ${r.type}">${r.type==='weekly'?'주간':'월간 리포트'}</span><h3><a href="reports/${r.name}">${esc(r.title)}</a></h3><span class="row-arrow" aria-hidden="true">${arrow}</span></article>`).join('');
 return `<!doctype html>
<html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="description" content="게임마이스터고 학생을 위한 게임·AI·취업 리서치 아카이브. 최신 주간 리포트와 월별 기록을 찾아보세요."><title>Game Trend Report | 게임·AI 리서치</title><link rel="stylesheet" href="assets/report/archive.css"><link rel="stylesheet" href="assets/report/share.css"><script defer src="assets/report/archive.js"></script><script defer src="assets/report/share.js"></script></head>
<body><a class="skip-link" href="#archive">리포트 목록으로 건너뛰기</a><div class="site-wrap"><header class="site-header"><a class="wordmark" href="./" aria-label="Game Trend Report 홈"><svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true"><path d="M3 23V13h5v10M12 23V7h5v16M21 23V2h5v21" fill="currentColor"/></svg>GAME TREND REPORT</a><nav aria-label="주 메뉴"><a href="#weekly">주간 리포트</a><a href="#monthly">월간 리포트</a><a href="standards/">제작·검수 기준</a></nav></header>
<main><section class="home-intro" aria-labelledby="home-title"><div class="intro-copy"><h1 id="home-title">게임을 읽고,<br>다음 작품으로.</h1><p>게임의 재미를 분석하고, AI를 제작에 적용하고,<br class="desktop-break"> 이번 주의 발견을 내 프로젝트로 연결합니다.</p><a class="primary-link" href="${latest?'reports/'+latest.name:'reports/welcome.html'}">${latest?'최신 리포트 읽기':'리포트 발행 안내 보기'}${arrow}</a><p class="publish-note">매주 토요일 오전 8시 · 한국 시간</p></div>
<aside class="latest-issue" aria-label="최신 주간 리포트"><div class="latest-meta"><span>이번 주 리포트</span>${latest?`<time datetime="${latest.date}">${latest.date.replaceAll('-','.')}</time>`:''}</div>${latest?`<h2><a href="reports/${latest.name}">${esc(latest.title.replace(/ · 게임 트렌드 리포트$/,''))}</a></h2><p>${esc(latest.description)}</p><a class="text-link" href="reports/${latest.name}">이번 호 살펴보기 ${arrow}</a>`:'<h2>첫 주간 리포트를 준비하고 있어요.</h2><p>발행 후 최신 주간 리포트가 여기에 표시됩니다.</p>'}<div class="reading-path" aria-label="리포트 활용 순서"><span>동향 읽기</span>${arrow}<span>제작 실험</span>${arrow}<span>포트폴리오</span></div></aside></section>
<section id="archive" class="archive" aria-labelledby="archive-title"><div class="archive-heading"><div><h2 id="archive-title">쌓이는 발견, 이어지는 기록</h2><p>주간 동향과 월간 리포트을 날짜별로 찾아보세요.</p></div><span class="archive-total">전체 ${reports.length}개 리포트</span></div><div class="archive-shortcuts"><a id="weekly" href="#archive" data-archive-type="weekly">주간 ${reports.filter(r=>r.type==='weekly').length}개</a><a id="monthly" href="#archive" data-archive-type="monthly">월간 리포트 ${reports.filter(r=>r.type==='monthly').length}개</a><span>심층 분석은 현재 주간 리포트에 함께 담습니다.</span></div>
<form id="archive-filters" class="archive-filters" hidden role="search" aria-label="리포트 검색"><label class="search-field" for="report-search">제목·날짜 검색<input id="report-search" type="search" placeholder="예: AI, Balatro, 2026-10" autocomplete="off"></label><label for="report-type">리포트 유형<select id="report-type"><option value="all">전체 유형</option><option value="weekly">주간 리포트</option><option value="monthly">월간 리포트</option></select></label><label for="report-year">발행 연도<select id="report-year"><option value="all">전체 연도</option>${years.map(y=>`<option value="${y}">${y}년</option>`).join('')}</select></label><button type="reset" class="reset-button">초기화</button></form>
<p id="archive-status" class="archive-status" role="status" aria-live="polite">최신순 · ${reports.length}개 리포트</p><div id="archive-groups">${months.map((month,i)=>`<details class="month-group" open data-default-open="${i===0}"><summary><span>${monthLabel(month)}</span><span class="month-count">${reports.filter(r=>r.date.startsWith(month)).length}개 리포트</span></summary><div class="issue-list">${rows(month)}</div></details>`).join('')}</div><div id="archive-empty" class="archive-empty" ${reports.length?'hidden':''}><h3>${reports.length?'조건에 맞는 리포트가 없어요.':'첫 리포트를 준비하고 있어요.'}</h3><p>${reports.length?'검색어를 줄이거나 유형·연도를 바꿔 보세요.':'발행 후 이곳에 날짜별로 차곡차곡 쌓입니다.'}</p></div><noscript><p>검색은 JavaScript를 켜면 사용할 수 있습니다. 아래 월별 목록으로 모든 리포트를 읽을 수 있어요.</p></noscript></section>
</main><footer class="site-footer"><div><strong>GAME TREND REPORT</strong><p>발견에서 실험으로, 실험에서 나의 작품으로.</p></div><div><p>토요일 07:00 조사·교정·배포 준비 · 08:00 링크 전송<br>사실·추정·추천을 구분하고 출처와 확인일을 기록합니다.<br>월간 별도 발행은 없으며 과거 월간 리포트는 보존합니다.</p><a href="https://github.com/rnjsxogus0705/game-trend-report">공개 저장소</a></div></footer></div></body></html>`;
}

export async function buildSite({site, source}) {
 const out=path.join(site,'reports');
 await fs.mkdir(out,{recursive:true});
 for(const name of withdrawnReports)await fs.rm(path.join(out,name),{force:true});
 const markdownPattern=/^weekly-\d{4}-\d{2}-\d{2}(?:-[A-Za-z0-9_-]+)?\.md$/;
 const publishedMarkdown=new Set();
 const reportNames=new Set([...(await fs.readdir(source)),...(await fs.readdir(out))].filter(name=>reportPattern.test(name)&&!withdrawnReports.has(name)));
 for(const name of reportNames){
  let html;try{html=await fs.readFile(path.join(source,name),'utf8');}catch(error){if(error.code!=='ENOENT')throw error;html=await fs.readFile(path.join(out,name),'utf8');}
  for(const [,asset] of html.matchAll(/href=["'](weekly-[^"'/?#]+\.md)["']/g))if(markdownPattern.test(asset))publishedMarkdown.add(asset);
 }
 for(const name of await fs.readdir(source)) {
  if(markdownPattern.test(name)||/^weekly-\d{4}-\d{2}-\d{2}\.(?:js|json)$/.test(name)) {
   if(name.endsWith('.md')&&!publishedMarkdown.has(name))throw Error('Report Markdown must be explicitly linked from its issue HTML: '+name);
   const text=await fs.readFile(path.join(source,name),'utf8');
   if(name.endsWith('.md')&&text.trim().length<300)throw Error('Empty idea draft: '+name);
   if(/(?:github_pat_[A-Za-z0-9_]+|gh[pousr]_[A-Za-z0-9]+)/.test(text))throw Error('Possible credential in public asset: '+name);
   if(path.resolve(source)!==path.resolve(out))await fs.writeFile(path.join(out,name),text,'utf8');
   continue;
  }
  if(!reportPattern.test(name)||withdrawnReports.has(name))continue;
  const html=await fs.readFile(path.join(source,name),'utf8');
  const bodyText=html.replace(/<style[\s\S]*?<\/style>/gi,'').replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();
  if(bodyText.length<3000||(html.match(/<h2\b/gi)||[]).length<5||(html.match(/href="https:\/\//g)||[]).length<5||!html.includes('확인일'))throw Error('Report lacks substantive research, source links, sections or retrieval date: '+name);
  if(/(?:github_pat_[A-Za-z0-9_]+|gh[pousr]_[A-Za-z0-9]+|[\w-]{24,}\.[\w-]{6,}\.[\w-]{20,})/.test(html))throw Error('Possible credential detected; publication stopped.');
  if(path.resolve(source)!==path.resolve(out))await fs.writeFile(path.join(out,name),html,'utf8');
 }
 const issues=[];
 for(const name of (await fs.readdir(out)).filter(n=>reportPattern.test(n))) {
  const html=await fs.readFile(path.join(out,name),'utf8');
  issues.push({name,type:name.startsWith('weekly')?'weekly':'monthly',date:name.replace(/^(weekly|monthly)-|\.html$/g,''),title:html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]||name,description:html.match(/<meta name="description" content="([^"]+)"/i)?.[1]||'게임·AI·제작의 발견을 읽어보세요.'});
 }
 await fs.writeFile(path.join(site,'index.html'),renderIndex(issues),'utf8');
 console.log('Site built: '+issues.length+' published reports.');
}
if(process.argv[1] && import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href) {
 const base=path.dirname(fileURLToPath(import.meta.url));
 // The synced Windows script lives beside site/; the repository copy lives in workflows/.
 const site=path.basename(base)==='workflows'?path.dirname(base):path.join(base,'site');
 const source=path.basename(base)==='workflows'?path.join(site,'reports'):path.join(base,'reports');
 await buildSite({site,source});
}
