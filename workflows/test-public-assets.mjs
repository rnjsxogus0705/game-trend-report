import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const files=['index.html','standards/index.html',...(await fs.readdir(path.join(root,'reports'))).filter(n=>n.endsWith('.html')).map(n=>'reports/'+n)];
let links=0;
for(const file of files){
 const html=await fs.readFile(path.join(root,file),'utf8');
 const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
 assert.equal(new Set(ids).size,ids.length,'중복 ID: '+file);
 for(const [,url] of html.matchAll(/(?:href|src)="([^"]+)"/g)){
  if(/^(https?:|data:|mailto:|javascript:)/.test(url))continue;
  if(url.startsWith('#')){assert.ok(ids.includes(decodeURIComponent(url.slice(1))),'앵커: '+file+' '+url);continue;}
  const local=path.resolve(path.dirname(path.join(root,file)),decodeURIComponent(url.split(/[?#]/)[0]));
  assert.ok(local.startsWith(root+path.sep)||local===root,'저장소 외부 경로: '+file+' '+url);
  await fs.access(local);links++;
 }
}
console.log(`${files.length}개 공개 HTML의 ID·내부 앵커·로컬 자산 ${links}개 검사 통과`);
