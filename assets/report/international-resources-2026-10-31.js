(async()=>{
  'use strict';
  const lab=document.getElementById('ai-only-lab');
  const heading=lab?.querySelector('#production-videos')||[...(lab?.querySelectorAll('h3.ai100-subhead')||[])].find(node=>node.textContent.includes('한국어')&&node.textContent.includes('제작'));
  let koreanGrid=heading?.nextElementSibling;
  while(koreanGrid&&!koreanGrid.classList.contains('ai100-resource-grid'))koreanGrid=koreanGrid.nextElementSibling;
  if(!koreanGrid?.classList.contains('ai100-resource-grid'))return;
  let resources;
  try {
    const response=await fetch('../assets/report/research/international-resources-2026-10-31.json');
    if(!response.ok)throw Error('Resource list unavailable');
    ({resources}=await response.json());
  }catch{return;}
  const section=document.createElement('section');section.className='international-resources';
  const title=document.createElement('h4');title.textContent='해외 제작 과정 · 상시 참고';
  const intro=document.createElement('p');intro.textContent='게임 설계·코딩·엔진 실습을 살펴볼 해외 상시 참고 자료예요. AI 사용을 공시한 제작 사례와는 구분해 읽어요. 제목·공개 설명을 확인했으며 영상 전체 시청과 자막 대조·실습 재현은 하지 않았어요. 자막 지원 여부는 영상 재생 화면에서 확인해요.';
  const grid=document.createElement('div');grid.className='international-resource-grid';
  for(const item of resources){
    if(!/^[\w-]{11}$/.test(item.videoId))continue;
    const article=document.createElement('article');article.className='international-resource';
    const meta=document.createElement('p');meta.className='international-resource-meta';meta.textContent=item.creator+' · '+item.dateLabel;
    const name=document.createElement('h5');name.textContent=item.title;
    const preview=document.createElement('div');preview.className='youtube-preview';
    const button=document.createElement('button');button.type='button';button.dataset.youtubePlay=item.videoId;button.dataset.videoTitle=item.title;
    const image=document.createElement('img');image.src=`https://i.ytimg.com/vi/${item.videoId}/hqdefault.jpg`;image.alt=item.title+' 영상 썸네일';image.loading='lazy';
    const label=document.createElement('span');label.textContent='영상 열기';globalThis.ReportIcons?.add(label,'play');
    button.append(image,label);preview.append(button);
    const summary=document.createElement('p');summary.textContent=item.summary;
    const question=document.createElement('p');const strong=document.createElement('strong');strong.textContent='볼 때 질문 ';question.append(strong,document.createTextNode(item.question));
    const language=document.createElement('p');language.className='international-resource-meta';language.textContent=item.language;
    const links=document.createElement('p');links.className='international-resource-links';
    const video=document.createElement('a');video.href=item.videoUrl;video.target='_blank';video.rel='noopener noreferrer';video.textContent='영상 직접 보기';links.append(video);
    if(item.sourceUrl!==item.videoUrl){const source=document.createElement('a');source.href=item.sourceUrl;source.target='_blank';source.rel='noopener noreferrer';source.textContent='제작자·행사 원문';links.append(source);}
    image.addEventListener('error',()=>{image.hidden=true;label.textContent='썸네일을 불러오지 못했어요. 영상을 열거나 원문을 확인해 주세요.';});
    button.addEventListener('click',()=>{const frame=document.createElement('iframe');frame.src='https://www.youtube-nocookie.com/embed/'+item.videoId;frame.title=item.title;frame.allow='fullscreen; picture-in-picture';frame.allowFullscreen=true;preview.replaceChildren(frame);});
    article.append(meta,name,preview,summary,question,language,links);grid.append(article);
  }
  const koreanLink=document.createElement('a');koreanLink.href='#production-videos';koreanLink.textContent='한국어 제작 영상 모아 보기 →';section.append(title,intro,koreanLink,grid);const head=lab.querySelector(':scope > .chapter-head');if(head)head.after(section);else koreanGrid.after(section);
})();
