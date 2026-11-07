import fs from 'node:fs/promises';
import {validateLanguageReview} from './validate-language-review.mjs';
import {checkReportHarness} from './check-report-harness.mjs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
export const destinations=[{guild:'1488793489800957966',channel:'1565894418156879942'},{guild:'1346955649132527707',channel:'1566098427052298342'}];
export async function loadBotToken(root){
 if(process.env.DISCORD_BOT_TOKEN?.trim())return process.env.DISCORD_BOT_TOKEN.trim();
 const env=await fs.readFile(path.join(root,'.env'),'utf8');
 const match=env.match(/^\s*(?:export\s+)?DISCORD_BOT_TOKEN\s*=\s*(.*?)\s*$/m);
 const token=match?.[1]?.replace(/^(['"])(.*)\1$/,'$2').trim();
 if(!token||!/^[-\w.]+$/.test(token))throw Error('로컬 .env의 DISCORD_BOT_TOKEN에 기존 봇 토큰을 등록해야 합니다.');
 return token;
}
export async function verifyDeliveryHarness({root,issueDate,checker=checkReportHarness}){
 if(issueDate<'2026-11-07')return;
 const file=path.join(root,'reports','weekly-'+issueDate+'.html');
 const pipeline=JSON.parse((await fs.readFile(file+'.pipeline.json','utf8')).replace(/^\uFEFF/,''));
 const runId=pipeline.runId;if(!/^[a-z0-9][a-z0-9-]{0,63}$/.test(runId||''))throw Error('전송 검수 실행 ID가 유효하지 않습니다.');
 const contextPath=path.join(root,'_workspace','harness','weekly-game-report',runId,'context.json');
 const context=JSON.parse((await fs.readFile(contextPath,'utf8')).replace(/^\uFEFF/,''));
 if(!/^[a-f0-9]{40}$/i.test(context.instructionRevision||''))throw Error('전송 검수 지침 리비전이 없습니다.');
 const result=await checker({root,runId,revision:context.instructionRevision});
 if(result.status!=='ready'||result.issueDate!==issueDate||result.htmlPath!=='reports/weekly-'+issueDate+'.html')throw Error('전송 검수 결과가 이번호와 일치하지 않습니다.');
 return result;
}
export async function deliver({token,root,issueDate,summary,checkOnly=false,fetcher=fetch}){
 const api=async(route,options={})=>{
  const response=await fetcher('https://discord.com/api/v10'+route,{...options,headers:{Authorization:'Bot '+token,'Content-Type':'application/json'},signal:AbortSignal.timeout(30000)});
  if(!response.ok)throw Error('Discord HTTP '+response.status+' ('+route+')');
  return response.json();
 };
 const identity=await api('/users/@me');if(identity.id!=='1565897943184310342'||identity.bot!==true)throw Error('지정한 Game Trend Report 봇이 아닙니다.');
 const results=[];
 for(const target of destinations){
  try{
   const channel=await api('/channels/'+target.channel);if(channel.guild_id!==target.guild)throw Error('대상 서버가 일치하지 않습니다.');
   if(checkOnly){results.push({channel:target.channel,status:'verified'});continue;}
   const receipt=path.join(root,'private','delivery',issueDate+'.'+target.channel+'.sent.json');await fs.mkdir(path.dirname(receipt),{recursive:true});
   try{const old=JSON.parse(await fs.readFile(receipt,'utf8'));if(old.status==='sent'){results.push({channel:target.channel,status:'already_sent',messageId:old.messageId});continue;}throw Error('이전 전송 결과가 불확실합니다. 채널과 pending 기록을 확인해야 합니다.');}catch(error){if(error.code!=='ENOENT')throw error;}
   await fs.writeFile(receipt,JSON.stringify({status:'pending',channel:target.channel,issueDate,startedAt:new Date().toISOString()}),{flag:'wx',mode:0o600});
   const message=await api('/channels/'+target.channel+'/messages',{method:'POST',body:JSON.stringify({content:summary,allowed_mentions:{parse:[]}})});
   if(message.author?.id!==identity.id||message.channel_id!==target.channel||!message.id)throw Error('응답이 지정 봇과 채널을 확인해 주지 않습니다.');
   await fs.writeFile(receipt,JSON.stringify({status:'sent',channel:target.channel,issueDate,messageId:message.id,sentAt:message.timestamp}),{mode:0o600});
   results.push({channel:target.channel,status:'sent',messageId:message.id});
  }catch(error){results.push({channel:target.channel,status:'blocked',reason:error.message});}
 }
 return results;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{
  const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),args=process.argv.slice(2),checkOnly=args.length===1&&args[0]==='--check';
  if(!checkOnly&&(args.length!==2||args[0]!=='--send'||!/^\d{4}-\d{2}-\d{2}$/.test(args[1])))throw Error('Usage: node workflows/discord-delivery.mjs --check | --send YYYY-MM-DD');
  const token=await loadBotToken(root);let issueDate=args[1],summary;
  if(!checkOnly){
   const file=path.join(root,'reports','weekly-'+issueDate+'.html');
   execFileSync(process.execPath,[path.join(root,'workflows/validate-issue.mjs'),file],{stdio:'inherit'});
   await verifyDeliveryHarness({root,issueDate});
   const languageReview=JSON.parse((await fs.readFile(file+'.language-review.json','utf8')).replace(/^\uFEFF/,''));
   await validateLanguageReview({htmlPath:file,html:await fs.readFile(file,'utf8'),reportDate:issueDate,review:languageReview});
   const local=await fs.readFile(file,'utf8'),urls=['https://rnjsxogus0705.github.io/game-trend-report/reports/weekly-'+issueDate+'.html','https://game-trend-report.vercel.app/reports/weekly-'+issueDate+'.html'];
   for(const url of urls){const response=await fetch(url,{signal:AbortSignal.timeout(30000)});if(!response.ok||(await response.text()).replaceAll('\r\n','\n')!==local.replaceAll('\r\n','\n'))throw Error('공개 본문이 검수된 호와 다릅니다.');}
   summary=(await fs.readFile(file+'.summary.txt','utf8')).trim();if(summary.length<10||summary.length>1200)throw Error('전송 요약 길이가 잘못됐습니다.');summary+='\n'+urls.join('\n');
  }
  const results=await deliver({token,root,issueDate,summary,checkOnly});console.log(JSON.stringify(results));if(results.some(r=>r.status==='blocked'))process.exitCode=1;
 }catch(error){console.error(error.message);process.exitCode=1;}
}
