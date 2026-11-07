import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {reportElements} from './validate-weekly-presentation.mjs';
export const digest=value=>crypto.createHash('sha256').update(value).digest('hex');
export function sectionParts(html,id){
 const {elements}=reportElements(html),matches=elements.filter(n=>n.attrs.id===id);
 if(matches.length!==1)throw Error('Missing or duplicate declared section: '+id);
 const node=matches[0];if(!['section','div'].includes(node.tag))throw Error('Invalid section element');
 const removals=[];let removed=0;
 for(const m of html.matchAll(/(<(?:script|style)\b[^>]*>)[\s\S]*?(<\/(?:script|style)>)/gi)){
  const length=m[0].length-m[1].length-m[2].length;removals.push({at:m.index+m[1].length-removed,length});removed+=length;
 }
 const offset=n=>n+removals.filter(r=>r.at<=n).reduce((sum,r)=>sum+r.length,0);
 const start=offset(node.start),end=offset(node.end);
 return {start,end,section:html.slice(start,end),presentation:html.slice(0,start)+html.slice(end)};
}
export async function presentationFiles(root,html){
 const {elements}=reportElements(html),paths=new Set();
 for(const n of elements){
  let ref=n.tag==='link'&&n.attrs.rel==='stylesheet'?n.attrs.href:n.tag==='script'?n.attrs.src:null;
  if(!ref)continue;ref=ref.split('?')[0];
  if(ref.startsWith('../assets/report/'))paths.add(ref.slice(3));
  else if(/^weekly-\d{4}-\d{2}-\d{2}\.js$/.test(ref))paths.add('reports/'+ref);
  else if(!/^(?:https?:|\/\/)/.test(ref))throw Error('Unsupported presentation dependency: '+ref);
 }
 const result={};for(const ref of [...paths].sort()){
  if(ref.split('/').some(part=>part==='..'||part==='.'||!part))throw Error('Unsafe presentation dependency');
  const file=path.join(root,ref),real=await fs.realpath(file),stat=await fs.lstat(file);
  if(!stat.isFile()||stat.isSymbolicLink()||!real.startsWith(await fs.realpath(root)+path.sep))throw Error('Unsafe presentation file');
  result[ref]=digest(await fs.readFile(real));
 }
 return result;
}
export async function assembleSections({root,base,runId,sectionIds,candidates,packetLookup,approvedLookup,measure}){
 if(!/^[a-z0-9][a-z0-9-]{0,63}$/.test(runId)||!Array.isArray(sectionIds)||!sectionIds.length||new Set(sectionIds).size!==sectionIds.length||candidates.length!==sectionIds.length)throw Error('Invalid requested section set');
 const original=await fs.readFile(base,'utf8'),baseHash=digest(original),presentation=await presentationFiles(root,original),collected=new Map();
 for(const file of candidates){
  const bytes=await fs.readFile(file),html=bytes.toString('utf8'),manifest=JSON.parse(await fs.readFile(file+'.manifest.json','utf8'));
  if(manifest.runId!==runId||!sectionIds.includes(manifest.sectionId)||collected.has(manifest.sectionId)||manifest.baseFileSha!==baseHash||manifest.candidateFileSha!==digest(bytes))throw Error('Candidate manifest mismatch or duplicate');
  const before=sectionParts(original,manifest.sectionId),after=sectionParts(html,manifest.sectionId);
  if(manifest.presentationSha!==digest(before.presentation)||after.presentation!==before.presentation||manifest.sectionSha!==digest(after.section)||JSON.stringify(manifest.presentationFiles)!==JSON.stringify(presentation))throw Error('Candidate shell, section, or presentation files changed');
  const packet=await packetLookup(runId,manifest.sectionId);
  if(packet.sectionId!==manifest.sectionId||packet.reviewApproval?.source!=='passed'||packet.reviewApproval?.korean!=='passed'||packet.reviewApproval?.packetSha256!==manifest.packetSha||digest(JSON.stringify(packet.candidate))!==manifest.candidateSha)throw Error('Candidate packet is stale or unapproved');
  if(!after.section.includes(`data-reviewed-packet="${manifest.candidateSha}"`))throw Error('Candidate lacks approved packet marker');
  const approved=await approvedLookup(runId,manifest.sectionId),actual=await measure(file,manifest.sectionId);
  if(approved.sectionId!==manifest.sectionId||approved.packetSha!==manifest.packetSha||approved.subjectFileSha!==digest(bytes)||approved.sectionSha!==actual.sectionSha||approved.readerSha!==actual.readerSha||approved.presentationSha!==actual.presentationSha||!['content','korean','ui'].every(k=>Number.isInteger(approved.reviewIds?.[k])&&/^[a-f0-9]{64}$/.test(approved.evidenceHashes?.[k]||'')))throw Error('Candidate is not the independently approved section');
  collected.set(manifest.sectionId,after.section);
 }
 if(sectionIds.some(id=>!collected.has(id)))throw Error('Missing required candidate');
 let result=original;
 const replacements=sectionIds.map(id=>({...sectionParts(original,id),id})).sort((a,b)=>b.start-a.start);
 for(let i=1;i<replacements.length;i++)if(replacements[i-1].start<replacements[i].end)throw Error('Overlapping sections');
 for(const r of replacements)result=result.slice(0,r.start)+collected.get(r.id)+result.slice(r.end);
 const ids=reportElements(result).elements.map(n=>n.attrs.id).filter(Boolean);if(new Set(ids).size!==ids.length)throw Error('Merged report has duplicate DOM IDs');
 return result;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{
  const args=process.argv.slice(2),take=name=>{const i=args.indexOf(name);if(i<0||!args[i+1])throw Error('Missing '+name);return args.splice(i,2)[1];};
  const base=take('--base'),runId=take('--run'),output=take('--output'),sectionIds=take('--sections').split(',');const candidates=[];while(args.includes('--candidate'))candidates.push(take('--candidate'));if(args.length)throw Error('Unknown arguments');
  if(path.resolve(base)===path.resolve(output)||candidates.some(c=>path.resolve(c)===path.resolve(output)))throw Error('Output must be separate');
  const root=process.cwd(),script=path.join(root,'workflows/report-ledger.py'),command=process.platform==='win32'?'py':'python3';
  const packetLookup=async(run,id)=>JSON.parse(execFileSync(command,[...(process.platform==='win32'?['-3']:[]),'-X','utf8',script,'packet','--run',run,'--section',id],{cwd:root,encoding:'utf8',timeout:30000}));
  const approvedLookup=async(run,id)=>JSON.parse(execFileSync(command,[...(process.platform==='win32'?['-3']:[]),'-X','utf8',script,'approved-section','--run',run,'--section',id],{cwd:root,encoding:'utf8',timeout:30000}));
  const pythonCode="import importlib.util,json,sys; s=importlib.util.spec_from_file_location('ledger',sys.argv[1]); m=importlib.util.module_from_spec(s); s.loader.exec_module(m); print(json.dumps({'sectionSha':m.section_hash(sys.argv[2],sys.argv[3]),'readerSha':m.reader_hash(sys.argv[2],sys.argv[3]),'presentationSha':m.presentation_hash(sys.argv[2])}))";
  const measure=async(file,id)=>JSON.parse(execFileSync(command,[...(process.platform==='win32'?['-3']:[]),'-X','utf8','-c',pythonCode,script,file,id],{cwd:root,encoding:'utf8',timeout:30000}));
  const html=await assembleSections({root,base,runId,sectionIds,candidates,packetLookup,approvedLookup,measure});await fs.writeFile(output,html,{flag:'wx'});
 }catch(e){console.error(e.message);process.exitCode=1;}
}
