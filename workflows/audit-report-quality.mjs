import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {reportElements} from './validate-weekly-presentation.mjs';
const text=html=>html.replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();
export function sectionMetrics(html){
 const {elements,source}=reportElements(html);
 return elements.filter(n=>n.tag==='section'&&n.attrs.id).map(section=>{
  const body=source.slice(section.start,section.end),nodes=elements.filter(n=>n.start>=section.start&&n.end<=section.end);
  const links=[...new Set(nodes.filter(n=>n.tag==='a'&&/^https:\/\//.test(n.attrs.href||'')).map(n=>n.attrs.href))];
  const paragraphs=nodes.filter(n=>n.tag==='p').map(n=>text(source.slice(n.start,n.end))).filter(s=>s.length>35);
  return {id:section.attrs.id,characters:text(body).length,links,images:nodes.filter(n=>n.tag==='img').map(n=>({src:n.attrs.src,alt:n.attrs.alt||''})),videos:[...new Set([...body.matchAll(/(?:watch\?v=|youtu.be\/|data-play-video=["'])([\w-]{11})/g)].map(m=>m[1]))],repeatedParagraphs:paragraphs.filter((s,i)=>paragraphs.indexOf(s)!==i)};
 });
}
export function validateLayoutContract(html){
 const {elements}=reportElements(html);
 const has=(n,c)=>(n.attrs.class||'').split(/\s+/).includes(c);
 for(const item of elements.filter(n=>has(n,'top-ten-item'))){
  const children=elements.filter(n=>n.parent===item);
  if(children.length!==2||!has(children[0],'top-rank')||children[1].tag!=='div')throw Error('TOP 10 markup does not match the two-column editorial CSS');
 }
 if(!elements.some(n=>n.tag==='main'&&has(n,'content')))throw Error('Reading controls require main.content');
 const summary=elements.find(n=>n.attrs.id==='issue-summary');
 if(!summary||!elements.some(n=>n.parent===summary&&has(n,'issue-summary-layout')))throw Error('Summary markup does not match editorial CSS');
 for(const chapter of elements.filter(n=>n.tag==='section'&&has(n,'chapter'))){
  if(!elements.some(n=>n.parent===chapter&&has(n,'chapter-head')))throw Error('Missing chapter-head for reading controls: '+chapter.attrs.id);
 }
}
export function compareQuality(current,prior){
 const previous=new Map(prior.map(s=>[s.id,s]));
 return current.map(s=>{const p=previous.get(s.id);return {...s,prior:p?{characters:p.characters,images:p.images.length,videos:p.videos.length,links:p.links.length}:null,flags:[...(p&&s.characters<p.characters*0.4?['depth_reduced']:[]),...(p&&p.images.length&&!s.images.length?['images_removed']:[]),...(p&&p.videos.length&&!s.videos.length?['videos_removed']:[]),...(s.repeatedParagraphs.length?['repeated_paragraphs']:[])]};});
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{const [current,prior]=process.argv.slice(2);if(!current||!prior)throw Error('Usage: node workflows/audit-report-quality.mjs CURRENT.html PRIOR.html');
 console.log(JSON.stringify({current,prior,notice:'Metrics identify review candidates, not factual or editorial approval.',sections:compareQuality(sectionMetrics(await fs.readFile(current,'utf8')),sectionMetrics(await fs.readFile(prior,'utf8')))},null,2));
 }catch(e){console.error(e.message);process.exitCode=1;}
}
