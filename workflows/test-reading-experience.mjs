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
 const result=await page.evaluate(async()=>{
  const groups=[...document.querySelectorAll('.reading-detail')];
  const hasClosedParent=el=>{for(let node=el?.parentElement;node;node=node.parentElement)if(node.tagName==='DETAILS'&&!node.open)return true;return false;};
  const detailLabel=document.querySelector('#github-trending .reading-detail>summary')?.textContent;
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
  return {visuals,media,visualsLabeled,detailLabel,summaryPresent,highlights,count:groups.length,directHashOpen,linkedToolOpen,allOpen,allClosed,printOpen,restored,
   previews:document.querySelectorAll('.reading-tool-previews img').length,
   benchmarkVisible:!hasClosedParent(document.getElementById('benchmark-chart')),
   simulationVisible:!hasClosedParent(document.getElementById('simulation-chart'))};
 });
 result.layouts=[];
 for(const width of [320,390,768,1440]){
  await page.cdp('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:width<768});
  result.layouts.push(await page.evaluate(async()=>{
   const topImages=[...document.querySelectorAll('.top-visual')].slice(0,2);
   await Promise.all(topImages.map(async image=>{image.loading='eager';await image.decode();}));
   const imageSizes=topImages.map(image=>{const r=image.getBoundingClientRect();return {width:r.width,height:r.height,naturalRatio:image.naturalHeight/image.naturalWidth};});
   const previewRatios=[...document.querySelectorAll('.reading-media-previews figure>a img')].map(image=>{const r=image.getBoundingClientRect();return r.height/r.width;});
   return {width:innerWidth,overflow:document.documentElement.scrollWidth>innerWidth,paragraph:parseFloat(getComputedStyle(document.querySelector('.chapter-head p')).fontSize),chapterBorder:parseFloat(getComputedStyle(document.querySelector('#ai-trends')).borderTopWidth),imageSizes,previewRatios};
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
  assert.match(result.detailLabel,/저장소를 내 프로젝트/);
  assert.equal(result.visuals,13);assert.equal(result.media,8);assert.equal(result.visualsLabeled,true);
  assert.equal(result.summaryPresent,true);
  assert.ok(result.highlights>=3);
  for(const layout of result.layouts){assert.equal(layout.overflow,false,'overflow at '+layout.width);assert.ok(layout.paragraph>=17);assert.equal(layout.chapterBorder,2);for(const image of layout.imageSizes){assert.ok(Math.abs(image.height/image.width-image.naturalRatio)<.02,'TOP image letterboxing at '+layout.width);}for(const ratio of layout.previewRatios)assert.ok(Math.abs(ratio-9/16)<.02,'Preview stretched at '+layout.width);}
  assert.equal(result.share.open,true);assert.equal(result.share.closed,true);assert.ok(result.share.icons>=8);assert.equal(result.share.closeLabel,'공유 메뉴 닫기');
  assert.ok(result.count>=10,'expected collapsed detail groups');
  assert.equal(result.previews,3,'expected three tool previews');
  for(const key of ['directHashOpen','linkedToolOpen','allOpen','allClosed','printOpen','restored','benchmarkVisible','simulationVisible'])assert.equal(result[key],true,key);
  console.log('Reading experience checks passed:',result);
}finally{await new Promise(resolve=>server.close(resolve));}
