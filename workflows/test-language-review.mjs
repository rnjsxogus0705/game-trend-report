import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import {validateLanguageReview} from './validate-language-review.mjs';

const hash = text => crypto.createHash('sha256').update(text).digest('hex');
async function fixture(t) {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'language-review-'));
  t.after(() => fs.rm(dir, {recursive:true, force:true}));
  const reportDate = '2026-11-07', name = `weekly-${reportDate}.html`, md = `weekly-${reportDate}-ai-plan-01.md`;
  const htmlPath = path.join(dir, name), html = '<section id="top10"></section><section class="chapter" id="game-ai-tools"><div id="agent-skills"></div></section>', markdown = '계획 문서';
  await fs.writeFile(htmlPath, html);
  await fs.writeFile(path.join(dir, md), markdown);
  const review = {naturalnessReview:{editor:'편집자', reviewer:'검수자', coverage:['body','headings','tables','captions','collapsed','copy','downloads','terms'], sectionIdsReviewed:['top10','game-ai-tools','agent-skills'], changes:[], fileHashes:{[name]:hash(html), [md]:hash(markdown)}, externalVerified:false, externalScope:'', method:'문맥 검토'}};
  return {htmlPath, html, reportDate, review, name, md};
}

test('검수 범위와 최종 파일이 일치하면 통과', async t => {await validateLanguageReview(await fixture(t));});
test('같은 편집자와 검수자는 거부', async t => {const f=await fixture(t);f.review.naturalnessReview.reviewer=f.review.naturalnessReview.editor;await assert.rejects(validateLanguageReview(f), /distinct/);});
test('변경된 HTML 해시는 거부', async t => {const f=await fixture(t);f.review.naturalnessReview.fileHashes[f.name]='0'.repeat(64);await assert.rejects(validateLanguageReview(f), /hash mismatch/);});
test('해당 호 Markdown 해시 누락은 거부', async t => {const f=await fixture(t);delete f.review.naturalnessReview.fileHashes[f.md];await assert.rejects(validateLanguageReview(f), /Missing language review file hash/);});
test('누락된 검수 범위와 섹션은 거부', async t => {const f=await fixture(t);f.review.naturalnessReview.coverage.pop();await assert.rejects(validateLanguageReview(f), /coverage/);f.review.naturalnessReview.coverage.push('terms');f.review.naturalnessReview.sectionIdsReviewed.pop();await assert.rejects(validateLanguageReview(f), /section coverage/);});
test('경로 이탈과 다른 호 파일은 거부', async t => {const f=await fixture(t);f.review.naturalnessReview.fileHashes['../secret.md']='0'.repeat(64);await assert.rejects(validateLanguageReview(f), /path/);delete f.review.naturalnessReview.fileHashes['../secret.md'];f.review.naturalnessReview.fileHashes['weekly-2026-10-31-note.md']='0'.repeat(64);await assert.rejects(validateLanguageReview(f), /path/);});
test('외부 검사를 기록하면 범위가 필수', async t => {const f=await fixture(t);f.review.naturalnessReview.externalVerified=true;await assert.rejects(validateLanguageReview(f), /external scope/);});
