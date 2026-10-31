import {validateWeeklyPresentation} from './validate-weekly-presentation.mjs';
import {validateLanguageReview} from './validate-language-review.mjs';
import fs from 'node:fs/promises';import path from 'node:path';import crypto from 'node:crypto';
const file=path.resolve(process.argv[2]||''),html=await fs.readFile(file,'utf8'),review=JSON.parse((await fs.readFile(file+'.content-review.json','utf8')).replace(/^\uFEFF/,''));
const sections=['brief','ai-only-lab','games','ai-trends','ai-planning','game-ai','ai-releases','techniques','github-trending','game-ai-tools','careers','reverse','prototype','opportunities','sources'];
if((html.match(/class="top-ten-item"/g)||[]).length!==10||!html.includes('id="top10"'))throw Error('Expected exactly ten prioritized items at the top');
if(!html.includes('id="reading"'))throw Error('Missing Korean reading and video section');
if(!html.includes('id="game-ideas"')||(html.match(/data-copy-idea="/g)||[]).length!==3)throw Error('Expected three copyable idea drafts');
if((html.match(/class="game-dossier"/g)||[]).length<1)throw Error('Missing linked game evidence and analysis');
const grouped=html.includes('data-report-part="overview"');
const ordered=grouped?['issue-summary','top10','game-ai-tools','github-trending','ai-trends','game-ai','ai-releases','techniques','games','reverse','ai-only-lab','ai-planning','game-ideas','ai-production','prototype','lab','careers','opportunities','reading','sources']:['top10','github-trending','game-ai-tools','ai-only-lab','games','game-ideas','ai-production','reading'];
const priority=ordered.map(id=>html.indexOf('id="'+id+'"'));if(priority.some(p=>p<0)||priority.some((p,i)=>i>0&&p<priority[i-1]))throw Error('Report sections do not follow the declared category order');
if(review.reportDate>='2026-11-07'){
 validateWeeklyPresentation(html,{reportDate:review.reportDate});
 const quality=review.qualityReview;
 if(!quality||!/^([a-f0-9]{40})$/i.test(quality.instructionRevision||'')||typeof quality.editor!=='string'||!quality.editor.trim()||typeof quality.reviewer!=='string'||!quality.reviewer.trim()||quality.editor.trim()===quality.reviewer.trim())throw Error('Missing quality review instruction revision or independent reviewer');
 if(!Array.isArray(quality.blockingFindings)||quality.blockingFindings.length)throw Error('Quality review has unresolved blocking findings');
 const criteria=quality.criteria;
 if(!Array.isArray(criteria)||new Set(criteria.map(item=>item?.id)).size!==criteria.length)throw Error('Quality review criteria must be unique');
 for(const id of ['research','overseas','selection','practice','visuals','media','layout','korean','files']){
  const item=criteria.find(item=>item?.id===id);
  if(!item||!['passed','limited'].includes(item.status)||typeof item.evidence!=='string'||!item.evidence.trim()||(item.status==='limited'&&(typeof item.limitation!=='string'||!item.limitation.trim())))throw Error('Missing quality review evidence or limitation: '+id);
 }

}
for(const kind of ['article','video','post'])if(!html.includes('data-kind="'+kind+'"'))throw Error('Missing resource category: '+kind);
if(review.schemaVersion!==2||review.sha256!==crypto.createHash('sha256').update(html).digest('hex'))throw Error('Content review does not match this report');
if(review.reportDate>='2026-10-31'){
 const skill=review.coverage?.find(c=>c.category==='agent-skills');
 if(!html.includes('id="agent-skills"')||!html.includes('href="#agent-skills"')||!review.sections?.includes('agent-skills')||!skill||!['updated','no_material_change','unverified'].includes(skill.status)||!skill.sourceUrls?.length||!skill.limitation)throw Error('Missing visible game-development Agent Skills research and coverage');
 if(skill.status==='updated'&&!html.includes('data-agent-skill="'))throw Error('Updated skills research requires identifiable candidates');
 const observation='../assets/report/research/agent-skills-'+review.reportDate+'.json';
 if(!html.includes(observation))throw Error('Missing issue-specific Agent Skills observation data');
}
if(!file.endsWith('weekly-'+review.reportDate+'.html'))throw Error('Report date mismatch');
if(review.reportDate>='2026-11-07'){const languageReview=JSON.parse((await fs.readFile(file+'.language-review.json','utf8')).replace(/^\uFEFF/,''));await validateLanguageReview({htmlPath:file,html,reportDate:review.reportDate,review:languageReview});}
const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);if(new Set(ids).size!==ids.length)throw Error('Duplicate DOM IDs');
for(const id of sections)if(!ids.includes(id)||!review.sections.includes(id))throw Error('Missing required section: '+id);
for(const key of ['sourcesVerified','releaseStatesChecked','aiScopeSeparated','hotnessEvidenceChecked','jobsSampleDisclosed','techniqueReproducibilityReviewed','mobileChecked','shareChecked'])if(review.checks[key]!==true)throw Error('Editorial or UI check missing: '+key);
// A first issue can document that comparison is unavailable; never certify a comparison that was not performed.
if(review.checks.previousIssueCompared!==true){
 const comparison=review.previousIssueComparison;
 if(review.checks.previousIssueCompared!==false||comparison?.status!=='not_comparable'||comparison.scope!=='first_issue'||!Object.hasOwn(comparison,'priorIssue')||comparison.priorIssue!==null||typeof comparison.reason!=='string'||!comparison.reason.trim()||typeof comparison.evidence!=='string'||!comparison.evidence.trim()||!html.includes('전주 비교 자료가 없어'))throw Error('Previous issue comparison evidence missing');
 const directory=path.dirname(file),parent=path.dirname(directory);
 const locations=new Set([directory,path.join(parent,'site/reports')]);
 if(path.basename(parent)==='site')locations.add(path.join(parent,'../reports'));
 for(const location of locations){
  let names;try{names=await fs.readdir(location);}catch(error){if(error.code==='ENOENT')continue;throw error;}
  for(const name of names){const date=name.match(/^weekly-(\d{4}-\d{2}-\d{2})\.html$/)?.[1];if(!date)continue;const parsed=Date.parse(date+'T00:00:00Z');if(!Number.isFinite(parsed)||new Date(parsed).toISOString().slice(0,10)!==date)throw Error('Invalid prior issue date');if(date<review.reportDate)throw Error('Earlier weekly issue exists; first-issue exception rejected');}
 }
}
for(const category of ['ai-only-lab','games','ai-trends','ai-planning','game-ai','ai-releases','techniques','github-trending','game-ai-tools','careers','opportunities']){const c=review.coverage?.find(c=>c.category===category);if(!c||!['updated','no_material_change','unverified'].includes(c.status)||!c.sourceUrls?.length||c.sourceUrls.some(u=>!u.startsWith('https://')))throw Error('Missing research coverage: '+category);if(c.status==='unverified'&&!c.limitation)throw Error('Missing limitation: '+category);}
for(const [,url]of html.matchAll(/(?:href|src)="([^"]+)"/g)){if(url.startsWith('#')){if(!ids.includes(url.slice(1)))throw Error('Broken anchor: '+url);}else if(!/^(https?:|data:|mailto:)/.test(url)){const assetUrl=url.split(/[?#]/)[0];const localIssueAsset=/\.(?:md|js|json)$/.test(assetUrl)&&!assetUrl.includes('..');const local=path.resolve(path.dirname(file),assetUrl);try{await fs.access(local);}catch(error){if(error.code!=='ENOENT'||localIssueAsset)throw error;await fs.access(path.resolve(path.dirname(file),'../site/reports',assetUrl));}}}
if(review.reportDate>='2026-11-02'&&html.includes('src="../assets/report/report.js"'))throw Error('Use an issue-specific chart script instead of the example data script');
console.log('Content contract, review hash, coverage, section links and local assets verified.');

if(!html.includes('data-ai-case=')||!html.includes('data-ai-resource="video"')||!html.includes('data-ai-skill=')||!html.includes('data-copy-workflow=')||!html.includes('ai-workflow.md'))throw Error('Missing AI-centered games, Korean resources, skills or reusable workflow');

if(html.includes('class="game-dossier tool-research-card"')){const cards=(html.match(/class="game-dossier tool-research-card"/g)||[]).length;if(!html.includes('id="tool-choice"')||!html.includes('id="tool-goal"')||(html.match(/class="tool-media"/g)||[]).length!==cards||(html.match(/data-compare-goals="/g)||[]).length!==cards)throw Error('Tool cards require matching previews, comparison rows and a choice filter');}

if(!html.includes('id="ai-production"')||(html.match(/data-copy-ai-plan="/g)||[]).length!==3)throw Error('Missing separate AI production ideas and workflows');
