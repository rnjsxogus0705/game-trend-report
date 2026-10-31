(()=>{
  'use strict';
  const main=document.querySelector('main.content');
  if(!main)return;
  const groups=[];
  function fold(nodes,label){
    if(!nodes.length)return;
    const details=document.createElement('details');
    details.className='reading-detail';
    const summary=document.createElement('summary');
    summary.textContent=label;
    details.append(summary);
    nodes[0].before(details);
    nodes.forEach(node=>details.append(node));
    details.addEventListener('toggle',()=>{if(details.open)window.dispatchEvent(new Event('resize'));});
    groups.push(details);
  }
  main.querySelectorAll(':scope > section.chapter').forEach(section=>{
    if(section.id==='game-ai-tools'){
      const skills=section.querySelector(':scope > #agent-skills');
      if(skills)fold([skills],'게임 개발 스킬 자세히 보기');
      const first=section.querySelector(':scope > .tool-research-card');
      const previews=['tool-spritegen','tool-meshy','tool-runway'].map(id=>section.querySelector('#'+id)).filter(Boolean);
      if(first && previews.length){
        const gallery=document.createElement('div');
        gallery.className='reading-tool-previews';
        previews.forEach(card=>{
          const link=document.createElement('a');link.href='#'+card.id;
          const picture=card.querySelector('img')?.cloneNode();
          if(picture){picture.alt='';link.append(picture);}
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
      return;
    }
    const head=section.querySelector(':scope > .chapter-head');
    if(!head)return;
    const nodes=[];
    for(let node=head.nextElementSibling;node;node=node.nextElementSibling)nodes.push(node);
    if(nodes.length>1 && nodes[0].textContent.trim().length<1500)nodes.shift();
    if(section.id==='techniques' || section.id==='lab')nodes.shift();
    const title=head.querySelector('h2')?.textContent.trim().replace(/\s+/g,' ')||'이 장';
    fold(nodes,title+' · 자세히 보기');
  });
  if(!groups.length)return;
  const controls=document.createElement('div');
  controls.className='reading-controls';
  controls.setAttribute('aria-label','리포트 상세 내용');
  for(const [label,open] of [['상세 내용 모두 펼치기',true],['상세 내용 모두 접기',false]]){
    const button=document.createElement('button');button.type='button';button.textContent=label;
    button.addEventListener('click',()=>groups.forEach(group=>{group.open=open;}));
    controls.append(button);
  }
  main.querySelector('#top10')?.after(controls);
  function reveal(target){
    for(let node=target?.parentElement;node;node=node.parentElement)if(node.tagName==='DETAILS')node.open=true;
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
    const details=[...document.querySelectorAll('details')];
    printState=details.map(detail=>[detail,detail.open]);
    details.forEach(detail=>{detail.open=true;});
  });
  addEventListener('afterprint',()=>{printState?.forEach(([detail,open])=>{detail.open=open;});printState=undefined;});
})();
