import fs from 'node:fs/promises';import path from 'node:path';import crypto from 'node:crypto';
const file=path.resolve(process.argv[2]||''),html=await fs.readFile(file,'utf8'),review=JSON.parse(await fs.readFile(file+'.content-review.json','utf8'));
const sections=['brief','ai-only-lab','games','ai-trends','ai-planning','game-ai','ai-releases','techniques','github-trending','game-ai-tools','careers','reverse','prototype','opportunities','sources'];
if((html.match(/class="top-ten-item"/g)||[]).length!==10||!html.includes('id="top10"'))throw Error('Expected exactly ten prioritized items at the top');
if(!html.includes('id="reading"'))throw Error('Missing Korean reading and video section');
if(!html.includes('id="game-ideas"')||(html.match(/data-copy-idea="/g)||[]).length!==3)throw Error('Expected three copyable idea drafts');
if((html.match(/class="game-dossier"/g)||[]).length<1)throw Error('Missing linked game evidence and analysis');
const priority=['top10','github-trending','game-ai-tools','ai-only-lab','games','game-ideas','reading'].map(id=>html.indexOf('id="'+id+'"'));if(priority.some(p=>p<0)||priority.some((p,i)=>i>0&&p<priority[i-1]))throw Error('Sections must follow the current TOP 10 / GitHub / tools priority');
for(const kind of ['article','video','post'])if(!html.includes('data-kind="'+kind+'"'))throw Error('Missing resource category: '+kind);
if(review.schemaVersion!==2||review.sha256!==crypto.createHash('sha256').update(html).digest('hex'))throw Error('Content review does not match this report');
if(!file.endsWith('weekly-'+review.reportDate+'.html'))throw Error('Report date mismatch');
const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);if(new Set(ids).size!==ids.length)throw Error('Duplicate DOM IDs');
for(const id of sections)if(!ids.includes(id)||!review.sections.includes(id))throw Error('Missing required section: '+id);
for(const key of ['sourcesVerified','releaseStatesChecked','aiScopeSeparated','hotnessEvidenceChecked','jobsSampleDisclosed','previousIssueCompared','techniqueReproducibilityReviewed','mobileChecked','shareChecked'])if(review.checks[key]!==true)throw Error('Editorial or UI check missing: '+key);
for(const category of ['ai-only-lab','games','ai-trends','ai-planning','game-ai','ai-releases','techniques','github-trending','game-ai-tools','careers','opportunities']){const c=review.coverage?.find(c=>c.category===category);if(!c||!['updated','no_material_change','unverified'].includes(c.status)||!c.sourceUrls?.length||c.sourceUrls.some(u=>!u.startsWith('https://')))throw Error('Missing research coverage: '+category);if(c.status==='unverified'&&!c.limitation)throw Error('Missing limitation: '+category);}
for(const [,url]of html.matchAll(/(?:href|src)="([^"]+)"/g)){if(url.startsWith('#')){if(!ids.includes(url.slice(1)))throw Error('Broken anchor: '+url);}else if(!/^(https?:|data:|mailto:)/.test(url)){const localIssueAsset=/\.(?:md|js|json)$/.test(url)&&!url.includes('..');await fs.access(path.resolve(localIssueAsset?path.dirname(file):'C:/내문서/GameTrendReport/site/reports',url));}}
if(review.reportDate>='2026-11-02'&&html.includes('src="../assets/report/report.js"'))throw Error('Use an issue-specific chart script instead of the example data script');
console.log('Content contract, review hash, coverage, section links and local assets verified.');

if(!html.includes('data-ai-case=')||!html.includes('data-ai-resource="video"')||!html.includes('data-ai-skill=')||!html.includes('data-copy-workflow=')||!html.includes('ai-workflow.md'))throw Error('Missing AI-centered games, Korean resources, skills or reusable workflow');
