import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.png':'image/png','.svg':'image/svg+xml','.woff2':'font/woff2'};
const server=createServer(async(req,res)=>{
  const file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));
  if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
  try{res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');res.end(await readFile(file));}
  catch{res.writeHead(404).end();}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const url=`http://127.0.0.1:${server.address().port}/reports/weekly-2026-10-31.html`;
const script=`
const task=await taskSpace(${JSON.stringify('reading-regression-'+Date.now())});
try {
 const page=task.page('p1');
 await page.goto(${JSON.stringify(url+'#tool-meshy')});
 await page.waitForFunction(()=>document.querySelectorAll('.international-resource').length===3);
 const result=await page.evaluate(async()=>{
  const groups=[...document.querySelectorAll('.reading-detail')];
  const hasClosedParent=el=>{for(let node=el?.parentElement;node;node=node.parentElement)if(node.tagName==='DETAILS'&&!node.open)return true;return false;};
  const detailLabel=document.querySelector('#github-trending .reading-detail>summary')?.textContent;
  const skillEvidence={cards:document.querySelectorAll('[data-agent-skill]').length,blocks:document.querySelectorAll('.skill-selection').length,marked:document.querySelectorAll('.skill-selection mark').length,originalDetails:document.querySelectorAll('.skill-background').length,rows:document.querySelectorAll('.skill-selection-map tbody tr').length,toolChartOutsideSkills:!document.getElementById('agent-skills').contains(document.querySelector('.tool-visual'))};
  const ideaImages=document.querySelectorAll('.idea-concept img').length;
  const international=document.querySelectorAll('.international-resource').length,readerGuide=!!document.querySelector('.reader-guide .learning-case img');
  const summaryPresent=!!document.querySelector('#issue-summary');
  const highlights=document.querySelectorAll('mark').length;
  const visuals=document.querySelectorAll('.chapter-visual').length,media=document.querySelectorAll('.reading-media-previews figure').length;
  const visualsLabeled=[...document.querySelectorAll('.chapter-visual')].every(f=>f.querySelector('img').alt.includes('AI 생성 개념도')&&f.querySelector('figcaption').textContent.includes('실제 제품'));
  const directHashOpen=!hasClosedParent(document.getElementById('tool-meshy'));
  document.getElementById('tool-meshy').closest('.reading-detail').open=false;
  const link=document.querySelector('.reading-tool-previews a[href="#tool-spritegen"]');
  link.click();
  const linkedToolOpen=!hasClosedParent(document.getElementById('tool-spritegen'));
  const buttons=document.querySelectorAll('.reading-controls button');
  buttons[0].click();const allOpen=groups.every(group=>group.open);
  buttons[1].click();const allClosed=groups.every(group=>!group.open);
  dispatchEvent(new Event('beforeprint'));const printOpen=[...document.querySelectorAll('main details:not(.mobile-nav)')].every(detail=>detail.open);
  dispatchEvent(new Event('afterprint'));const restored=groups.every(group=>!group.open);
  return {labDataVisible:!hasClosedParent(document.querySelector('#lab .grid2 .table-scroll')),skillEvidence,ideaImages,international,readerGuide,visuals,media,visualsLabeled,detailLabel,summaryPresent,highlights,count:groups.length,directHashOpen,linkedToolOpen,allOpen,allClosed,printOpen,restored,
   previews:document.querySelectorAll('.reading-tool-previews img').length,
   benchmarkVisible:!hasClosedParent(document.getElementById('benchmark-chart')),
   simulationVisible:!hasClosedParent(document.getElementById('simulation-chart'))};
 });
 result.practice=await page.evaluate(async()=>{
  const original=navigator.clipboard.writeText,copied=[];
  try{
   navigator.clipboard.writeText=async text=>{copied.push(text);};
   const buttons=[...document.querySelectorAll('.practice-prompt [data-copy-workflow]')];
   for(const button of buttons){button.click();await Promise.resolve();}
   const exact=buttons.every((button,i)=>copied[i]===document.getElementById(button.dataset.copyWorkflow).textContent);
   navigator.clipboard.writeText=async()=>{throw Error('test denied');};buttons[0].click();await Promise.resolve();
   const fallback=buttons[0].parentElement.querySelector('[role=status]').textContent.includes('직접 선택해 복사');
   return {count:buttons.length,exact,fallback,toolPromptVisible:!document.getElementById('practice-game-ai-tools-1').closest('.reading-detail')};
  }finally{navigator.clipboard.writeText=original;}
 });
 result.toolFilters=await page.evaluate(()=>{
  const select=document.getElementById('tool-goal'),values=[...select.options].map(o=>o.value),results=[];
  for(const value of values){document.querySelector('.tool-filter-buttons button[data-goal="'+value+'"]').click();const visible=selector=>[...document.querySelectorAll(selector)].filter(n=>!n.hidden).length;results.push({value,expected:[...document.querySelectorAll('.tool-research-card')].filter(c=>value==='all'||c.dataset.toolGoals.split(' ').includes(value)).length,cards:visible('.tool-result'),rows:visible('.tool-comparison tr[data-compare-goals]'),matrix:visible('.tool-matrix tbody tr'),pressed:document.querySelector('.tool-filter-buttons [aria-pressed=true]')?.dataset.goal});}
  document.querySelector('.tool-filter-buttons button[data-goal=all]').click();return {results,images:document.querySelectorAll('.tool-result img').length,steps:document.querySelectorAll('.production-route-flow li').length,routeImage:!!document.querySelector('.route-visual img')};
 });
 result.layouts=[];
 for(const width of [320,390,768,1440]){
  await page.cdp('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:width<768});
  result.layouts.push(await page.evaluate(async()=>{
   const topImages=[...document.querySelectorAll('.top-visual')].slice(0,2);
   await Promise.all(topImages.map(async image=>{image.loading='eager';await image.decode();}));
   const labTable=document.querySelector('#lab .grid2 .table-scroll');for(let n=labTable;n;n=n.parentElement)if(n.tagName==='DETAILS')n.open=true;
   const compactTableFits=labTable.scrollWidth<=labTable.clientWidth+1;
   const recordTable=[...document.querySelectorAll('table')].find(table=>table.querySelector('th:nth-child(2)')?.textContent==='기록할 내용');
   for(let n=recordTable;n;n=n.parentElement)if(n.tagName==='DETAILS')n.open=true;
   const cells=recordTable.querySelectorAll('th'),recordColumnShare=cells[1].getBoundingClientRect().width/recordTable.getBoundingClientRect().width;

   const textSizes=[...document.querySelectorAll('body *')].filter(e=>!['SCRIPT','STYLE'].includes(e.tagName)&&[...e.childNodes].some(n=>n.nodeType===3&&n.textContent.trim())).map(e=>parseFloat(getComputedStyle(e).fontSize)).filter(Number.isFinite);
   const minTextSize=Math.min(...textSizes);
   const imageSizes=topImages.map(image=>{const r=image.getBoundingClientRect();return {width:r.width,height:r.height,naturalRatio:image.naturalHeight/image.naturalWidth};});
   const previewRatios=[...document.querySelectorAll('.reading-media-previews figure>a img')].map(image=>{const r=image.getBoundingClientRect();return r.height/r.width;});
   return {recordColumnShare,compactTableFits,minTextSize,width:innerWidth,overflow:document.documentElement.scrollWidth>innerWidth,paragraph:parseFloat(getComputedStyle(document.querySelector('.chapter-head p')).fontSize),chapterBorder:parseFloat(getComputedStyle(document.querySelector('#ai-trends')).borderTopWidth),imageSizes,previewRatios};
  }));
 }
 await page.click('#report-share');
 result.share=await page.evaluate(()=>({open:document.querySelector('.share-dialog').open,icons:document.querySelectorAll('.share-dialog .action-icon').length,closeLabel:document.querySelector('.share-close').getAttribute('aria-label')}));
 await page.press('.share-close','Escape');
 result.share.closed=await page.evaluate(()=>!document.querySelector('.share-dialog').open);
 console.log('RESULT '+JSON.stringify(result));
} finally {await task.finish({keep:[]});}
`;
try{
  const output=await new Promise((resolve,reject)=>{
    const child=spawn('ego-browser',['nodejs'],{shell:process.platform==='win32',stdio:['pipe','pipe','pipe']});
    let stdout='',stderr='';child.stdout.on('data',chunk=>stdout+=chunk);child.stderr.on('data',chunk=>stderr+=chunk);
    child.on('error',reject);child.on('close',code=>code===0?resolve(stdout+'\n'+stderr):reject(new Error(stderr||stdout)));
    child.stdin.end(script);
  });
  const line=output.split('\n').find(line=>line.startsWith('RESULT '));
  assert.ok(line,JSON.stringify(output));
  const result=JSON.parse(line.slice(7));
  assert.match(result.detailLabel,/인기 GitHub 저장소 중 게임 개발에 참고할 자료/);
  assert.equal(result.visuals,14);assert.equal(result.media,8);assert.equal(result.visualsLabeled,true);
  assert.equal(result.toolFilters.images,15);assert.equal(result.toolFilters.steps,5);assert.equal(result.toolFilters.routeImage,true);for(const f of result.toolFilters.results){assert.equal(f.cards,f.expected);assert.equal(f.rows,f.expected);assert.equal(f.matrix,f.expected);assert.equal(f.pressed,f.value);}
  for(const key of ['cards','blocks','marked','originalDetails','rows'])assert.equal(result.skillEvidence[key],9,key);assert.equal(result.skillEvidence.toolChartOutsideSkills,true);
  assert.equal(result.ideaImages,6);assert.equal(result.labDataVisible,true);assert.equal(result.international,3);assert.equal(result.readerGuide,true);
  assert.equal(result.summaryPresent,true);assert.deepEqual(result.practice,{count:9,exact:true,fallback:true,toolPromptVisible:true});
  assert.ok(result.highlights>=3);
  for(const layout of result.layouts){assert.ok(layout.recordColumnShare>=.6,'Explanation column too narrow at '+layout.width);assert.equal(layout.compactTableFits,true,'Unnecessary short-table scrolling at '+layout.width);assert.ok(layout.minTextSize>=11,'Text below 11px at '+layout.width);assert.equal(layout.overflow,false,'overflow at '+layout.width);assert.ok(layout.paragraph>=17);assert.equal(layout.chapterBorder,2);for(const image of layout.imageSizes){assert.ok(Math.abs(image.height/image.width-image.naturalRatio)<.02,'TOP image letterboxing at '+layout.width);}for(const ratio of layout.previewRatios)assert.ok(Math.abs(ratio-9/16)<.02,'Preview stretched at '+layout.width);}
  assert.equal(result.share.open,true);assert.equal(result.share.closed,true);assert.ok(result.share.icons>=8);assert.equal(result.share.closeLabel,'공유 메뉴 닫기');
  assert.ok(result.count>=10,'expected collapsed detail groups');
  assert.equal(result.previews,3,'expected three tool previews');
  for(const key of ['directHashOpen','linkedToolOpen','allOpen','allClosed','printOpen','restored','benchmarkVisible','simulationVisible'])assert.equal(result[key],true,key);
  console.log('Reading experience checks passed:',result);
}finally{await new Promise(resolve=>server.close(resolve));}
