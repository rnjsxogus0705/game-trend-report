import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {validateQualityPipeline} from './validate-quality-pipeline.mjs';
const html='<main class="content"><div id="issue-summary"><div class="issue-summary-layout"></div></div></main>';
test('적용 전 과거 호는 소급 인증을 요구하지 않는다',async()=>{
 await validateQualityPipeline({root:'/unused',htmlPath:'/unused',html:'',issueDate:'2026-10-31'});
});
test('새 호는 과거 영수증만으로 원장 검사를 건너뛸 수 없다',async t=>{
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'pipeline-'));t.after(()=>fs.rm(root,{recursive:true,force:true}));
 const file=path.join(root,'weekly-2026-11-07.html');
 await assert.rejects(validateQualityPipeline({root,htmlPath:file,html,issueDate:'2026-11-07'}),/ENOENT/);
 await fs.writeFile(file+'.pipeline.json',JSON.stringify({schemaVersion:1,issueDate:'2026-11-07',runId:'../escape',htmlSha256:'invalid'}));
 await assert.rejects(validateQualityPipeline({root,htmlPath:file,html,issueDate:'2026-11-07'}),/missing or stale/);
});
