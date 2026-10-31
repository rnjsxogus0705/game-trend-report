import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.png':'image/png','.woff2':'font/woff2'};
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
  const directHashOpen=!hasClosedParent(document.getElementById('tool-meshy'));
  document.getElementById('tool-meshy').closest('.reading-detail').open=false;
  const link=document.querySelector('.reading-tool-previews a[href="#tool-spritegen"]');
  link.click();
  const linkedToolOpen=!hasClosedParent(document.getElementById('tool-spritegen'));
  const buttons=document.querySelectorAll('.reading-controls button');
  buttons[0].click();const allOpen=groups.every(group=>group.open);
  buttons[1].click();const allClosed=groups.every(group=>!group.open);
  dispatchEvent(new Event('beforeprint'));const printOpen=[...document.querySelectorAll('details')].every(detail=>detail.open);
  dispatchEvent(new Event('afterprint'));const restored=groups.every(group=>!group.open);
  return {count:groups.length,directHashOpen,linkedToolOpen,allOpen,allClosed,printOpen,restored,
   previews:document.querySelectorAll('.reading-tool-previews img').length,
   benchmarkVisible:!hasClosedParent(document.getElementById('benchmark-chart')),
   simulationVisible:!hasClosedParent(document.getElementById('simulation-chart'))};
 });
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
  assert.ok(result.count>=10,'expected collapsed detail groups');
  assert.equal(result.previews,3,'expected three tool previews');
  for(const key of ['directHashOpen','linkedToolOpen','allOpen','allClosed','printOpen','restored','benchmarkVisible','simulationVisible'])assert.equal(result[key],true,key);
  console.log('Reading experience checks passed:',result);
}finally{await new Promise(resolve=>server.close(resolve));}
