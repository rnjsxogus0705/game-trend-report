import {test} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs/promises';import os from 'node:os';import path from 'node:path';import {deliver,destinations,loadBotToken} from './discord-delivery.mjs';
async function fixture(t){const root=await fs.mkdtemp(path.join(os.tmpdir(),'gtr-discord-'));t.after(()=>fs.rm(root,{recursive:true,force:true}));return root;}
const response=data=>({ok:true,json:async()=>data});
test('두 채널 전송·채널별 중복 방지',async t=>{const root=await fixture(t);let posts=0;const fetcher=async(url,options)=>{if(url.endsWith('/users/@me'))return response({id:'1565897943184310342',bot:true});const target=destinations.find(d=>url.includes(d.channel));if(options.method==='POST'){posts++;return response({id:'test-'+posts,channel_id:target.channel,author:{id:'1565897943184310342'}});}return response({guild_id:target.guild});};const args={token:'fixture',root,issueDate:'2026-11-07',summary:'test',fetcher};assert.ok((await deliver(args)).every(r=>r.status==='sent'));assert.ok((await deliver(args)).every(r=>r.status==='already_sent'));assert.equal(posts,2);});
test('한 채널 실패가 다른 채널 성공을 취소하지 않음',async t=>{const root=await fixture(t);const fetcher=async(url,options)=>{if(url.endsWith('/users/@me'))return response({id:'1565897943184310342',bot:true});const target=destinations.find(d=>url.includes(d.channel));if(target===destinations[1])return{ok:false,status:403};return options.method==='POST'?response({id:'one',channel_id:target.channel,author:{id:'1565897943184310342'}}):response({guild_id:target.guild});};assert.deepEqual((await deliver({token:'fixture',root,issueDate:'2026-11-07',summary:'test',fetcher})).map(r=>r.status),['sent','blocked']);});
test('빈 .env 토큰은 전송 전에 차단',async t=>{if(process.env.DISCORD_BOT_TOKEN)return;const root=await fixture(t);await fs.writeFile(path.join(root,'.env'),'DISCORD_BOT_TOKEN=\n');await assert.rejects(loadBotToken(root),/기존 봇 토큰/);});
test('최종 검수 실패 시 Discord API에 접속하지 않는다',async t=>{
 const root=await fs.realpath(await fixture(t)),workflows=path.join(root,'workflows'),reports=path.join(root,'reports'),run='test-run';
 await fs.mkdir(workflows,{recursive:true});await fs.mkdir(reports,{recursive:true});
 await fs.mkdir(path.join(root,'_workspace/harness/weekly-game-report',run),{recursive:true});
 await fs.copyFile(new URL('./discord-delivery.mjs',import.meta.url),path.join(workflows,'discord-delivery.mjs'));
 await fs.writeFile(path.join(workflows,'validate-issue.mjs'),'');
 await fs.writeFile(path.join(workflows,'validate-language-review.mjs'),'export async function validateLanguageReview() {}');
 await fs.writeFile(path.join(workflows,'check-report-harness.mjs'),"export async function checkReportHarness(){throw Error('synthetic review failure')}");
 await fs.writeFile(path.join(reports,'weekly-2026-11-07.html.pipeline.json'),JSON.stringify({runId:run}));
 await fs.writeFile(path.join(root,'_workspace/harness/weekly-game-report',run,'context.json'),JSON.stringify({instructionRevision:'a'.repeat(40)}));
 const marker=path.join(root,'fetch-called'),preload=path.join(root,'preload.mjs');
 await fs.writeFile(preload,`import fs from 'node:fs'; globalThis.fetch=async()=>{fs.writeFileSync(${JSON.stringify(marker)},'called');throw Error('unexpected request')}`);
 const {spawnSync}=await import('node:child_process');
 const result=spawnSync(process.execPath,['--import',preload,path.join(workflows,'discord-delivery.mjs'),'--send','2026-11-07'],{encoding:'utf8',env:{...process.env,DISCORD_BOT_TOKEN:'fixture'}});
 assert.notEqual(result.status,0);assert.match(result.stderr,/synthetic review failure/);await assert.rejects(fs.access(marker),/ENOENT/);
});
