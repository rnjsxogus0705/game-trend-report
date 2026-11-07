import fs from 'node:fs/promises';
import {readFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {reportElements} from './validate-weekly-presentation.mjs';
const text=html=>html.replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();
const has=(node,name)=>(node.attrs.class||'').split(/\s+/).includes(name);
// Narrow reader-copy checks; quoted source text and runnable examples are not editorial copy.
export function productionCommentary(html){
 const {elements,source}=reportElements(html);
 const rules=[
  ['requested_material',/사용자(?:가|의)\s*(?:별도(?:로)?\s*)?지정한\s*(?:자료|영상|목록|콘텐츠|링크)/],
  ['internal_deduplication',/(?:추가\s*유행으로|독립\s*유행\s*근거로)\s*중복\s*집계|이전\s*(?:호\s*)?(?:공개\s*)?원장(?:과|을)\s*대조/],
  ['review_workflow',/(?:이번\s*리포트|이\s*리포트|본문)(?:는|를|에)?[^.!?]{0,60}(?:스킬|에이전트|하네스)(?:로|를|의|와|과)[^.!?]{0,40}(?:검수|제작)|각\s*도구의\s*README와\s*문서를\s*확인했/]
 ];
 return elements.filter(n=>/^(?:p|li|h[1-6]|figcaption|td|dd)$/.test(n.tag)).flatMap(n=>{
  for(let parent=n.parent;parent;parent=parent.parent)if(['pre','code','blockquote','script','style'].includes(parent.tag))return [];
  const copy=text(source.slice(n.start,n.end));
  return rules.filter(([,rule])=>rule.test(copy)).map(([rule])=>({rule,text:copy.slice(0,240)}));
 });
}
export function validateReaderCopy(html){
 const findings=productionCommentary(html);
 if(findings.length)throw Error('Remove internal production commentary from reader copy: '+findings.map(f=>f.rule+': '+f.text).join('; '));
}
const youtubeId=value=>{
 try{
  const url=new URL(value.replaceAll('&amp;','&')),host=url.hostname.toLowerCase();
  const id=host==='youtu.be'?url.pathname.split('/')[1]:/(^|\.)youtube(?:-nocookie)?\.com$/.test(host)?(url.searchParams.get('v')||url.pathname.match(/^\/(?:embed|shorts)\/([^/]+)/)?.[1]):null;
  return /^[\w-]{11}$/.test(id||'')?id:null;
 }catch{return null;}
};
const vimeoId=value=>{
 try{const url=new URL(value),match=url.hostname==='vimeo.com'?url.pathname.match(/^\/(\d+)\/?$/):url.hostname==='player.vimeo.com'?url.pathname.match(/^\/video\/(\d+)\/?$/):null;return match?'vimeo:'+match[1]:null;}catch{return null;}
};
export function sectionMetrics(html){
 const {elements,source}=reportElements(html);
 const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
 const scripts=elements.filter(n=>n.tag==='script'&&n.attrs.src).map(n=>{
  const src=n.attrs.src.split(/[?#]/)[0];if(!/^(?:weekly-\d{4}-\d{2}-\d{2}\.js|\.\.\/assets\/report\/rich-media\.js)$/.test(src))return '';
  try{return readFileSync(path.resolve(root,'reports',src),'utf8');}catch{return '';}
 });
 const handlers={slot:scripts.some(s=>s.includes('data-play-video')&&s.includes('.video-slot')&&s.includes('addEventListener')),preview:scripts.some(s=>s.includes('data-youtube-play')&&s.includes('.youtube-preview')&&s.includes('addEventListener'))};
 return elements.filter(n=>n.tag==='section'&&n.attrs.id).map(section=>{
  const body=source.slice(section.start,section.end),nodes=elements.filter(n=>n.start>=section.start&&n.end<=section.end);
  const links=[...new Set(nodes.filter(n=>n.tag==='a'&&/^https:\/\//.test(n.attrs.href||'')).map(n=>n.attrs.href))];
  const videoLinks=[...new Set(links.map(url=>youtubeId(url)||vimeoId(url)||(/\.(?:mp4|webm|m3u8)(?:[?#]|$)/i.test(url)?url:null)).filter(Boolean))];
  const videos=[];
  for(const node of nodes){
   if(node.tag==='button'){
    const slotId=node.attrs['data-play-video'],previewId=node.attrs['data-youtube-play'];
    const slot=node.parent&&nodes.some(n=>n.parent===node.parent&&has(n,'video-slot'));
    let preview=node.parent;while(preview&&!has(preview,'youtube-preview'))preview=preview.parent;
    if(handlers.slot&&slot&&/^[\w-]{11}$/.test(slotId||''))videos.push(slotId);
    if(handlers.preview&&preview&&/^[\w-]{11}$/.test(previewId||''))videos.push(previewId);
   }else if(node.tag==='iframe'){
    const url=node.attrs.src||node.attrs['data-src']||'';
    const id=youtubeId(url)||vimeoId(url);if(id)videos.push(id);
   }else if(node.tag==='video'){
    const source=nodes.find(n=>n.tag==='source'&&n.parent===node&&(n.attrs.src||n.attrs['data-src']));
    const src=node.attrs.src||node.attrs['data-src']||node.attrs['data-hls']||source?.attrs.src||source?.attrs['data-src'];
    if(src)videos.push(src);
   }
  }
  const paragraphs=nodes.filter(n=>n.tag==='p').map(n=>text(source.slice(n.start,n.end))).filter(s=>s.length>35);
  return {id:section.attrs.id,characters:text(body).length,links,images:nodes.filter(n=>n.tag==='img').map(n=>({src:n.attrs.src,alt:n.attrs.alt||''})),videos:[...new Set(videos)],videoLinks,repeatedParagraphs:paragraphs.filter((s,i)=>paragraphs.indexOf(s)!==i)};
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
 return current.map(s=>{const p=previous.get(s.id);return {...s,prior:p?{characters:p.characters,images:p.images.length,videos:p.videos.length,links:p.links.length}:null,flags:[...(p&&s.characters<p.characters*0.4?['depth_reduced']:[]),...(p&&p.images.length&&!s.images.length?['images_removed']:[]),...(p&&p.videos.length&&!s.videos.length?['videos_removed']:[]),...(s.id!=='sources'&&(s.videoLinks||[]).some(url=>!s.videos.includes(url))?['link_only_media']:[]),...(s.repeatedParagraphs.length?['repeated_paragraphs']:[])]};});
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{const [current,prior]=process.argv.slice(2);if(!current||!prior)throw Error('Usage: node workflows/audit-report-quality.mjs CURRENT.html PRIOR.html');
 const html=await fs.readFile(current,'utf8');
 console.log(JSON.stringify({current,prior,notice:'Metrics identify review candidates, not factual or editorial approval.',productionCommentary:productionCommentary(html),sections:compareQuality(sectionMetrics(html),sectionMetrics(await fs.readFile(prior,'utf8')))},null,2));
 }catch(e){console.error(e.message);process.exitCode=1;}
}
