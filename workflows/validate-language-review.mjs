import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import {pathToFileURL} from 'node:url';

const coverageRequired = ['body','headings','tables','captions','collapsed','copy','downloads','terms'];
const nonempty = value => typeof value === 'string' && value.trim().length > 0;

export async function validateLanguageReview({htmlPath, html, reportDate, review}) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(reportDate) || path.basename(htmlPath) !== `weekly-${reportDate}.html`) throw Error('Language review report date or filename mismatch');
  const natural = review?.naturalnessReview;
  if (!natural || typeof natural !== 'object' || Array.isArray(natural)) throw Error('Missing naturalnessReview');
  if (!nonempty(natural.editor) || !nonempty(natural.reviewer) || natural.editor.trim() === natural.reviewer.trim()) throw Error('Editor and reviewer must be distinct nonempty identifiers');
  if (!Array.isArray(natural.coverage) || coverageRequired.some(value => !natural.coverage.includes(value))) throw Error('Language review coverage is incomplete');
  const sectionIds = [...html.matchAll(/<section\b[^>]*>/gi)].map(([tag]) => tag.match(/(?:^|\s)id\s*=\s*["']([^"']+)["']/i)?.[1]).filter(Boolean);
  if (/(?:^|\s)id\s*=\s*["']agent-skills["']/i.test(html)) sectionIds.push('agent-skills');
  if (!Array.isArray(natural.sectionIdsReviewed) || sectionIds.some(id => !natural.sectionIdsReviewed.includes(id))) throw Error('Language review section coverage is incomplete');
  if (!Array.isArray(natural.changes) || natural.changes.some(change => !change || !nonempty(change.path) || typeof change.before !== 'string' || typeof change.after !== 'string' || !nonempty(change.reason))) throw Error('Language review changes must include path, before, after and reason');
  if (typeof natural.externalVerified !== 'boolean' || (natural.externalVerified && !nonempty(natural.externalScope)) || !nonempty(natural.method)) throw Error('Language review external scope or method is missing');
  const hashes = natural.fileHashes;
  if (!hashes || typeof hashes !== 'object' || Array.isArray(hashes)) throw Error('Missing language review file hashes');
  const directory = path.dirname(htmlPath);
  const issuePrefix = `weekly-${reportDate}`;
  const issueFiles = (await fs.readdir(directory)).filter(name => name.startsWith(issuePrefix) && (name === `${issuePrefix}.md` || (name.startsWith(`${issuePrefix}-`) && name.endsWith('.md'))));
  const required = [path.basename(htmlPath), ...issueFiles];
  for (const name of Object.keys(hashes)) {
    if (name !== path.basename(name) || name.includes('\\') || !required.includes(name)) throw Error('Invalid or unrelated language review file path: ' + name);
  }
  for (const name of required) {
    if (typeof hashes[name] !== 'string' || !/^[a-f0-9]{64}$/i.test(hashes[name])) throw Error('Missing language review file hash: ' + name);
    const bytes = await fs.readFile(path.join(directory, name));
    if (crypto.createHash('sha256').update(bytes).digest('hex') !== hashes[name].toLowerCase()) throw Error('Language review file hash mismatch: ' + name);
    if (name === path.basename(htmlPath) && bytes.toString('utf8') !== html) throw Error('Language review HTML does not match the file');
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const htmlPath = path.resolve(process.argv[2] || '');
  const html = await fs.readFile(htmlPath, 'utf8');
  const review = JSON.parse((await fs.readFile(htmlPath + '.language-review.json', 'utf8')).replace(/^\uFEFF/, ''));
  const reportDate = path.basename(htmlPath).match(/^weekly-(\d{4}-\d{2}-\d{2})\.html$/)?.[1];
  await validateLanguageReview({htmlPath, html, reportDate, review});
  console.log('Language review structure, coverage and final file hashes verified; naturalness is not automatically assessed.');
}
