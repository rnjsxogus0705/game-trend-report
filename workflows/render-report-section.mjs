import fs from 'node:fs/promises';
import {constants as fsConstants} from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {sectionParts,presentationFiles,digest} from './assemble-report-sections.mjs';
import {reportElements,validateSectionPractices,careerCategories} from './validate-weekly-presentation.mjs';
const esc=s=>String(s??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const url=s=>{try{const u=new URL(s);return u.protocol==='https:'?u.href:'';}catch{return '';}};
const sourceText=(html,n,offset)=>html.slice(offset(n.start),offset(n.end)).replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();
function imageDimensions(bytes,kind){
 if(kind==='png'){
  if(bytes.length<24||!bytes.subarray(0,8).equals(Buffer.from('89504e470d0a1a0a','hex'))||bytes.toString('ascii',12,16)!=='IHDR')throw Error('Invalid PNG');
  return [bytes.readUInt32BE(16),bytes.readUInt32BE(20)];
 }
 if(bytes.length<30||bytes.toString('ascii',0,4)!=='RIFF'||bytes.toString('ascii',8,12)!=='WEBP'||bytes.readUInt32LE(4)+8!==bytes.length)throw Error('Invalid WebP');
 const kindName=bytes.toString('ascii',12,16),size=bytes.readUInt32LE(16);if(size+20>bytes.length)throw Error('Invalid WebP chunk');
 if(kindName==='VP8 '){if(size<10||!bytes.subarray(23,26).equals(Buffer.from('9d012a','hex')))throw Error('Invalid VP8 frame');return [bytes.readUInt16LE(26)&0x3fff,bytes.readUInt16LE(28)&0x3fff];}
 if(kindName==='VP8L'){if(size<5||bytes[20]!==0x2f)throw Error('Invalid VP8L frame');const bits=bytes.readUInt32LE(21);return [(bits&0x3fff)+1,((bits>>>14)&0x3fff)+1];}
 if(kindName==='VP8X'){if(size<10)throw Error('Invalid VP8X frame');return [bytes.readUIntLE(24,3)+1,bytes.readUIntLE(27,3)+1];}
 throw Error('Unsupported WebP frame');
}
export async function materializeAssets(root,candidate){
 const items=candidate.assetDerivations||[];if(!Array.isArray(items))throw Error('Invalid asset derivations');
 root=await fs.realpath(root);
 async function checked(relative,prefix,extension,exists=true){
  if(typeof relative!=='string'||!relative.startsWith(prefix+'/')||!relative.endsWith(extension)||relative.includes('\\')||relative.split('/').some(x=>!x||x==='.'||x==='..'))throw Error('Unsafe asset path');
  const parts=relative.split('/');let current=root;
  for(let i=0;i<parts.length;i++){
   current=path.join(current,parts[i]);
   try{const stat=await fs.lstat(current);if(stat.isSymbolicLink())throw Error('Symlink asset path rejected');if(i<parts.length-1&&!stat.isDirectory())throw Error('Invalid asset parent');if(i===parts.length-1&&!stat.isFile())throw Error('Asset is not a file');}
   catch(error){if(error.code==='ENOENT'&&!exists&&i===parts.length-1)return current;throw error;}
  }
  if(!(await fs.realpath(current)).startsWith(root+path.sep))throw Error('Asset escapes repository');return current;
 }
 const planned=[];
 for(const item of items){
  const source=await checked(item.sourcePath,'assets/report','.png'),draft=await checked(item.draftPath,'_workspace','.webp'),output=await checked(item.outputPath,'assets/report','.webp',false);
  if(typeof item.qualityReviewer!=='string'||!item.qualityReviewer.trim())throw Error('Asset quality reviewer missing');
  const quality=await checked(item.qualityEvidencePath,'_workspace','.json');
  const qualityBytes=await fs.readFile(quality);
  if(!/^[a-f0-9]{64}$/.test(item.qualityEvidenceSha256||'')||crypto.createHash('sha256').update(qualityBytes).digest('hex')!==item.qualityEvidenceSha256)throw Error('Asset quality evidence mismatch');
  const proof=JSON.parse(qualityBytes),id=path.posix.basename(item.sourcePath,'.png');
  const reviews=Array.isArray(proof.items)?proof.items.filter(entry=>entry.id===id):[];
  if(proof.reviewer!==item.qualityReviewer||proof.verdict!=='pass'||reviews.length!==1||reviews[0].verdict!=='pass'||reviews[0].sourceSha256!==item.sourceSha256||reviews[0].outputSha256!==item.outputSha256||reviews[0].width!==item.width||reviews[0].height!==item.height)throw Error('Asset quality review is incomplete or mismatched');
  const original=await fs.readFile(source),converted=await fs.readFile(draft);
  const match=(data,sha,size)=>Number.isSafeInteger(size)&&size===data.length&&/^[a-f0-9]{64}$/.test(sha||'')&&crypto.createHash('sha256').update(data).digest('hex')===sha;
  if(!match(original,item.sourceSha256,item.sourceBytes)||!match(converted,item.outputSha256,item.outputBytes))throw Error('Asset hash or byte count mismatch');
  if(!Number.isSafeInteger(item.width)||!Number.isSafeInteger(item.height)||item.width<1||item.height<1||[imageDimensions(original,'png'),imageDimensions(converted,'webp')].some(([w,h])=>w!==item.width||h!==item.height))throw Error('Asset dimensions mismatch');
  try{const current=await fs.readFile(output);if(!match(current,item.outputSha256,item.outputBytes))throw Error('Existing output differs');}catch(e){if(e.code!=='ENOENT')throw e;}
  planned.push({draft,output,item});
 }
 for(const {draft,output,item} of planned){
  try{await fs.copyFile(draft,output,fsConstants.COPYFILE_EXCL);}catch(e){if(e.code!=='EEXIST')throw e;const target=await checked(item.outputPath,'assets/report','.webp');if(crypto.createHash('sha256').update(await fs.readFile(target)).digest('hex')!==item.outputSha256)throw Error('Existing output differs');}
 }
 return planned.length;
}
export async function preparePreview(root,output,issueDate){
 root=await fs.realpath(root);const workspace=await fs.realpath(path.join(root,'_workspace')),target=path.resolve(output),reports=path.dirname(target);
 if(path.basename(target)!==`weekly-${issueDate}.html`||path.basename(reports)!=='reports')throw Error('Parallel preview requires reports/weekly-DATE.html');
 const relative=path.relative(workspace,reports),parts=relative.split(path.sep);
 if(!relative||relative.startsWith('..'+path.sep)||relative==='..'||path.isAbsolute(relative)||parts.length<2)throw Error('Parallel preview must use an isolated workspace');
 let current=workspace;
 for(const part of parts){current=path.join(current,part);try{await fs.mkdir(current);}catch(error){if(error.code!=='EEXIST')throw error;}const stat=await fs.lstat(current);if(stat.isSymbolicLink()||!stat.isDirectory())throw Error('Unsafe preview directory');}
 const reportsReal=await fs.realpath(reports),site=path.dirname(reportsReal);
 if(reportsReal!==reports||!site.startsWith(workspace+path.sep))throw Error('Parallel preview must use an isolated workspace');
 async function mirror(src,dst,type){
  const real=await fs.realpath(src);if(!real.startsWith(root+path.sep))throw Error('Preview target escapes repository');
  try{await fs.symlink(real,dst,type);}catch(error){if(error.code!=='EEXIST')throw error;const stat=await fs.lstat(dst);if(!stat.isSymbolicLink()||await fs.realpath(dst)!==real)throw Error('Existing preview mirror differs');}
 }
 await mirror(path.join(root,'assets'),path.join(site,'assets'),'dir');
 const reportDir=path.join(root,'reports');
 for(const name of await fs.readdir(reportDir)){
  if(name===`weekly-${issueDate}.js`||new RegExp(`^weekly-${issueDate}(?:-[A-Za-z0-9_-]+)?\\.md$`).test(name))await mirror(path.join(reportDir,name),path.join(reports,name),'file');
 }
 try{await fs.access(path.join(root,'index.html'));await mirror(path.join(root,'index.html'),path.join(site,'index.html'),'file');}catch(e){if(e.code!=='ENOENT')throw e;}
 return {site,reports};
}
export function renderSection(html,section,packet,{refreshLayout=false}={}){
 const {candidate,reviewApproval}=packet;
 const hash=crypto.createHash('sha256').update(JSON.stringify(candidate)).digest('hex');
 if(packet.sectionId!==section||!candidate||reviewApproval?.source!=='passed'||reviewApproval?.korean!=='passed'||reviewApproval?.candidateSha256!==hash)throw Error('Packet approval missing or stale');
 const {elements}=reportElements(html),nodes=elements.filter(n=>n.attrs.id===section);
 if(nodes.length!==1||!['section','div'].includes(nodes[0].tag))throw Error('Section missing or ambiguous');
 const node=nodes[0];
 const removals=[];let removed=0;
 for(const m of html.matchAll(/(<(?:script|style)\b[^>]*>)[\s\S]*?(<\/(?:script|style)>)/gi)){
  const length=m[0].length-m[1].length-m[2].length;
  removals.push({at:m.index+m[1].length-removed,length});removed+=length;
 }
 const originalOffset=offset=>offset+removals.filter(r=>r.at<=offset).reduce((n,r)=>n+r.length,0);
 const start=originalOffset(node.start),end=originalOffset(node.end);
 let body=html.slice(start,end);
 const oldBlocks=elements.filter(n=>n.parent===node&&Object.hasOwn(n.attrs,'data-reviewed-packet'));
 if(oldBlocks.length>1)throw Error('Ambiguous reviewed packet blocks');
 if(oldBlocks[0]?.attrs['data-reviewed-packet']===hash&&!refreshLayout)throw Error('Section already has rendered packet');
 let removable=oldBlocks.slice();
 if(section==='reading'){
  removable.push(...elements.filter(n=>['article','post'].includes(n.attrs['data-kind'])&&(n.parent===node||(n.parent?.parent===node&&(n.parent.attrs.class||'').split(/\s+/).includes('chapter-head')))));
 }
 if(section==='reading'&&Array.isArray(candidate.media)){
  const videoIds=new Set(candidate.media.filter(m=>m.kind==='video'&&/^[\w-]{11}$/.test(m.videoId||'')&&url(m.sourceUrl)===`https://www.youtube.com/watch?v=${m.videoId}`).map(m=>m.videoId));
  for(const n of elements.filter(n=>n.parent===node&&n.tag==='div'&&n.attrs['data-kind']==='video')){
   const content=html.slice(originalOffset(n.start),originalOffset(n.end));
   if([...videoIds].some(id=>content.includes(`https://www.youtube.com/watch?v=${id}`)))removable.push(n);
  }
 }
 if(section==='careers')removable.push(...elements.filter(n=>n.parent===node&&Object.hasOwn(n.attrs,'data-career-category')));
 if(section==='opportunities'&&Array.isArray(candidate.table?.rows)){
  for(const n of elements.filter(n=>n.parent===node&&n.tag==='p'&&!Object.keys(n.attrs).some(k=>k==='id'||k.startsWith('data-')))){
   const content=html.slice(originalOffset(n.start),originalOffset(n.end));
   const links=[...content.matchAll(/href=["'](https:\/\/[^"']+)["']/g)].map(m=>m[1].replaceAll('&amp;','&'));
   const allLinks=[...content.matchAll(/href=["']([^"']+)["']/g)];
   if(links.length&&links.length===allLinks.length&&links.every(link=>candidate.table.rows.some(row=>url(row[4])===url(link)&&content.includes(row[2]))))removable.push(n);
  }
 }
 if(section==='ai-only-lab')removable.push(...elements.filter(n=>n.parent===node&&n.tag==='h3'&&sourceText(html,n,originalOffset)==='해외 조사 범위와 한계'));
 if(Array.isArray(candidate.paragraphs)&&candidate.paragraphs.some(p=>typeof p==='string'&&p.trim())){
  removable.push(...elements.filter(n=>n.tag==='p'&&((n.parent?.parent===node&&(n.parent.attrs.class||'').split(/\s+/).includes('chapter-head'))||(section==='ai-only-lab'&&n.parent===node)))
   .filter(n=>!Object.keys(n.attrs).some(k=>k==='id'||k.startsWith('data-')))
   .filter(n=>!elements.some(child=>{for(let x=child.parent;x;x=x.parent)if(x===n)return child.tag==='a';return false;})));
 }
 for(const n of removable.sort((a,b)=>b.start-a.start)){
  const from=originalOffset(n.start)-start,to=originalOffset(n.end)-start;
  body=body.slice(0,from)+body.slice(to);
 }
 if(['top10','ai-only-lab'].includes(section)&&!elements.some(n=>n.parent===node&&(n.attrs.class||'').split(/\s+/).includes('chapter-head'))){
  const headings=elements.filter(n=>n.parent===node&&n.tag==='h2');
  if(headings.length!==1)throw Error('Expected one direct section heading');
  const heading=headings[0],headingStart=originalOffset(heading.start)-start,headingEnd=originalOffset(heading.end)-start;
  body=body.slice(0,headingStart)+'<div class="chapter-head">'+body.slice(headingStart,headingEnd)+'</div>'+body.slice(headingEnd);
 }
 if(section==='github-trending'&&candidate.table){
  const table=candidate.table;
  if(typeof table.caption!=='string'||!table.caption.trim()||!Array.isArray(table.rows)||table.rows.some(r=>!Array.isArray(r)||r.length!==6||!url(r[5])))throw Error('Trending table requires six reviewed values and official URLs');
  const head=body.match(/<div class="chapter-head">[\s\S]*?<\/div>/)?.[0];
  const intro=head?.match(/<p(?:\s[^>]*)?>[\s\S]*?<\/p>/)?.[0];
  const trending=intro?.match(/<a\b[^>]*href="https:\/\/github\.com\/trending\?since=weekly"[^>]*>[\s\S]*?<\/a>/)?.[0];
  if(!head||!intro||!trending)throw Error('Trending introduction or official list link missing');
  body=body.replace(head,head.replace(intro,`<p>${trending} · ${esc(table.caption)}</p>`));
 }
 const filler='작은 장면에서 한 가지 변수를 바꿔 직접 확인하는 편집 제안이에요.';
 if(['game-ideas','ai-production'].includes(section)&&(body.includes(filler)||body.includes('data-reviewed-card'))){
  const cards=[...body.matchAll(/<article class="idea-card">[\s\S]*?<h3>([^<]+)<\/h3>[\s\S]*?<\/article>/g)];
  if(cards.length!==3||cards.some(c=>typeof candidate.cardTexts?.[c[1]]!=='string'||!candidate.cardTexts[c[1]].trim())||new Set(cards.map(c=>candidate.cardTexts[c[1]].trim())).size!==3)throw Error('Three distinct reviewed card texts required');
  for(const card of cards){const existing=card[0].match(/<p data-reviewed-card="true">[^<]*<\/p>/)?.[0]||`<p>${filler}</p>`;if(!card[0].includes(existing))throw Error('Card filler mismatch');body=body.replace(card[0],card[0].replace(existing,`<p data-reviewed-card="true">${esc(candidate.cardTexts[card[1]])}</p>`));}
 }
 if(section==='game-ai-tools'&&candidate.table){
  const rows=candidate.table.rows;
  if(!Array.isArray(rows)||rows.length!==10||new Set(rows.map(r=>r[0])).size!==10||rows.some(r=>!Array.isArray(r)||!r[0]||!r[1]||!r[2]))throw Error('Ten tool input/output rows required');
  const details=[...body.matchAll(/<details\b[^>]*data-tool-goal="[^"]+"[^>]*>[\s\S]*?<\/details>/g)];
  if(details.length!==10)throw Error('Ten tool cards required');
  const used=new Set();
  for(const d of details){
   const summary=d[0].match(/<summary>([^<]+)<\/summary>/)?.[1]||'';
   const matches=rows.filter(r=>summary===r[0]||summary.startsWith(r[0]+' ·'));
   if(matches.length!==1||used.has(matches[0][0]))throw Error('Tool card does not match reviewed row');
   const row=matches[0];used.add(row[0]);
   let replacement=d[0].replace(/<p data-reviewed-io="true">[\s\S]*?<\/p>/g,'')
    .replace(/<strong>선정 이유:<\/strong> [^<]*? 작업을 작게 실험할 수 있어요\.\s*/,'')
    .replace('엔진 버전과 제3자 자산 조건은 별도 확인하세요. 직접 빌드하지 않았어요. ','');
   replacement=replacement.replace('</details>',`<p data-reviewed-io="true"><strong>입력:</strong> ${esc(row[1])} · <strong>출력:</strong> ${esc(row[2])}</p></details>`);
   body=body.replace(d[0],replacement);
  }
 }
 const exemptLead=new Set(['brief','issue-summary','top10','game-ai-tools','agent-skills','github-trending']);
 const lead=!exemptLead.has(section)?(typeof candidate.lead==='string'&&candidate.lead.trim()?candidate.lead.trim():(candidate.paragraphs||[]).find(p=>typeof p==='string'&&p.trim())?.trim()):null;
 if(lead){
  const head=body.match(/<div class="chapter-head">[\s\S]*?<\/div>/)?.[0];
  if(!head)throw Error('Chapter header required for reviewed lead');
  const updated=head.replace(/<p(?:\s[^>]*)?>[\s\S]*?<\/p>/g,p=>{
   if(/\bdata-reviewed-lead=/.test(p))return '';
   if(/<p\b[^>]*(?:\bid=|\bdata-)/.test(p)||/<(?:button|input|select|textarea)\b/i.test(p))return p;
   const links=[...p.matchAll(/<a\b([^>]*)>[\s\S]*?<\/a>/gi)].map(m=>{
    const href=m[1].match(/\bhref\s*=\s*["']([^"']+)["']/i)?.[1];
    const label=typeof candidate.sourceLabels?.[href]==='string'?candidate.sourceLabels[href].trim():'';
    return label?`<a${m[1]}>${esc(label)}</a>`:m[0];
   });return links.length?`<p>${links.join(' · ')}</p>`:'';
  }).replace('</div>',`<p data-reviewed-lead="true">${esc(lead)}</p></div>`);
  body=body.replace(head,updated);
 }
 if(section==='ai-only-lab'){
  const parsed=reportElements(body).elements,root=parsed.find(n=>n.attrs.id===section);
  const groups=parsed.filter(n=>n.parent===root&&Object.hasOwn(n.attrs,'data-reviewed-domestic'));
  if(groups.length>1)throw Error('Ambiguous domestic case groups');
  if(!groups.length){
   const children=parsed.filter(n=>n.parent===root),index=children.findIndex(n=>n.tag==='h3'&&body.slice(n.start,n.end).replace(/<[^>]*>/g,'').trim()==='국내 제작 사례');
   if(index<0)throw Error('Domestic case heading missing');
   let last=index;while(children[last+1]?.tag==='p')last++;
   const snippet=body.slice(children[index].start,children[last].end);
   if(!/data-ai-case=["']creator["']/.test(snippet)||!/ai-solo-creators-[0-9-]+\.json/.test(snippet))throw Error('Domestic case source or ledger missing');
   body=body.slice(0,children[index].start)+'<div data-reviewed-domestic="true">'+snippet+'</div>'+body.slice(children[last].end);
  }
 }
 if(['game-ideas','ai-production'].includes(section)){
  const cards=[...body.matchAll(/<article class="idea-card">[\s\S]*?<h3>([^<]+)<\/h3>[\s\S]*?<\/article>/g)];
  if(cards.length!==3||cards.some(c=>typeof candidate.copyPrompts?.[c[1]]!=='string'||!candidate.copyPrompts[c[1]].trim()))throw Error('Three reviewed card copy prompts required');
  if(!/^\d{4}-\d{2}-\d{2}$/.test(packet.issueDate||'')||!Array.isArray(candidate.downloadArtifacts))throw Error('Card Markdown artifacts and issue date required');
  for(const [index,card] of cards.entries()){
   const suffix=section==='game-ideas'?'idea':'ai-plan',target=`reports/weekly-${packet.issueDate}-${suffix}-0${index+1}.md`;
   const artifacts=candidate.downloadArtifacts.filter(a=>a.targetPath===target),copy=candidate.copyPrompts[card[1]];
   if(artifacts.length!==1||typeof artifacts[0].content!=='string'||copy.trim()!==artifacts[0].content.trim()||!/^[a-f0-9]{64}$/.test(artifacts[0].sha256||'')||crypto.createHash('sha256').update(artifacts[0].content).digest('hex')!==artifacts[0].sha256)throw Error('Card copy must match its individual approved Markdown');
   const id=`reviewed-copy-${section}-${index+1}`,buttons=[...card[0].matchAll(/<button\b[^>]*\bdata-copy-(?:idea|ai-plan)="[^"]+"[^>]*>[\s\S]*?<\/button>/g)];
   if(buttons.length!==1)throw Error('Card copy button missing or ambiguous');
   let updated=card[0].replace(/<details\b[^>]*\bdata-reviewed-copy="true"[^>]*>[\s\S]*?<\/details>/g,'').replace(/<pre\b[^>]*\bdata-reviewed-copy="true"[^>]*>[\s\S]*?<\/pre>/g,'');
   updated=updated.replace(buttons[0][0],button=>button.replace(/\sdata-copy-workflow="[^"]*"/g,'').replace(/<button\b/,'<button data-copy-workflow="'+id+'"').replace(/>[^<]*<\/button>$/,section==='game-ideas'?'>기획 원문 복사</button>':'>제작 계획 원문 복사</button>'));
   updated=updated.replace('</article>',`<details data-reviewed-copy="true"><summary>기획 원문 보기</summary><pre id="${id}"><code class="language-markdown">${esc(candidate.copyPrompts[card[1]].trim())}</code></pre></details></article>`);
   body=body.replace(card[0],updated);
  }
 }
 if(candidate.imageReplacements){
  if(typeof candidate.imageReplacements!=='object'||Array.isArray(candidate.imageReplacements))throw Error('Image replacements must map local paths');
  body=body.replace(/<img\b[^>]*>/gi,tag=>tag.replace(/\bsrc="([^"]+)"/, (attribute,old)=>{
   if(!Object.hasOwn(candidate.imageReplacements,old))return attribute;
   const replacement=candidate.imageReplacements[old];
   if(typeof replacement!=='string'||!/^\.\.\/assets\/report\/[a-zA-Z0-9_./-]+\.webp$/.test(replacement)||replacement.includes('/../'))throw Error('Unsafe image replacement path');
   return `src="${esc(replacement)}"`;
  }));
 }
 if(candidate.legacyParagraphReplacements){
  for(const [oldText,newText] of Object.entries(candidate.legacyParagraphReplacements)){
   if(typeof newText!=='string'||!newText.trim()||!oldText.trim())throw Error('Invalid legacy paragraph replacement');
   const normalize=t=>t.replace(/\s+/g,' ').trim(),parsed=reportElements(body).elements;
   const ps=parsed.filter(n=>n.tag==='p'&&/^<p>[^<>]*<\/p>$/.test(body.slice(n.start,n.end)));
   const matching=ps.filter(n=>normalize(body.slice(n.start+3,n.end-4))===normalize(oldText));
   const already=ps.filter(n=>normalize(body.slice(n.start+3,n.end-4))===normalize(esc(newText)));
   if(matching.length===0&&already.length===1)continue;
   if(matching.length!==1||already.length)throw Error('Legacy paragraph missing or ambiguous');
   const n=matching[0];body=body.slice(0,n.start)+`<p>${esc(newText)}</p>`+body.slice(n.end);
  }
 }
 if(candidate.practiceWidgets){
  for(const [id,copy] of Object.entries(candidate.practiceWidgets)){
   if(!copy||['buttonLabel','output','verify','followup'].some(k=>typeof copy[k]!=='string'||!copy[k].trim()))throw Error('Incomplete practice widget labels');
   const nodes=reportElements(body).elements,buttons=nodes.filter(n=>n.tag==='button'&&n.attrs['data-copy-workflow']===id);
   if(buttons.length!==1)throw Error('Practice widget button missing or ambiguous');
   const button=buttons[0];let block=button.parent;
   while(block&&!(block.attrs.class||'').split(/\s+/).includes('practice-prompt'))block=block.parent;
   if(!block)throw Error('Practice widget block missing');
   const descendants=nodes.filter(n=>{for(let x=n.parent;x;x=x.parent)if(x===block)return true;return false;});
   if(!descendants.some(n=>n.tag==='pre'&&(n.attrs.id===id||descendants.some(c=>c.attrs.id===id&&c.parent===n))))throw Error('Practice widget target missing');
   const labels=['받을 결과','직접 확인','이어서 물어보기'];
   const ps=descendants.filter(n=>n.tag==='p'&&labels.some(label=>body.slice(n.start,n.end).includes(label)));
   if(labels.some(label=>ps.filter(n=>body.slice(n.start,n.end).includes(label)).length!==1))throw Error('Practice widget labels missing or ambiguous');
   const patches=ps.map((n,i)=>({start:n.start,end:n.end,text:i===0?`<p>받을 결과: ${esc(copy.output)} · 직접 확인: ${esc(copy.verify)} · 이어서 물어보기: ${esc(copy.followup)}</p>`:''}));
   const tag=body.slice(button.start,button.end),open=tag.match(/^<button\b[^>]*>/)?.[0];if(!open)throw Error('Invalid practice button');
   patches.push({start:button.start,end:button.end,text:open+esc(copy.buttonLabel)+'</button>'});
   for(const patch of patches.sort((a,b)=>b.start-a.start))body=body.slice(0,patch.start)+patch.text+body.slice(patch.end);
  }
 }
 const plain=body.replace(/<[^>]*>/g,' ').replace(/\s+/g,' ');
 let extra=`<div data-reviewed-packet="${hash}">${section==='ai-only-lab'?'<h3>해외 조사 범위와 한계</h3>':''}`;
 for(const p of candidate.paragraphs||[])if(typeof p==='string'&&p.trim()&&p.trim()!==lead&&!plain.includes(p.trim()))extra+=`<p>${esc(p)}</p>`;
 const t=candidate.table;
 if(t&&section==='opportunities'){
  if(!Array.isArray(t.rows)||!t.rows.length||t.rows.some(row=>!Array.isArray(row)||row.length!==5||!url(row[4])))throw Error('Opportunity rows require five fields and an official URL');
  extra+=`<p class="code-caption">${esc(t.caption)}</p><ul class="event-list">${t.rows.map(row=>`<li><div class="event-date">${esc(row[2])}</div><div><h3>${esc(row[0])}</h3><p><strong>${esc(row[1])}</strong></p><p>${esc(row[3])}</p><a href="${esc(url(row[4]))}">${esc(row[0])} 공식 안내</a></div></li>`).join('')}</ul>`;
 }
 if(section==='sources'&&candidate.requestedItems!==undefined){
  const items=candidate.requestedItems,required=['id','title','group','type','sourceUrl','publisher','publishedAt','checkedAt','summary','gameUse','selectionReason','practice'];
  if(!Array.isArray(items)||new Set(items.map(item=>item?.id)).size!==items.length||items.some(item=>!item||required.some(k=>typeof item[k]!=='string'||!item[k].trim())||!url(item.sourceUrl)||(!String(item.license||'').trim()&&!String(item.limitation||'').trim())||(item.repeatReason!==undefined&&typeof item.repeatReason!=='string')))throw Error('Invalid requested source item');
  if(candidate.requestedLedgerUrl!==undefined){
   if(!/^\d{4}-\d{2}-\d{2}$/.test(packet.issueDate||'')||candidate.requestedLedgerUrl!==`../assets/report/research/user-requested-${packet.issueDate}.json`)throw Error('Invalid requested source ledger path');
   extra+=`<p><a href="${esc(candidate.requestedLedgerUrl)}">지정자료 조사 원장</a></p>`;
  }
  if(items.length)extra+=`<details><summary>사용자 지정 자료 ${items.length}건</summary>${items.map(item=>`<article class="card" data-requested-item="${esc(item.id)}"><h3>${esc(item.title)}</h3><p><strong>분류</strong> ${esc(item.group)} · ${esc(item.type)}</p><p><a href="${esc(url(item.sourceUrl))}">원문 보기</a> · ${esc(item.publisher)} · 게시일 ${esc(item.publishedAt)} · 확인일 ${esc(item.checkedAt)}</p><p>${esc(item.summary)}</p><p><strong>게임 제작 활용</strong> ${esc(item.gameUse)}</p><p><strong>선정 이유</strong> ${esc(item.selectionReason)}</p><p><strong>작은 실습</strong> ${esc(item.practice)}</p>${item.license?`<p><strong>사용 조건</strong> ${esc(item.license)}</p>`:''}${item.limitation?`<p><strong>한계</strong> ${esc(item.limitation)}</p>`:''}${item.repeatReason?`<p><strong>재소개 이유</strong> ${esc(item.repeatReason)}</p>`:''}</article>`).join('')}</details>`;
 }
 if(t&&section==='sources'){
  if(!Array.isArray(t.rows)||!t.rows.length||t.rows.some(row=>!Array.isArray(row)||row.length!==6||!url(row[1])))throw Error('Source rows require six fields and an original URL');
  extra+=`<p class="code-caption">${esc(t.caption)}</p><ol class="sources-list">${t.rows.map((row,i)=>`<li style="grid-template-columns:34px minmax(0,1fr)"><span>${i+1}</span><div style="min-width:0;overflow-wrap:anywhere"><a href="${esc(url(row[1]))}">${esc(row[0])}</a><p>확인일 ${esc(row[2])} · ${esc(row[3])}</p><p>${esc(row[4])}</p><p>${esc(row[5])}</p></div></li>`).join('')}</ol>`;
 }
 if(t&&section==='careers'){
  if(!Array.isArray(t.columns)||t.columns.length!==8||!Array.isArray(t.rows)||t.rows.length!==careerCategories.length||t.rows.some(r=>!Array.isArray(r)||r.length!==8||!url(r[7]))||!/^\d{4}-\d{2}-\d{2}$/.test(candidate.checkedAt||''))throw Error('Five sourced career rows and checked date required');
  const requiredCourses=candidate.requiredCourses??[];
  if(!Array.isArray(requiredCourses)||requiredCourses.some(c=>!c||typeof c.title!=='string'||!c.title.trim()||!url(c.url)||typeof c.note!=='string'||!c.note.trim()))throw Error('Invalid official required courses');
  extra+=t.rows.map((row,index)=>{
   const category=careerCategories[index],status=candidate.careerStatuses?.[category];
   if(!['listed','open','planned','closed','unknown'].includes(status))throw Error('Invalid career status: '+category);
   const terms=t.columns.slice(3,7).map((label,i)=>`<dt>${esc(label)}</dt><dd>${esc(row[i+3])}</dd>`).join('');
   const courses=category==='bootcamps'&&requiredCourses.length?`<ul>${requiredCourses.map(c=>`<li><a href="${esc(url(c.url))}">${esc(c.title)}</a> · ${esc(c.note)}</li>`).join('')}</ul>`:'';
   return `<article class="job-card" data-career-category="${category}"${index===0?' data-career-expansion="true"':''}><h3>${esc(row[0])}</h3><h4>${esc(row[1])}</h4><p class="status" data-career-status="${status}">${esc(row[2])}</p><dl class="detail-list">${terms}</dl>${courses}<p><a href="${esc(url(row[7]))}">${esc(row[1])} 공식 원문</a> · 확인일 ${esc(candidate.checkedAt)}</p></article>`;
  }).join('');
 }
 if(t&&section==='github-trending'){
  const rankCell=value=>{const match=String(value).match(/^(\d+위)\s+(.+)$/);return match?`<span style="white-space:nowrap">${esc(match[1])}</span><br><span style="white-space:nowrap">${esc(match[2])}</span>`:`<span style="white-space:nowrap">${esc(value)}</span>`;};
  extra+=`<div class="table-scroll"><table><caption>주간 관측 후보 비교</caption><thead><tr><th scope="col">순위·저장소</th><th scope="col">별 수</th><th scope="col">용도·실습</th><th scope="col">라이선스·부담과 원문</th></tr></thead><tbody>${t.rows.map(row=>`<tr><td>${rankCell(row[0])}</td><td><span class="num" style="white-space:nowrap">누적 ${esc(row[1])}</span> / <span class="num" style="white-space:nowrap">주간 증가 ${esc(row[2])}</span></td><td>${esc(row[3])}</td><td>${esc(row[4])} · <a href="${esc(url(row[5]))}" aria-label="${esc(row[0])} 공식 원문">공식 원문</a></td></tr>`).join('')}</tbody></table></div>`;
 }
 if(t&&section!=='game-ai-tools'&&section!=='github-trending'&&section!=='careers'&&section!=='opportunities'&&section!=='sources'){if(!Array.isArray(t.columns)||!Array.isArray(t.rows)||!t.columns.length||t.rows.some(r=>!Array.isArray(r)||r.length!==t.columns.length))throw Error('Malformed table');extra+=`<div class="table-scroll"><table><caption>${esc(t.caption)}</caption><thead><tr>${t.columns.map(c=>`<th scope="col">${esc(c)}</th>`).join('')}</tr></thead><tbody>${t.rows.map(row=>`<tr>${row.map((cell,i)=>{const u=url(cell);let value=esc(cell);if(section==='ai-trends'&&!u){if(i===0)value=`<span style="white-space:nowrap">${value}</span>`;else value=value.replaceAll('Images 2.6','<span style="white-space:nowrap">Images 2.6</span>');}return `<td>${u?`<a href="${esc(u)}" aria-label="${esc(row[0])} 공식 원문">공식 원문</a>`:value}</td>`;}).join('')}</tr>`).join('')}</tbody></table></div>`;}
 if(candidate.downloadLinks!==undefined){
  if(!['game-ideas','ai-production'].includes(section)||!Array.isArray(candidate.downloadLinks)||!Array.isArray(candidate.downloadArtifacts)||!/^\d{4}-\d{2}-\d{2}$/.test(packet.issueDate||''))throw Error('Invalid issue download configuration');
  const day=Date.parse(packet.issueDate+'T00:00:00Z');if(!Number.isFinite(day)||new Date(day).toISOString().slice(0,10)!==packet.issueDate)throw Error('Invalid issue date');
  const seen=new Set();
  for(const link of candidate.downloadLinks){
   if(!link||typeof link.href!=='string'||!new RegExp('^weekly-'+packet.issueDate+'-[A-Za-z0-9_-]+\\.md$').test(link.href)||typeof link.label!=='string'||!link.label.trim()||seen.has(link.href))throw Error('Unsafe or duplicate download link');
   seen.add(link.href);const matches=candidate.downloadArtifacts.filter(a=>a.targetPath==='reports/'+link.href);
   if(matches.length!==1||!/^[a-f0-9]{64}$/.test(matches[0].sha256||'')||typeof matches[0].content!=='string'||crypto.createHash('sha256').update(matches[0].content).digest('hex')!==matches[0].sha256)throw Error('Download artifact hash binding missing');
  }
  const existing=new Set(reportElements(body).elements.filter(n=>n.tag==='a').map(n=>n.attrs.href));
  const add=candidate.downloadLinks.filter(link=>!existing.has(link.href));
  if(add.length)extra+=`<ul>${add.map(link=>`<li><a href="${esc(link.href)}" download>${esc(link.label)}</a></li>`).join('')}</ul>`;
 }
 const p=candidate.practice;
 if(p?.body){
  let prompt='';
  if(typeof p.prompt==='string'&&p.prompt.trim()){
   if(!/^[a-z][a-z0-9-]*$/.test(section))throw Error('Unsafe section ID for practice prompt');
   const id='reviewed-prompt-'+section;
   const collision=elements.some(n=>n.attrs.id===id&&(()=>{for(let x=n;x;x=x.parent)if(x===oldBlocks[0])return false;return true;})());
   if(collision)throw Error('Practice prompt ID already exists');
   prompt=`<pre id="${esc(id)}">${esc(p.prompt)}</pre><button type="button" data-copy-workflow="${esc(id)}">프롬프트 복사</button><p>받을 결과는 위 요청의 초안이에요. 직접 확인할 기준을 대조하고, 이어서 물어보기에는 관찰한 차이나 오류를 전달하세요.</p>`;
  }
  extra+=`<div class="practice-prompt${prompt?'':' practice-note'}"><h3>${esc(p.heading||'작은 실습')}</h3><p>${esc(p.body)}</p>${typeof p.constraint==='string'&&p.constraint.trim()?`<p><mark class="caution">${esc(p.constraint)}</mark></p>`:''}${prompt}</div>`;
 }
 const readingMetadata=record=>{
  for(const key of ['publisher','publishedAt','checkedAt','languageScope','selectionReason','freshness','verification'])if(typeof record[key]!=='string'||!record[key].trim())throw Error('Reading metadata missing: '+key);
  for(const key of ['watchPoints','relatedJobs'])if(!Array.isArray(record[key])||!record[key].length||record[key].some(v=>typeof v!=='string'||!v.trim()))throw Error('Reading metadata missing: '+key);
  const labels=[['발행처',record.publisher],['게시일',record.publishedAt],['확인일',record.checkedAt],['언어·지역',record.languageScope],['선정 이유',record.selectionReason],['최신성',record.freshness],['확인 범위',record.verification]];
  return labels.map(([label,value])=>`<p class="reading-meta"><strong>${label}</strong> ${esc(value)}</p>`).join('')+`<p><strong>살펴볼 점</strong></p><ul>${record.watchPoints.map(v=>`<li>${esc(v)}</li>`).join('')}</ul><p><strong>관련 직무</strong></p><ul>${record.relatedJobs.map(v=>`<li>${esc(v)}</li>`).join('')}</ul>`;
 };
 if(section==='reading'){
  if(!Array.isArray(candidate.readingResources))throw Error('Reading articles or posts must be an array');
  if(!Array.isArray(candidate.media))throw Error('Reading videos must be an array');
  for(const item of candidate.readingResources){
   const src=url(item.sourceUrl);if(!['article','post'].includes(item.kind)||!src||!item.title||/^(?:www\.)?(?:youtube\.com|youtu\.be)$/i.test(new URL(src).hostname))throw Error('Invalid reading article or post');
   extra+=`<article class="reading-item card" data-kind="${esc(item.kind)}"><h3>${esc(item.title)}</h3><p><a href="${esc(src)}">${esc(item.title)} 원문</a></p>${readingMetadata(item)}</article>`;
  }
 }
 for(const m of candidate.media||[]){
  const src=url(m.sourceUrl);if(section==='reading'&&(m.kind!=='video'||!src||!m.title||!/^[\w-]{11}$/.test(m.videoId||'')||src!==`https://www.youtube.com/watch?v=${m.videoId}`))throw Error('Invalid reading video');if(!src||!m.title)continue;
  if(section==='game-ai-tools'&&(m.kind==='image'||m.id==='jolt-demo')){
   const reason=m.kind==='image'?'이미지 사용 권리와 대체 텍스트 확인 전이라 원문 링크로 제공해요.':'기존 도구 카드에서 같은 시연을 연결해 중복 영상은 접었어요.';
   extra+=`<p><a href="${esc(src)}">${esc(m.title)} 원문</a> · ${reason}</p>`;continue;
  }
  if(m.kind==='video'&&/^[\w-]{11}$/.test(m.videoId||'')&&src===`https://www.youtube.com/watch?v=${m.videoId}`){
   const alt=m.title.trim().endsWith('영상')?m.title+' 미리보기':m.title+' 영상 미리보기';
   extra+=`<article class="${section==='reading'?'tool-media reading-item card':'tool-media'}"${section==='reading'?' data-kind="video"':''}><h3>${esc(m.title)}</h3><p><a href="${esc(src)}">영상 원문</a> · ${esc(m.verification||'')}</p>${section==='reading'?readingMetadata(m):''}<div class="youtube-preview"><button type="button" data-youtube-play="${esc(m.videoId)}" data-play-video="${esc(m.videoId)}" data-video-title="${esc(m.title)}"><img src="https://i.ytimg.com/vi/${esc(m.videoId)}/hqdefault.jpg" alt="${esc(alt)}" loading="lazy"><span>영상 불러오기</span></button><div class="video-slot"></div></div></article>`;
  }else if(m.kind==='image'&&m.alt&&m.officialReferrer&&url(m.officialReferrer)){
   extra+=`<figure class="tool-media"><a href="${esc(url(m.officialReferrer))}"><img src="${esc(src)}" alt="${esc(m.alt)}" loading="lazy"></a><figcaption>${esc(m.title)} · <a href="${esc(url(m.officialReferrer))}">공식 출처</a></figcaption></figure>`;
  }
 }

 const primary=section==='reading'?new Set([...(candidate.readingResources||[]),...(candidate.media||[])].map(item=>url(item.sourceUrl)).filter(Boolean)):new Set();
 const sources=[...new Set((candidate.sourceUrls||[]).map(url).filter(u=>u&&!primary.has(u)))];
 if(sources.length&&section!=='sources')extra+=`<p>${section==='reading'?'추가 공식 근거':candidate.sourceRole==='background'?'참고 자료':'원문'}: ${sources.map(u=>{const label=candidate.sourceLabels?.[u];const parsed=new URL(u);return `<a href="${esc(u)}">${esc(typeof label==='string'&&label.trim()?label.trim():parsed.hostname+parsed.pathname)}</a>`;}).join(' · ')}</p>`;
 if(candidate.limitation)extra+=`<p>${esc(candidate.limitation)}</p>`;
 extra+='</div>';
 const close=body.lastIndexOf(`</${node.tag}>`);if(close<0)throw Error('Section closing tag missing');
 const output=html.slice(0,start)+body.slice(0,close)+extra+body.slice(close)+html.slice(end);
 validateSectionPractices(output,{sectionIds:[section]});
 return output;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{
  const args=process.argv.slice(2),keys=['--html','--section','--run','--output'];
  const refreshLayout=args.includes('--refresh-layout');if(refreshLayout)args.splice(args.indexOf('--refresh-layout'),1);
  const parallel=args.includes('--parallel');if(parallel)args.splice(args.indexOf('--parallel'),1);
  if(args.length!==8)throw Error('Usage: --html FILE --section ID --run RUN --output FILE');
  const opts=Object.fromEntries(Array.from({length:4},(_,i)=>[args[i*2],args[i*2+1]]));
  if(Object.keys(opts).length!==4||keys.some(k=>!opts[k]))throw Error('Invalid arguments');
  if(path.resolve(opts['--html'])===path.resolve(opts['--output']))throw Error('Output must be separate from input');
  const script=path.join(path.dirname(fileURLToPath(import.meta.url)),'report-ledger.py');
  const command=process.platform==='win32'?'py':'python3';
  const commandArgs=[...(process.platform==='win32'?['-3']:[]),'-X','utf8',script,'packet','--run',opts['--run'],'--section',opts['--section']];
  const packet=JSON.parse(execFileSync(command,commandArgs,{cwd:process.cwd(),encoding:'utf8',timeout:30000}));
  if(packet.reviewApproval?.source!=='passed'||packet.reviewApproval?.korean!=='passed')throw Error('SQLite packet is not approved');
  if(path.basename(opts['--html'])!=='weekly-'+packet.issueDate+'.html')throw Error('HTML filename does not match the ledger issue date');
  packet.reviewApproval.candidateSha256=crypto.createHash('sha256').update(JSON.stringify(packet.candidate)).digest('hex');
  const html=await fs.readFile(opts['--html'],'utf8');
  const rendered=renderSection(html,opts['--section'],packet,{refreshLayout});
  const cardNames=['game-ideas','ai-production'].includes(opts['--section'])?Array.from({length:3},(_,i)=>`weekly-${packet.issueDate}-${opts['--section']==='game-ideas'?'idea':'ai-plan'}-0${i+1}.md`):[];
  const downloadFiles=[...new Set([...(packet.candidate.downloadLinks||[]).map(link=>link.href),...cardNames])];
  for(const href of downloadFiles){
   const target=path.resolve('reports',href),repo=await fs.realpath(process.cwd()),parent=await fs.realpath(path.join(repo,'reports'));
   if(parent!==path.join(repo,'reports')||!target.startsWith(parent+path.sep))throw Error('Unsafe download artifact path');
   const stat=await fs.lstat(target);if(!stat.isFile()||stat.isSymbolicLink()||(await fs.realpath(target))!==target)throw Error('Download artifact is not a regular file');
   const artifact=packet.candidate.downloadArtifacts.find(a=>a.targetPath==='reports/'+href);
   if(!artifact)throw Error('Download artifact missing');
   if(crypto.createHash('sha256').update(await fs.readFile(target)).digest('hex')!==artifact.sha256)throw Error('Download artifact file hash mismatch');
  }
  if(parallel){
   const root=await fs.realpath(process.cwd()),output=path.resolve(opts['--output']);
   await preparePreview(root,output,packet.issueDate);
   const before=sectionParts(html,opts['--section']),after=sectionParts(rendered,opts['--section']);
   if(before.presentation!==after.presentation)throw Error('Parallel renderer changed shared shell');
   const manifest={runId:opts['--run'],sectionId:opts['--section'],packetSha:packet.reviewApproval.packetSha256,candidateSha:packet.reviewApproval.candidateSha256,sectionSha:digest(after.section),presentationSha:digest(before.presentation),baseFileSha:digest(html),candidateFileSha:digest(rendered),presentationFiles:await presentationFiles(root,html)};
   await fs.writeFile(output,rendered,{flag:'wx'});await fs.writeFile(output+'.manifest.json',JSON.stringify(manifest,null,2)+'\n',{flag:'wx'});
  }else{
   await materializeAssets(process.cwd(),packet.candidate);
   await fs.writeFile(opts['--output'],rendered,{flag:'wx'});
  }
 }catch(e){console.error(e.message);process.exitCode=1;}
}
