(()=>{'use strict';
  const key='game-trend-report-theme', choices=['system','light','dark'];
  const labels={system:'시스템',light:'라이트',dark:'다크'};
  const icons={system:'<rect x="3" y="4" width="18" height="13" rx="2"></rect><path d="M8 21h8m-4-4v4"></path>',light:'<circle cx="12" cy="12" r="4"></circle><path d="M12 2v2m0 16v2M2 12h2m16 0h2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42m0-14.14-1.42 1.42M6.35 17.65l-1.42 1.42"></path>',dark:'<path d="M20.9 13.4A9 9 0 0 1 10.6 3.1 9 9 0 1 0 20.9 13.4Z"></path>'};
  let mode='system';
  try{const saved=localStorage.getItem(key);if(choices.includes(saved))mode=saved;}catch{}
  const media=matchMedia('(prefers-color-scheme: dark)');
  let button;
  function apply(){
    document.documentElement.dataset.theme=mode==='system'?(media.matches?'dark':'light'):mode;
    if(button){button.querySelector('span').textContent=labels[mode];button.querySelector('svg').innerHTML=icons[mode];button.setAttribute('aria-label',`화면 테마: ${labels[mode]}. 누르면 다음 테마로 변경`);button.title=`화면 테마: ${labels[mode]}`;}
  }
  apply();
  function mount(){
    const header=document.querySelector('.weekly-editorial .header-inner');
    if(!header||header.querySelector('[data-theme-cycle]'))return;
    button=document.createElement('button');button.type='button';button.className='report-theme-toggle';button.dataset.themeCycle='';
    button.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4"></circle><path d="M12 2v2m0 16v2M2 12h2m16 0h2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42m0-14.14-1.42 1.42M6.35 17.65l-1.42 1.42"></path></svg><span></span>';
    button.addEventListener('click',()=>{mode=choices[(choices.indexOf(mode)+1)%choices.length];try{localStorage.setItem(key,mode);}catch{}apply();});
    header.insertBefore(button,document.getElementById('print-button'));
    const search=document.querySelector('[data-report-search-toggle]');
    search?.insertAdjacentHTML?.('afterbegin','<svg class="report-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"></circle><path d="m16 16 4 4"></path></svg>');
    apply();
  }
  addEventListener('beforeprint',()=>{document.documentElement.dataset.theme='light';});
  addEventListener('afterprint',apply);
  if(media.addEventListener)media.addEventListener('change',()=>{if(mode==='system')apply();});else media.addListener?.(()=>{if(mode==='system')apply();});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();
