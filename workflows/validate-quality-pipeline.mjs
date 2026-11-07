import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {validateLayoutContract} from './audit-report-quality.mjs';
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
export async function validateQualityPipeline({root,htmlPath,html,issueDate}){
 if(issueDate<'2026-11-07')return;
 validateLayoutContract(html);
 const receipt=JSON.parse((await fs.readFile(htmlPath+'.pipeline.json','utf8')).replace(/^\uFEFF/,''));
 if(receipt.schemaVersion!==1||receipt.issueDate!==issueDate||receipt.htmlSha256!==hash(html)||!/^[a-z0-9][a-z0-9-]{0,63}$/.test(receipt.runId||''))throw Error('Quality pipeline receipt is missing or stale');
 if(!/^[a-f0-9]{64}$/.test(receipt.summarySha256||'')||hash(await fs.readFile(htmlPath+'.summary.txt'))!==receipt.summarySha256)throw Error('Quality summary is missing or changed');
 const expected='_workspace/harness/weekly-game-report/'+receipt.runId+'/ledger-snapshot.json';
 if(receipt.snapshotPath!==expected)throw Error('Unsafe quality snapshot path');
 let ledgerRoot=root;
 try{await fs.access(path.join(ledgerRoot,'workflows/report-ledger.py'));}catch{ledgerRoot=path.join(root,'site');await fs.access(path.join(ledgerRoot,'workflows/report-ledger.py'));}
 const snapshotPath=path.join(ledgerRoot,expected),real=await fs.realpath(snapshotPath);
 if(!real.startsWith(await fs.realpath(ledgerRoot)+path.sep)||hash(await fs.readFile(real))!==receipt.snapshotSha256)throw Error('Quality snapshot changed or escaped repository');
 const canonicalHtml=path.join(ledgerRoot,'reports',path.basename(htmlPath));
 if(hash(await fs.readFile(canonicalHtml))!==hash(html))throw Error('Operating report differs from the reviewed repository file');
 const executable=process.platform==='win32'?'py':'python3';
 const args=[...(process.platform==='win32'?['-3']:[]),'-X','utf8',path.join(ledgerRoot,'workflows/report-ledger.py'),'--db',path.join(ledgerRoot,'_workspace/weekly-game-report.sqlite3'),'check','--run',receipt.runId,'--html',canonicalHtml,'--snapshot',real,'--json'];
 let result;
 try{result=JSON.parse(execFileSync(executable,args,{cwd:ledgerRoot,encoding:'utf8',timeout:30000}));}catch(error){throw Error('SQLite quality gate blocked: '+(error.stdout?.toString().trim()||error.message));}
 if(result.status!=='passed'||result.issueDate!==issueDate)throw Error('SQLite quality gate did not pass');
 return result;
}
