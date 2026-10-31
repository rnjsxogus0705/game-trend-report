/* Original educational simulator. Independent Bernoulli trials; not commercial game data. */
function simulateReward(chance, opportunities, runs = 1000) {
  if (!Number.isFinite(chance) || chance < 0 || chance > 1 || !Number.isInteger(opportunities) || opportunities < 1 || opportunities > 100 || !Number.isInteger(runs) || runs < 1) throw new Error('Invalid simulation parameters');
  let seed = 20261031;
  const random = () => {seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296;};
  const counts = Array(opportunities + 1).fill(0);
  for (let run = 0; run < runs; run++) {let successes = 0; for (let trial = 0; trial < opportunities; trial++) if (random() < chance) successes++; counts[successes]++;}
  return {counts, mean: counts.reduce((sum,n,i)=>sum+n*i,0)/runs, zero:counts[0]/runs, threeOrMore:counts.slice(3).reduce((a,b)=>a+b,0)/runs, runs, chance, opportunities};
}
globalThis.ReportSimulation = simulateReward;

if (typeof document !== 'undefined') {
  const $ = id => document.getElementById(id);
  $('print-button').addEventListener('click', () => window.print());
  const navLinks = [...document.querySelectorAll('#side-nav a')];
  $('mobile-links').innerHTML = navLinks.map(a=>`<a href="${a.getAttribute('href')}">${a.textContent.trim().replace(/^(\d{2})/,'$1 · ')}</a>`).join('');
  document.querySelectorAll('#mobile-links a').forEach(a=>a.addEventListener('click',()=>document.querySelector('.mobile-nav').open=false));
  let scrollQueued = false;
  const updateReading = () => {
    const distance = document.documentElement.scrollHeight - innerHeight;
    const percent = distance > 0 ? Math.min(100,Math.round(scrollY/distance*100)) : 100;
    $('read-percent').textContent = percent+'%'; $('read-bar').style.width=percent+'%';
    let active = navLinks[0];
    for(const a of navLinks){const section=document.querySelector(a.getAttribute('href'));if(section && section.getClientRects().length && section.getBoundingClientRect().top<180)active=a;}
    navLinks.forEach(a=>{a.classList.toggle('active',a===active);if(a===active)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current');});
    scrollQueued=false;
  };
  addEventListener('scroll',()=>{if(!scrollQueued){scrollQueued=true;requestAnimationFrame(updateReading);}},{passive:true});
  addEventListener('resize',updateReading);updateReading();
  const tabs=[...document.querySelectorAll('[role=tab]')];
  const selectTab=tab=>{tabs.forEach(t=>{const selected=t===tab;t.setAttribute('aria-selected',String(selected));t.tabIndex=selected?0:-1;$(t.getAttribute('aria-controls')).hidden=!selected;});};
  tabs.forEach((tab,i)=>{tab.addEventListener('click',()=>selectTab(tab));tab.addEventListener('keydown',event=>{let next;if(event.key==='ArrowRight')next=(i+1)%tabs.length;else if(event.key==='ArrowLeft')next=(i+tabs.length-1)%tabs.length;else if(event.key==='Home')next=0;else if(event.key==='End')next=tabs.length-1;if(next!==undefined){event.preventDefault();selectTab(tabs[next]);tabs[next].focus();}});});
  const checks=[...document.querySelectorAll('[data-check]')];
  const storageKey='gtr-preview-v2-checklist';let saved={};try{saved=JSON.parse(localStorage.getItem(storageKey)||'{}');}catch{}
  const countChecks=()=>{$('check-progress').textContent=checks.filter(c=>c.checked).length+' / '+checks.length+'개 완료';};
  checks.forEach(c=>{c.checked=saved[c.dataset.check]===true;c.addEventListener('change',()=>{saved[c.dataset.check]=c.checked;try{localStorage.setItem(storageKey,JSON.stringify(saved));}catch{}countChecks();});});countChecks();
  let simulationChart;
  const refreshSimulation=()=>{
    const chance=Number($('chance').value),opportunities=Number($('trials').value),result=simulateReward(chance/100,opportunities);
    $('chance-output').value=chance+'%';$('trials-output').value=opportunities+'회';
    $('sim-mean').textContent=result.mean.toFixed(2)+'회';$('sim-zero').textContent=(result.zero*100).toFixed(1)+'%';$('sim-three').textContent=(result.threeOrMore*100).toFixed(1)+'%';
    $('simulation-table').replaceChildren(...result.counts.map((n,i)=>{const tr=document.createElement('tr');for(const text of [i+'회',n.toLocaleString('ko-KR'),(n/result.runs*100).toFixed(1)+'%']){const td=document.createElement('td');td.textContent=text;tr.append(td);}return tr;}));
    $('simulation-chart').setAttribute('aria-label',`가상 실행 ${result.runs}회. 발동 확률 ${chance}%, 한 판 ${opportunities}번 기회. 평균 ${result.mean.toFixed(2)}회, 0회 발동 ${(result.zero*100).toFixed(1)}%. 아래 수치표에서 전체 분포를 확인할 수 있어요.`);
    if(simulationChart){simulationChart.data.labels=result.counts.map((_,i)=>String(i));simulationChart.data.datasets[0].data=result.counts;simulationChart.data.datasets[0].backgroundColor=result.counts.map((_,i)=>i>=3?'#3182F6':'#D1D6DB');simulationChart.update();}
    window.lastSimulationResult=result;
  };
  $('chance').addEventListener('input',refreshSimulation);$('trials').addEventListener('input',refreshSimulation);refreshSimulation();
  (async()=>{
    await document.fonts.ready;
    if(typeof Chart==='undefined'){document.querySelectorAll('.chart-data').forEach(d=>d.open=true);return;}
    const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
    Chart.defaults.font.family='Pretendard, sans-serif';Chart.defaults.font.size=13;Chart.defaults.color='#6B7684';Chart.defaults.animation.duration=reduced?0:200;
    const valuesPlugin={id:'directValues',afterDatasetsDraw(chart){const ctx=chart.ctx;ctx.save();ctx.font='600 14px Pretendard, sans-serif';ctx.fillStyle='#333D4B';ctx.textBaseline='middle';chart.getDatasetMeta(0).data.forEach((bar,i)=>ctx.fillText(chart.data.datasets[0].data[i]+'%',bar.x+10,bar.y));ctx.restore();}};
    new Chart($('benchmark-chart'),{type:'bar',data:{labels:['쉬운 과제','전체','어려운 과제'],datasets:[{data:[80.9,57.7,35.2],backgroundColor:['#D1D6DB','#D1D6DB','#3182F6'],borderRadius:6,borderSkipped:false,barThickness:26}]},options:{indexAxis:'y',responsive:true,maintainAspectRatio:false,layout:{padding:{right:44}},plugins:{legend:{display:false},tooltip:{callbacks:{label:ctx=>'보고 평균 통과율 '+ctx.raw+'%'}}},scales:{x:{display:false,min:0,max:105},y:{border:{display:false},grid:{display:false},ticks:{color:'#4E5968',font:{size:14},padding:8}}}},plugins:[valuesPlugin]});
    simulationChart=new Chart($('simulation-chart'),{type:'bar',data:{labels:[],datasets:[{data:[],backgroundColor:[],borderRadius:{topLeft:5,topRight:5},borderSkipped:false,maxBarThickness:30}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{callbacks:{title:items=>items[0].label+'회 발동',label:ctx=>ctx.raw+'개 가상 실행 ('+(ctx.raw/10).toFixed(1)+'%)'}}},scales:{x:{border:{display:false},grid:{display:false},ticks:{maxTicksLimit:8,font:{size:11}},title:{display:true,text:'한 판의 발동 횟수',font:{size:11}}},y:{display:false,beginAtZero:true}}}});
    refreshSimulation();window.reportChartsReady=true;
  })();
}
