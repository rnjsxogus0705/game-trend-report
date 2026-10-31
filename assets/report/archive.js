(()=>{
 'use strict';
 const form=document.getElementById('archive-filters');
 if(!form)return;
 const search=document.getElementById('report-search'),type=document.getElementById('report-type'),year=document.getElementById('report-year');
 const groups=[...document.querySelectorAll('.month-group')],rows=[...document.querySelectorAll('.issue-row')];
 const normalize=value=>value.toLocaleLowerCase('ko-KR').replace(/[.\/\s]+/g,'-');
 function apply(){
  const query=normalize(search.value.trim()),filtered=Boolean(query||type.value!=='all'||year.value!=='all');
  let count=0;
  for(const row of rows){
   row.hidden=!(normalize(row.textContent).includes(query)&&(type.value==='all'||row.dataset.type===type.value)&&(year.value==='all'||row.dataset.year===year.value));
   if(!row.hidden)count++;
  }
  for(const group of groups){
   const visible=[...group.querySelectorAll('.issue-row')].filter(row=>!row.hidden).length;
   group.hidden=!visible;
   group.open=filtered||group.dataset.defaultOpen==='true';
   group.querySelector('.month-count').textContent=visible+'개 리포트';
  }
  document.getElementById('archive-status').textContent=(filtered?'검색 결과':'최신순')+' · '+count+'개 리포트';
  document.getElementById('archive-empty').hidden=count!==0;
  document.querySelectorAll('[data-archive-type]').forEach(a=>{if(a.dataset.archiveType===type.value)a.setAttribute('aria-current','true');else a.removeAttribute('aria-current');});
 }
 form.hidden=false;
 form.addEventListener('submit',e=>{e.preventDefault();apply();});
 form.addEventListener('input',apply);
 form.addEventListener('change',apply);
 form.addEventListener('reset',()=>{queueMicrotask(apply);});
 const chooseType=value=>{search.value='';year.value='all';type.value=value;apply();};
 document.querySelectorAll('[data-archive-type]').forEach(a=>a.addEventListener('click',()=>chooseType(a.dataset.archiveType)));
 document.querySelectorAll('nav a[href="#weekly"],nav a[href="#monthly"]').forEach(a=>a.addEventListener('click',()=>chooseType(a.hash.slice(1))));
 if(location.hash==='#weekly'||location.hash==='#monthly')chooseType(location.hash.slice(1));else apply();
 let printState=[];
 addEventListener('beforeprint',()=>{printState=groups.map(group=>group.open);groups.forEach(group=>{if(!group.hidden)group.open=true;});});
 addEventListener('afterprint',()=>groups.forEach((group,i)=>{group.open=printState[i]??group.open;}));
})();
