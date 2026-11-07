(()=>{
  'use strict';
  const main=document.querySelector('main.content');
  if(!main)return;
  const groups=[...main.querySelectorAll('.top-ten-more,.reader-example,.practice-prompt')];
  function fold(nodes,label){
    if(!nodes.length)return;
    const details=document.createElement('details');
    details.className='reading-detail';
    const summary=document.createElement('summary');
    summary.textContent=label;
    globalThis.ReportIcons?.add(summary,'chevron-down');
    details.append(summary);
    nodes[0].before(details);
    nodes.forEach(node=>details.append(node));
    details.addEventListener('toggle',()=>{if(details.open)window.dispatchEvent(new Event('resize'));});
    groups.push(details);
  }
  function showMedia(section,head){
    const detail=section.querySelector(':scope > .reading-detail');
    if(!detail)return;
    const visibleSources=new Set([...section.querySelectorAll('figure img,.youtube-preview button')]
      .filter(node=>!node.closest('details:not([open])'))
      .map(node=>node.dataset.youtubePlay||node.currentSrc||node.src));
    const images=[...detail.querySelectorAll('figure')].filter(figure=>figure.querySelector('a[href^="http"] img'));
    const videos=[...detail.querySelectorAll('.youtube-preview')].filter(video=>{
      const id=video.querySelector('[data-youtube-play]')?.dataset.youtubePlay;
      return id && [...(video.closest('article')?.querySelectorAll('a[href^="http"]')||[])].some(a=>a.href.includes(id));
    });
    const trailers=section.id==='games'?[...detail.querySelectorAll('.report-video')].filter(video=>video.querySelector('video[data-hls]')&&video.querySelector('[data-hls-play]')&&video.querySelector('a[href^="http"]')):[];
    const candidates=trailers.length&&images.length?[images[0],trailers[0],...images.slice(1)]:videos.length&&images.length?[images[0],videos[0],...images.slice(1),...videos.slice(1)]:[...images,...videos];
    const gallery=document.createElement('div');gallery.className='reading-media-previews';
    const remaining=Math.max(0,2-head.querySelectorAll('.reading-media-previews>figure').length);
    for(const original of candidates){
      if(gallery.children.length===remaining)break;
      const isTrailer=original.classList.contains('report-video');
      const isVideo=original.classList.contains('youtube-preview');
      const sourceNode=isTrailer?original.querySelector('video'):isVideo?original.querySelector('[data-youtube-play]'):original.querySelector('img');
      const key=isTrailer?sourceNode.dataset.hls:isVideo?sourceNode.dataset.youtubePlay:sourceNode.currentSrc||sourceNode.src;
      if(visibleSources.has(key))continue;
      visibleSources.add(key);
      const article=original.closest('article');
      const source=isVideo?[...article.querySelectorAll('a[href^="http"]')].find(a=>a.href.includes(key)):original.querySelector('a[href^="http"]');
      if(!source)continue;
      const figure=document.createElement('figure');
      const title=article?.querySelector('h3,h4')?.textContent.trim();
      if(isVideo||isTrailer){
        const copy=original.cloneNode(true);
        copy.querySelectorAll('[id]').forEach(node=>node.removeAttribute('id'));
        copy.removeAttribute('id');copy.querySelectorAll('img').forEach(img=>{img.removeAttribute('width');img.removeAttribute('height');});figure.append(copy);
      }else{
        const link=source.cloneNode(false), image=sourceNode.cloneNode(false);
        image.removeAttribute('id');image.removeAttribute('width');image.removeAttribute('height');link.append(image);figure.append(link);
      }
      const caption=document.createElement('figcaption');
      if(title){const strong=document.createElement('strong');strong.textContent=title;caption.append(strong);}
      const note=document.createElement('span');
      note.textContent=isTrailer?'공식 상점 트레일러 · 전체 시청과 직접 플레이 검증은 하지 않았어요.':isVideo?'공개 영상 · 전체 시청과 재현은 하지 않았어요.':original.querySelector('figcaption')?.textContent.trim()||'원문에서 제공한 이미지예요.';
      const fallback=source.cloneNode(false);fallback.textContent=isVideo||isTrailer?'영상 원문 보기':'이미지 원문 보기';
      caption.append(note,fallback);figure.append(caption);
      const image=figure.querySelector('img');
      image?.addEventListener('error',()=>{image.hidden=true;note.textContent='이미지를 불러오지 못했어요. 아래 원문에서 확인해 주세요.';});
      gallery.append(figure);
    }
    if(gallery.children.length)head.querySelector('h2')?.after(gallery);
  }
  function showSkillVideos(section,head){
    if(!head)return;
    const gallery=document.createElement('div');gallery.className='reading-media-previews';
    for(const id of ['zVu9YlbPtog','eUz19GROIpY']){
      const link=[...section.querySelectorAll('a[href^="http"]')].find(a=>a.href.includes(id));
      if(!link)continue;
      const existing=section.querySelector(`[data-youtube-play="${id}"]`);
      const title=existing?.dataset.videoTitle||(link.closest('figcaption')?.textContent.includes('sprite-gen')?'sprite-gen 제작자 시연':link.textContent.trim());
      const figure=document.createElement('figure'), preview=document.createElement('div');preview.className='youtube-preview';
      const button=document.createElement('button');button.type='button';button.dataset.youtubePlay=id;button.dataset.videoTitle=title;
      const image=document.createElement('img');image.src=`https://i.ytimg.com/vi/${id}/hqdefault.jpg`;image.alt=title+' 썸네일';image.loading='lazy';
      const action=document.createElement('span');action.textContent='제작자 시연 보기';globalThis.ReportIcons?.add(action,'play');
      button.append(image,action);preview.append(button);figure.append(preview);
      const caption=document.createElement('figcaption'), name=document.createElement('strong'), note=document.createElement('span');
      name.textContent=title;note.textContent='제작자 공개 시연 · 전체 시청과 재현은 하지 않았어요.';
      const source=link.cloneNode(false);source.textContent='영상 원문 보기';
      image.addEventListener('error',()=>{image.hidden=true;note.textContent='이미지를 불러오지 못했어요. 아래 원문에서 확인해 주세요.';});
      caption.append(name,note,source);figure.append(caption);gallery.append(figure);
    }
    if(gallery.children.length)head.querySelector('h2')?.after(gallery);
  }
  main.querySelectorAll('section.chapter').forEach(section=>{
    if(section.id==='top10')return;
    if(section.id==='careers'&&section.querySelector('[data-career-expansion]'))return;
    if(section.id==='game-ai-tools'){
      const skills=section.querySelector(':scope > #agent-skills');
      if(skills)fold([skills],'게임 개발 스킬 자세히 보기');
      showSkillVideos(section,section.querySelector(':scope > .chapter-head'));
      const first=section.querySelector(':scope > .tool-research-card');
      const previews=['tool-spritegen','tool-meshy','tool-runway'].map(id=>section.querySelector('#'+id)).filter(Boolean);
      if(first && previews.length){
        const gallery=document.createElement('div');
        gallery.className='reading-tool-previews';
        previews.forEach(card=>{
          const link=document.createElement('a');link.href='#'+card.id;
          const picture=card.querySelector('img')?.cloneNode();
          if(picture){picture.removeAttribute('width');picture.removeAttribute('height');picture.alt='';picture.addEventListener('error',()=>{picture.hidden=true;});link.append(picture);}
          const name=document.createElement('strong');name.textContent=card.querySelector('h3')?.textContent||'';
          const label=document.createElement('span');label.textContent=card.querySelector('.tag')?.textContent||'';
          link.append(name,label);gallery.append(link);
        });
        first.before(gallery);
        const caption=document.createElement('p');caption.className='reading-tool-caption';
        caption.textContent='공식 자료 미리보기 · 출처와 확인일은 이미지를 눌러 도구 설명에서 확인해요.';
        gallery.after(caption);
      }
      if(first){const nodes=[];for(let node=first;node;node=node.nextElementSibling)nodes.push(node);fold(nodes,'도구별 사례와 출처 자세히 보기');}
      const reviewed=section.querySelector(':scope > [data-reviewed-packet]');
      if(reviewed)fold([reviewed],'작업별 해설과 공식 자료 자세히 보기');
      showMedia(section,section.querySelector(':scope > .chapter-head'));
      return;
    }
    const head=section.querySelector(':scope > .chapter-head');
    if(!head)return;
    const nodes=[];
    for(let node=head.nextElementSibling;node;node=node.nextElementSibling)nodes.push(node);
    if(nodes.length>1 && nodes[0].textContent.trim().length<1500)nodes.shift();
    if((section.id==='techniques' || section.id==='lab') && nodes[0]?.matches('.flow,.chapter-visual,.learning-section-guide,.lab-explanation'))nodes.shift();
    const title=head.querySelector('h2')?.innerText.trim().replace(/\s+/g,' ')||'이 장';
    fold(nodes.filter(node=>!(section.id==='lab'&&node.matches('.grid2'))&&!node.querySelector('canvas,.flow,.github-selection')&&!node.matches('.flow,.chapter-visual,.learning-section-guide,.lab-explanation,.practice-prompts,.creator-supplement')),title+' · 자세히 보기');
    showMedia(section,head);
  });
  if(!groups.length)return;
  const controls=document.createElement('div');
  controls.className='reading-controls';
  controls.setAttribute('aria-label','리포트 상세 내용');
  for(const [label,open] of [['상세 내용 모두 펼치기',true],['상세 내용 모두 접기',false]]){
    const button=document.createElement('button');button.type='button';button.textContent=label;
    globalThis.ReportIcons?.add(button,open?'chevron-down':'chevron-up');
    button.addEventListener('click',()=>main.querySelectorAll('#report details').forEach(group=>{group.open=open;}));
    controls.append(button);
  }
  main.querySelector('#top10')?.after(controls);
  function reveal(target){
    for(let node=target;node;node=node.parentElement)if(node.tagName==='DETAILS')node.open=true;
  }
  function revealHash(){
    let id;try{id=decodeURIComponent(location.hash.slice(1));}catch{return;}
    if(!id)return;
    const target=document.getElementById(id);
    if(target){reveal(target);requestAnimationFrame(()=>target.scrollIntoView());}
  }
  document.addEventListener('click',event=>{
    const link=event.target.closest('a[href^="#"]');
    if(!link)return;
    let id;try{id=decodeURIComponent(link.hash.slice(1));}catch{return;}
    reveal(document.getElementById(id));
  });
  addEventListener('hashchange',revealHash);
  revealHash();
  let printState;
  addEventListener('beforeprint',()=>{
    const details=[...main.querySelectorAll('details:not(.mobile-nav)')];
    printState=details.map(detail=>[detail,detail.open]);
    details.forEach(detail=>{detail.open=true;});
  });
  addEventListener('afterprint',()=>{printState?.forEach(([detail,open])=>{detail.open=open;});printState=undefined;});
})();
