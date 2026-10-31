(async()=>{
  'use strict';
  const lab=document.getElementById('ai-only-lab');
  if(!lab)return;
  let data;
  try{
    const response=await fetch('../assets/report/research/international-resources-2026-10-31.json?v=recent-ai');
    if(!response.ok)throw Error('Resource list unavailable');
    data=await response.json();
  }catch{
    const notice=document.createElement('p');notice.textContent='해외 제작 자료를 불러오지 못했어요. 페이지를 새로고침하거나 아래 조사 기록을 확인해 주세요.';
    const source=document.createElement('a');source.href='../assets/report/research/international-resources-2026-10-31.json';source.textContent='해외 제작 조사 기록';notice.append(' ',source);lab.querySelector('.chapter-head')?.after(notice);return;
  }
  const node=(tag,text,className)=>{const el=document.createElement(tag);if(text)el.textContent=text;if(className)el.className=className;return el;};
  const link=(label,url)=>{const el=node('a',label);el.href=url;if(!url.startsWith('#')){el.target='_blank';el.rel='noopener noreferrer';}return el;};
  const section=node('section',null,'international-resources');
  section.append(node('h3','최근 해외 AI 게임 제작 사례'));
  section.append(node('p','오래된 일반 개발 강연을 제외하고, 2026년 10월에 공개된 해외 제작 영상 3개를 골랐어요. AI로 코드·이미지·게임을 연결하는 과정과 실제 플레이테스트를 중심으로 살펴봐요.'));
  const scope=node('p',null,'international-scope');scope.append(node('strong','‘100% AI 제작’은 어디까지일까요? '),node('mark','제작자의 전체 제작 주장과 실제 공개한 작업 범위를 나눠 확인해요.'),' 사람이 방향을 정하고 도구를 연결한 사례이며, 100% 무인 제작을 독립 검증한 사례는 확보하지 못했어요. Max Blade는 커밋 690개 중 98%를 Claude와 공동 작성했다고 밝혀 비교 사례로 구분했어요.');section.append(scope);
  section.append(node('p','선정 기준: 최근 공개 여부, 제작 과정의 구체성, 결과물·테스트 자료, 확인 당시의 관심 지표예요. 조회수는 인기 전체 순위나 게임 완성도 점수가 아니에요.','international-resource-meta'));
  const grid=node('div',null,'international-resource-grid');
  for(const item of data.resources){
    if(!/^[\w-]{11}$/.test(item.videoId))continue;
    const article=node('article',null,'international-resource');article.dataset.videoId=item.videoId;
    const heading=node('header');heading.append(node('p',item.creator+' · '+item.dateLabel,'international-resource-meta'),node('h4',item.displayTitle));
    const original=node('p',null,'international-resource-meta');original.append(link(item.title,item.videoUrl));heading.append(original);article.append(heading);
    const preview=node('div',null,'youtube-preview');
    const button=node('button');button.type='button';button.dataset.youtubePlay=item.videoId;button.dataset.videoTitle=item.title;
    const image=node('img');image.src=`https://i.ytimg.com/vi/${item.videoId}/hqdefault.jpg`;image.alt=item.creator+' 제작 영상 썸네일';image.loading='lazy';
    const label=node('span','제작 영상 열기');globalThis.ReportIcons?.add(label,'play');button.append(image,label);preview.append(button);article.append(preview);
    image.addEventListener('error',()=>{image.hidden=true;label.textContent='썸네일을 불러오지 못했어요. 영상 원문에서 확인해 주세요.';});
    button.addEventListener('click',()=>{const frame=node('iframe');frame.src='https://www.youtube-nocookie.com/embed/'+item.videoId;frame.title=item.title;frame.allow='fullscreen; picture-in-picture';frame.allowFullscreen=true;preview.replaceChildren(frame);});
    const body=node('div',null,'international-resource-body');body.append(node('p',item.summary));
    const why=node('p');why.append(node('strong','선정 이유 '),node('mark',item.selectionReason));body.append(why);
    const points=node('ul');for(const text of item.highlights)points.append(node('li',text));body.append(points);
    const ai=node('p');ai.append(node('strong','AI 제작 범위 '),document.createTextNode(item.aiScope));body.append(ai);
    const popularity=node('p',null,'international-resource-meta');popularity.append(link('조회 '+item.popularity.views.toLocaleString('ko-KR')+'회 · 좋아요 '+item.popularity.likes.toLocaleString('ko-KR')+'개',item.popularity.evidenceUrl),' · '+item.popularity.checkedAt+' 원문 확인 당시');body.append(popularity);
    const links=node('p',null,'international-resource-links');links.append(link('영상 원문 보기',item.videoUrl));for(const extra of item.links)links.append(link(extra.label,extra.url));body.append(links);article.append(body);
    const details=node('details',null,'international-resource-detail');details.append(node('summary','사람이 한 일·볼 구간·확인 범위'));
    const role=node('p');role.append(node('strong','사람이 한 일 '),document.createTextNode(item.humanRole));details.append(role);
    const chapters=node('p',null,'international-resource-links');for(const chapter of item.chapters)chapters.append(link(chapter.time+' '+chapter.label,item.videoUrl+'&t='+chapter.seconds+'s'));details.append(node('p','아래 구간은 제작자가 설명란에 적은 목차예요. 타임스탬프 내용 전체를 대조한 것은 아니에요.','international-resource-meta'),chapters);
    const question=node('p');question.append(node('strong','내 프로젝트에 적용할 질문 '),document.createTextNode(item.question));details.append(question);
    for(const limit of item.limitations)details.append(node('p',limit));details.append(node('p',item.sponsorship),node('p',item.language,'international-resource-meta'));article.append(details);grid.append(article);
  }
  section.append(grid,node('p',data.method,'international-resource-meta'),link('한국어 제작 영상 모아 보기 →','#production-videos'));
  const head=lab.querySelector(':scope > .chapter-head');if(head)head.after(section);
})();
