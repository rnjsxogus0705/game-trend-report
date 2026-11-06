import fs from 'node:fs/promises';
import {reportElements,careerCategories,validateCareerCoverage} from './validate-weekly-presentation.mjs';
import {isDeepStrictEqual} from 'node:util';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const insist=(ok,message)=>{if(!ok)throw Error(message);};
function sourceDay(value){
 if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2}))?$/.test(value))return NaN;
 const calendar=Date.parse(value.slice(0,10)+'T00:00:00Z'),instant=Date.parse(value);
 if(!Number.isFinite(calendar)||!Number.isFinite(instant)||new Date(calendar).toISOString().slice(0,10)!==value.slice(0,10))return NaN;
 const koreanDate=value.length===10?value:new Date(instant+9*3600000).toISOString();
 return Date.parse(koreanDate.slice(0,10)+'T00:00:00Z');
}

export async function checkReportHarness({root,runId,revision}){
 insist(/^[a-z0-9][a-z0-9-]{0,63}$/.test(runId),'Unsafe run ID');
 root=await fs.realpath(root);
 async function read(relative){
  insist(typeof relative==='string'&&!relative.includes('\\')&&!path.posix.isAbsolute(relative)&&!path.win32.isAbsolute(relative)&&relative.split('/').every(p=>p&&p!=='.'&&p!=='..'),'Unsafe artifact path');
  insist(!relative.split('/').some(p=>p.startsWith('.env')||p==='private'||p.endsWith('.dpapi')),'Credential path is not an artifact');
  const file=path.resolve(root,relative),real=await fs.realpath(file),stat=await fs.lstat(file);
  insist(real.startsWith(root+path.sep)&&stat.isFile()&&!stat.isSymbolicLink(),'Artifact escapes root or is not a regular file');
  return fs.readFile(file);
 }
 const spec=JSON.parse(await read('.agents/skills/weekly-game-report/references/harness-spec.json'));
 const records={},digests={};
 for(const task of spec.tasks){
  insist(task.depends_on.every(id=>spec.tasks.find(t=>t.id===id).outputs.every(output=>records[output])),'Required upstream is missing: '+task.id);
  for(const id of task.outputs){
   const artifact=spec.outputs.find(a=>a.id===id),bytes=await read(artifact.path.replace('{run_id}',runId)),record=JSON.parse(bytes);
   insist(record.runId===runId&&/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(record.issueDate)&&!Number.isNaN(Date.parse(record.issueDate+'T00:00:00Z'))&&new Date(record.issueDate+'T00:00:00Z').toISOString().slice(0,10)===record.issueDate,'Run/date mismatch: '+id);
   insist(record.instructionRevision===revision,'Stale instruction revision: '+id);
   if(records.context)insist(record.issueDate===records.context.issueDate,'Issue date mismatch: '+id);
   for(const input of task.inputs.filter(i=>spec.outputs.some(a=>a.id===i)))insist(record.inputs?.[input]===digests[input],'Stale upstream artifact: '+id+'/'+input);
   records[id]=record;digests[id]=hash(bytes);
  }
 }
 const context=records.context;
 insist(context.authorization?.generate===true&&context.authorization?.publish===false&&context.authorization?.send===false,'Harness scope must be local generation only');
 const instructions=['README.md','instructions/WORKFLOW.md','instructions/REPORT-GUIDE.md','instructions/REPORT-OUTPUT-CONTRACT.md','instructions/READING-AND-SCHEDULER.md','instructions/KOREAN-EDITORIAL-POLICY.md','instructions/DESIGN.md','instructions/AI-SOLO-CREATOR-WATCHLIST.json','.agents/skills/weekly-game-report/SKILL.md','.agents/skills/weekly-game-report/references/operating-contract.md','.agents/skills/weekly-game-report/references/harness-spec.json'];
 for(const file of instructions)insist(context.instructionFiles?.[file]===hash(await read(file)),'Stale instruction file: '+file);
 const issueBrief='instructions/ISSUE-BRIEF-'+context.issueDate+'.md';let hasIssueBrief=false;
 try{await fs.lstat(path.join(root,issueBrief));hasIssueBrief=true;}catch(error){if(error.code!=='ENOENT')throw error;}
 if(hasIssueBrief||Object.hasOwn(context.instructionFiles||{},issueBrief))insist(context.instructionFiles?.[issueBrief]===hash(await read(issueBrief)),'Missing or stale issue brief: '+issueBrief);
 insist(Array.isArray(records.research.sources)&&records.research.sources.length>0&&records.research.sources.every(source=>/^https:\/\//.test(source.uri||'')&&source.publisher&&source.retrievedAt&&source.scope),'Research evidence metadata missing');
 const issueDay=Date.parse(context.issueDate+'T00:00:00Z'),day=86400000;
 for(const source of records.research.sources){
  const retrieved=sourceDay(source.retrievedAt);
  insist(Number.isFinite(retrieved)&&retrieved>=issueDay-7*day&&retrieved<issueDay+day,'Stale source retrieval');
  insist(['news','overseas','background','unverified'].includes(source.kind),'Source freshness category missing');
  if(['news','overseas'].includes(source.kind)){
   const published=sourceDay(source.publishedAt),age=(issueDay-published)/day;
   insist(Number.isFinite(published)&&age>=0&&age<=(source.kind==='news'?7:90),'Source outside declared publication window');
   if(source.kind==='overseas'&&age>30)insist(source.extendedWindow===true,'Overseas 90-day extension must be disclosed');
  }
  if(source.kind==='unverified')insist(typeof source.limitation==='string'&&source.limitation.trim(),'Unverified source limitation missing');
 }

 validateCareerCoverage(records.research.careerCoverage,{issueDate:context.issueDate});
 for(const item of records.research.careerCoverage)insist(item.sourceUrls.every(url=>records.research.sources.some(source=>source.uri===url)),'Career source is not in research.sources: '+item.category);
 const openTools=records.research.openSourceToolSearch;
 insist(openTools&&['updated','no_material_change','unverified'].includes(openTools.status)&&['searchScope','finding'].every(key=>typeof openTools[key]==='string'&&openTools[key].trim()),'Open-source tool search record missing or incomplete');
 const toolSearchDay=sourceDay(openTools.searchedAt);
 insist(Number.isFinite(toolSearchDay)&&toolSearchDay>=issueDay-7*day&&toolSearchDay<=issueDay,'Open-source tool search date is stale or invalid');
 insist(Array.isArray(openTools.sourceUrls)&&openTools.sourceUrls.length>0&&openTools.sourceUrls.every(url=>records.research.sources.some(source=>source.uri===url)),'Open-source tool search sources are not linked to research.sources');
 if(openTools.status==='unverified')insist(typeof openTools.limitation==='string'&&openTools.limitation.trim(),'Open-source tool search limitation missing');
 const publicAssets=openTools.publicAssets;
 insist(publicAssets&&['updated','no_material_change','unverified'].includes(publicAssets.status)&&['searchScope','finding'].every(key=>typeof publicAssets[key]==='string'&&publicAssets[key].trim()),'Public assets search record missing or incomplete');
 const assetsSearchDay=sourceDay(publicAssets.searchedAt);
 insist(Number.isFinite(assetsSearchDay)&&assetsSearchDay>=issueDay-7*day&&assetsSearchDay<=issueDay,'Public assets search date is stale or invalid');
 insist(Array.isArray(publicAssets.sourceUrls)&&publicAssets.sourceUrls.length>0&&publicAssets.sourceUrls.every(url=>records.research.sources.some(source=>source.uri===url)),'Public assets search sources are not linked to research.sources');
 if(publicAssets.status==='unverified')insist(typeof publicAssets.limitation==='string'&&publicAssets.limitation.trim(),'Public assets search limitation missing');

 const watchlist=JSON.parse(await read('instructions/AI-SOLO-CREATOR-WATCHLIST.json'));
 const handles=watchlist.channels?.map(channel=>channel.handle);
 insist(Array.isArray(handles)&&handles.length>0&&handles.every(handle=>typeof handle==='string'&&handle.trim()===handle&&handle.length>0)&&new Set(handles).size===handles.length,'Creator watchlist handles missing or duplicate');
 const creatorSearch=records.research.creatorContentSearch;
 insist(Array.isArray(creatorSearch?.channels)&&creatorSearch.channels.length===handles.length&&new Set(creatorSearch.channels.map(item=>item?.handle)).size===handles.length&&handles.every(handle=>creatorSearch.channels.some(item=>item?.handle===handle)),'Creator channel coverage missing or duplicate');
 const fresh=value=>{const checked=sourceDay(value);return Number.isFinite(checked)&&checked>=issueDay-7*day&&checked<=issueDay;};
 const linked=urls=>Array.isArray(urls)&&urls.every(url=>records.research.sources.some(source=>source.uri===url));
 for(const item of creatorSearch.channels){
  insist(['updated','no_material_change','unverified'].includes(item.status)&&typeof item.finding==='string'&&item.finding.trim(),'Creator channel record incomplete: '+item.handle);
  insist(fresh(item.searchedAt),'Creator channel search date is stale or invalid: '+item.handle);
  insist(item.sourceUrls?.length>0&&linked(item.sourceUrls),'Creator channel sources are not linked to research.sources: '+item.handle);
  if(item.status==='unverified')insist(typeof item.limitation==='string'&&item.limitation.trim(),'Creator channel limitation missing: '+item.handle);
 }
 const referenceVideos=watchlist.referenceVideos;
 insist(Array.isArray(referenceVideos)&&new Set(referenceVideos.map(v=>v.videoId)).size===referenceVideos.length&&referenceVideos.every(v=>/^[A-Za-z0-9_-]{11}$/.test(v.videoId)&&v.videoUrl==='https://www.youtube.com/watch?v='+v.videoId),'Creator reference watchlist invalid');
 const refs=creatorSearch.referenceVideos;
 insist(Array.isArray(refs)&&refs.length===referenceVideos.length&&new Set(refs.map(v=>v?.videoId)).size===referenceVideos.length&&referenceVideos.every(v=>refs.some(item=>item?.videoId===v.videoId)),'Creator reference coverage missing or duplicate');
 for(const ref of refs){
  const original=referenceVideos.find(v=>v.videoId===ref.videoId);
  insist(['updated','no_material_change','unverified'].includes(ref.status)&&typeof ref.finding==='string'&&ref.finding.trim(),'Creator reference record incomplete: '+ref.videoId);
  insist(fresh(ref.searchedAt),'Creator reference search date is stale or invalid: '+ref.videoId);
  insist(linked(ref.sourceUrls)&&ref.sourceUrls.includes(original.videoUrl),'Creator reference sources missing or not linked: '+ref.videoId);
  if(ref.status==='unverified')insist(typeof ref.limitation==='string'&&ref.limitation.trim(),'Creator reference limitation missing: '+ref.videoId);
 }
 const selected=creatorSearch.selectedVideos;
 insist(Array.isArray(selected)&&new Set(selected.map(v=>v?.videoId)).size===selected.length&&selected.every(v=>v&&typeof v.videoId==='string'&&/^[A-Za-z0-9_-]{11}$/.test(v.videoId)&&v.sourceUrl==='https://www.youtube.com/watch?v='+v.videoId&&typeof v.selectionReason==='string'&&v.selectionReason.trim()&&linked([v.sourceUrl])),'Creator selected videos invalid or source not linked');
 const discovery=creatorSearch.discovery;
 insist(discovery&&typeof discovery.finding==='string'&&discovery.finding.trim()&&Array.isArray(discovery.queries)&&discovery.queries.every(q=>typeof q==='string'&&q.trim())&&discovery.queries.some(q=>/[가-힣]/.test(q))&&discovery.queries.some(q=>/[a-z]/i.test(q)&&!/[가-힣]/.test(q)),'Creator discovery queries or finding missing');
 insist(fresh(discovery.searchedAt),'Creator discovery date is stale or invalid');
 insist(linked(discovery.sourceUrls),'Creator discovery sources are not linked to research.sources');
 const duplicateReview=creatorSearch.duplicateReview;
 insist(duplicateReview&&typeof duplicateReview.finding==='string'&&duplicateReview.finding.trim()&&Array.isArray(duplicateReview.priorIssuePaths),'Creator duplicate review record missing or invalid');
 insist(fresh(duplicateReview.searchedAt),'Creator duplicate review date is stale or invalid');
 const researchDir=path.join(root,'assets/report/research');let previous=[];
 try{
  const stat=await fs.lstat(researchDir),real=await fs.realpath(researchDir);
  insist(stat.isDirectory()&&!stat.isSymbolicLink()&&real.startsWith(root+path.sep),'Unsafe research directory');
  previous=(await fs.readdir(researchDir,{withFileTypes:true})).filter(entry=>{
   const match=/^ai-solo-creators-(\d{4}-\d{2}-\d{2})\.json$/.exec(entry.name),date=match&&sourceDay(match[1]);
   return entry.isFile()&&Number.isFinite(date)&&date<issueDay;
  }).map(entry=>'assets/report/research/'+entry.name).sort();
 }catch(error){if(error.code!=='ENOENT')throw error;}
 insist(duplicateReview.priorIssuePaths.every(p=>typeof p==='string'&&previous.includes(p)),'Creator duplicate review prior issue path invalid');
 insist(duplicateReview.priorIssuePaths.length===previous.length&&new Set(duplicateReview.priorIssuePaths).size===previous.length&&previous.every(p=>duplicateReview.priorIssuePaths.includes(p)),'Creator duplicate review prior issue coverage missing or duplicate');
 const priorVideoIds=new Set();
 for(const prior of duplicateReview.priorIssuePaths){
  const ledger=JSON.parse(await read(prior));
  for(const key of ['videos','channels','referenceVideos'])if(Array.isArray(ledger[key]))for(const entry of ledger[key])if(typeof entry?.videoId==='string')priorVideoIds.add(entry.videoId);
 }
 for(const video of selected)if(priorVideoIds.has(video.videoId))insist(typeof video.repeatReason==='string'&&video.repeatReason.trim(),'Creator repeated video reason missing: '+video.videoId);

 const issue=records.issue;
 insist(Array.isArray(issue.files)&&issue.files.length>0,'Issue file list missing');
 const reviewed={};let htmlPath;
 for(const file of issue.files){
  insist(typeof file.publish==='boolean'&&!Object.hasOwn(reviewed,file.path),'Duplicate file or missing publication scope');
  if(file.publish)insist(/^(reports\/|assets\/report\/)/.test(file.path),'Public file outside report assets');
  else insist(file.path.startsWith('_workspace/harness/weekly-game-report/'+runId+'/')||/^reports\/weekly-.*\.(?:content-review|language-review)\.json$/.test(file.path),'Private evidence outside this run');
  insist(hash(await read(file.path))===file.sha256,'Issue file hash mismatch: '+file.path);reviewed[file.path]=file.sha256;
  if(file.publish&&file.path==='reports/weekly-'+records.context.issueDate+'.html')htmlPath=file.path;
 }
 const creatorLedgerPath='assets/report/research/ai-solo-creators-'+context.issueDate+'.json';
 insist(issue.files.some(file=>file.path===creatorLedgerPath&&file.publish===true),'Creator public ledger missing or private');
 const creatorLedger=JSON.parse(await read(creatorLedgerPath));
 insist(creatorLedger.reportDate===context.issueDate&&isDeepStrictEqual(creatorLedger.videos,selected),'Creator public ledger date or selected videos differ');
 insist(htmlPath,'Canonical weekly HTML missing');
 const html=(await read(htmlPath)).toString('utf8');
 const contentPath=htmlPath+'.content-review.json';
 insist(Object.hasOwn(reviewed,contentPath),'Career content review missing from issue index');
 const contentReview=JSON.parse(await read(contentPath));
 insist(isDeepStrictEqual(contentReview.careerCoverage,records.research.careerCoverage),'Career coverage differs between research and content review');
 const {elements}=reportElements(html);
 const urls=elements.flatMap(node=>[node.attrs.href,node.attrs.src,...(node.attrs.srcset||'').split(',').map(part=>part.trim().split(/\s+/)[0])].filter(Boolean));
 for(const url of urls){
  if(/^(?:[a-z]+:|#|\/\/)/i.test(url))continue;
  const local=decodeURIComponent(url.split(/[?#]/)[0]);
  const linked=path.posix.normalize(local.startsWith('/')?local.slice(1):path.posix.join('reports',local));
  if(linked.startsWith('assets/report/')||linked.startsWith('reports/weekly-'+context.issueDate))insist(Object.hasOwn(reviewed,linked),'Linked issue file missing from index: '+linked);
 }
 for(const id of ['editorial-review','final-review']){
  const review=records[id];insist(review.verdict==='approved'&&Array.isArray(review.blockers)&&review.blockers.length===0,'Review gate not approved: '+id);
  insist(review.publicAssetsReviewed===true,'Independent public assets review missing: '+id);
  insist(Array.isArray(review.referenceVideoIdsReviewed)&&review.referenceVideoIdsReviewed.length===referenceVideos.length&&new Set(review.referenceVideoIdsReviewed).size===referenceVideos.length&&referenceVideos.every(v=>review.referenceVideoIdsReviewed.includes(v.videoId)),'Independent creator reference review missing: '+id);
  insist(Array.isArray(review.careerCategoriesReviewed)&&review.careerCategoriesReviewed.length===careerCategories.length&&careerCategories.every(category=>review.careerCategoriesReviewed.includes(category)),'Independent career category review missing: '+id);
  insist(review.method==='native-subagent'&&typeof review.sessionId==='string'&&review.sessionId&&typeof issue.editorSessionId==='string'&&issue.editorSessionId&&review.sessionId!==issue.editorSessionId,'Independent review execution record missing');
  insist(typeof review.reviewer==='string'&&review.reviewer.trim()&&typeof issue.editor==='string'&&issue.editor.trim()&&review.reviewer.trim()!==issue.editor.trim(),'Independent reviewer required');
  insist(Object.keys(reviewed).length===Object.keys(review.reviewedFiles||{}).length&&Object.entries(reviewed).every(([p,d])=>review.reviewedFiles[p]===d),'Review does not cover final files: '+id);
 }
 insist(records.verification.passed===true&&Array.isArray(records.verification.commands)&&records.verification.commands.length>0&&records.verification.commands.every(c=>Array.isArray(c.argv)&&c.argv.length&&c.exitCode===0),'Verification evidence missing or failed');
 const commands=records.verification.commands;
 for(const name of ['build-site.mjs','validate-issue.mjs'])insist(commands.some(c=>c.argv.some(arg=>typeof arg==='string'&&arg.replaceAll('\\','/').split('/').at(-1)===name)),'Required verification command missing: '+name);
 const ui=records.verification.ui;
 insist(ui&&[320,390,768,1440].every(width=>ui.widths?.includes(width))&&['navigation','disclosure','filter','copy','share','media','downloads','print','typography','tables'].every(check=>ui.checks?.includes(check)),'UI verification coverage missing');
 insist(Array.isArray(ui.evidence)&&ui.evidence.length>0,'UI evidence missing');
 for(const evidence of [...commands.map(c=>c.evidence),...ui.evidence])insist(evidence?.path?.startsWith('_workspace/harness/weekly-game-report/'+runId+'/')&&hash(await read(evidence.path))===evidence.sha256,'Verification evidence hash mismatch');
 insist(Array.isArray(records.ready.handoff)&&records.ready.handoff.length>0&&records.ready.handoff.every(item=>issue.files.some(f=>f.path===item.source)&&item.source.startsWith('reports/weekly-'+context.issueDate)&&item.destination==='reports/'+path.posix.basename(item.source)),'Operating handoff missing');
 for(const file of issue.files.filter(f=>f.path.startsWith('reports/weekly-'+context.issueDate)))insist(records.ready.handoff.some(item=>item.source===file.path),'Operating handoff omits issue file');
 insist(records.ready.status==='ready'&&JSON.stringify(records.ready.files)===JSON.stringify(issue.files),'Publication handoff differs from reviewed files');
 return {runId,issueDate:records.context.issueDate,htmlPath,files:issue.files.length,status:'ready',digests};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{
  const args=process.argv.slice(2);insist(args.length===2&&args[0]==='--run','Usage: node workflows/check-report-harness.mjs --run <run-id> (cwd: repository root)');
  const root=process.cwd(),revision=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
  insist(execFileSync('git',['branch','--show-current'],{cwd:root,encoding:'utf8'}).trim()==='main','Run the publication harness on synchronized main');
  insist(execFileSync('git',['rev-parse','origin/main'],{cwd:root,encoding:'utf8'}).trim()===revision,'Local main is not synchronized with origin/main');
  const result=await checkReportHarness({root,runId:args[1],revision});
  execFileSync(process.execPath,[path.join(root,'workflows/validate-issue.mjs'),path.join(root,result.htmlPath)],{cwd:root,stdio:'inherit'});
  console.log(JSON.stringify(result));
 }catch(error){console.error('Report harness blocked: '+error.message);process.exitCode=1;}
}
