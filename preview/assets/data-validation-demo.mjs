import fs from 'node:fs/promises';
const validate=rows=>{const issues=[],ids=new Set;for(const [i,r] of rows.entries()){if(!r.id)issues.push({row:i+1,code:'MISSING_ID'});else if(ids.has(r.id))issues.push({row:i+1,code:'DUPLICATE_ID'});ids.add(r.id);if(!Number.isInteger(r.cost)||r.cost<0)issues.push({row:i+1,code:'INVALID_COST'});if(typeof r.cooldown!=='number'||r.cooldown<0)issues.push({row:i+1,code:'INVALID_COOLDOWN'});if(!['Idle','Attack','Recover'].includes(r.nextState))issues.push({row:i+1,code:'UNKNOWN_STATE'});}return issues};
const clean=[{id:'slash',cost:3,cooldown:1,nextState:'Recover'},{id:'dash',cost:2,cooldown:2,nextState:'Idle'}];
const broken=[{id:'slash',cost:3,cooldown:1,nextState:'Recover'},{id:'slash',cost:-2,cooldown:-1,nextState:'Flying'},{id:'',cost:1.5,cooldown:1,nextState:'Idle'}];
const result={executedAt:new Date().toISOString(),environment:process.version,scope:'인공 예제 JSON 검증. Unity 실행 및 AI 도구 간 생산성 비교는 수행하지 않음.',cleanErrors:validate(clean),brokenErrors:validate(broken),expectedBrokenErrors:6};
if(result.cleanErrors.length||result.brokenErrors.length!==6)throw Error('Unexpected fixture result');
await fs.writeFile(new URL('./validation-result.json',import.meta.url),JSON.stringify(result,null,2));console.log(JSON.stringify(result));
