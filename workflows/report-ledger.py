#!/usr/bin/env python3
"""Private, evidence-linked research ledger for weekly reports."""
import argparse
import datetime
import hashlib
from html.parser import HTMLParser
import json
from pathlib import Path
import re
import sqlite3
import sys
import unicodedata
import math
import os
import struct
import zlib
from urllib.parse import urlsplit, urlunsplit, parse_qsl, urlencode, unquote


def digest(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


class PresentationAssets(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.assets=[]
        self.styles=[]
        self.in_style=False
        self.seen_main=False
        self.header_depth=0
        self.header=[]
        self.shell=[]
        self.skip_depth=0

    def handle_starttag(self, tag, attrs):
        attrs=dict(attrs)
        void=tag in ('area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr')
        if self.skip_depth:
            if not void: self.skip_depth+=1
        elif tag=='section' or (tag=='div' and attrs.get('id')=='issue-summary'):
            self.skip_depth=1
        else:
            self.shell.append(['start',tag,sorted(attrs.items())])
        if tag=='main': self.seen_main=True
        if tag=='header' and not self.seen_main: self.header_depth+=1
        if self.header_depth: self.header.append(self.get_starttag_text())
        if tag=='style': self.in_style=True
        if tag=='link' and 'stylesheet' in attrs.get('rel','').lower().split() and attrs.get('href'): self.assets.append(attrs['href'])
        if tag=='script' and attrs.get('src'): self.assets.append(attrs['src'])

    def handle_endtag(self,tag):
        if self.skip_depth: self.skip_depth-=1
        else: self.shell.append(['end',tag])
        if self.header_depth: self.header.append('</'+tag+'>')
        if tag=='header' and self.header_depth: self.header_depth-=1
        if tag=='style': self.in_style=False

    def handle_data(self,data):
        if self.header_depth: self.header.append(data)
        if self.in_style: self.styles.append(data)


def presentation_hash(html_path):
    file=Path(html_path).resolve(); parser=PresentationAssets(); parser.feed(file.read_text(encoding='utf8'))
    assets=[]
    for url in parser.assets:
        parts=urlsplit(url)
        if parts.scheme or parts.netloc or url.startswith('//'):
            assets.append({'url':url})
        else:
            if not parts.path: raise ValueError('Empty local presentation asset')
            target=(file.parent/parts.path).resolve() if not parts.path.startswith('/') else None
            if target is None: raise ValueError('Root-relative presentation asset requires explicit resolution')
            assets.append({'url':url,'sha256':digest(target)})
    data=json.dumps({'assets':assets,'styles':parser.styles,'header':parser.header,'shell':parser.shell},ensure_ascii=False,sort_keys=True,separators=(',',':'))
    return hashlib.sha256(data.encode('utf8')).hexdigest()


def section_hash(path, section_id):
    parser=Sections(); parser.feed(Path(path).read_text(encoding='utf8'))
    matches=[s for s in parser.sections if s['id']==section_id]
    if len(matches)!=1: raise ValueError('Missing or duplicate HTML section')
    return hashlib.sha256(''.join(matches[0]['markup']).encode()).hexdigest()


def canonical_url(url):
    parts=urlsplit(url)
    query=urlencode(sorted((k,v) for k,v in parse_qsl(parts.query,keep_blank_values=True) if not k.startswith('utm_')))
    return urlunsplit((parts.scheme.lower(),parts.netloc.lower(),parts.path.rstrip('/'),query,''))


def normalized_text(document):
    return re.sub(r'\s+',' ',str(document.get('text') or document.get('body') or '')).strip().casefold()


def identity(value):
    return unicodedata.normalize('NFKC',nonempty(value)).casefold()


class AssetLinks(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True); self.links=[]
    def handle_starttag(self,tag,attrs):
        values=dict(attrs)
        for key in ('href','src'):
            if values.get(key): self.links.append(values[key])


class ReaderContent(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.text=[]
        self.attributes=[]
        self.code=[]
        self.code_stack=[]

    def handle_starttag(self,tag,attrs):
        if tag in ('pre','code'):
            entry=[]; self.code.append(entry); self.code_stack.append((tag,entry))
        if tag in ('p','div','li','tr','th','td','h1','h2','h3','h4','h5','h6','figcaption','caption','pre'):
            self.text.append(' ')
        for name,value in attrs:
            if name in ('href','src','alt','aria-label'):
                self.attributes.append([name,value])

    def handle_endtag(self,tag):
        if self.code_stack and self.code_stack[-1][0]==tag: self.code_stack.pop()
        if tag in ('p','div','li','tr','th','td','h1','h2','h3','h4','h5','h6','figcaption','caption','pre'):
            self.text.append(' ')

    def handle_data(self,data):
        self.text.append(data)
        for _,entry in self.code_stack: entry.append(data)


def reader_hash(path, section_id):
    parser=Sections(); parser.feed(Path(path).read_text(encoding='utf8'))
    matches=[s for s in parser.sections if s['id']==section_id]
    if len(matches)!=1: raise ValueError('Missing or duplicate HTML section')
    reader=ReaderContent(); reader.feed(''.join(matches[0]['markup']))
    value={'text':re.sub(r'\s+',' ',''.join(reader.text)).strip(),'attributes':reader.attributes,'code':[''.join(entry) for entry in reader.code]}
    return hashlib.sha256(json.dumps(value,ensure_ascii=False,separators=(',',':')).encode()).hexdigest()


def nonempty(value):
    if not isinstance(value, str) or not value.strip():
        raise ValueError('A nonempty value is required')
    return value.strip()


class Sections(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.sections = []
        self.current = None
        self.depth = 0
        self.container = None

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if self.current is None and ((tag == 'section' and attrs.get('id')) or (tag == 'div' and attrs.get('id') == 'issue-summary')):
            self.current = {'id': attrs['id'], 'text': [], 'urls': [], 'markup': []}
            self.container=tag; self.depth=1
        elif self.current and tag == self.container:
            self.depth += 1
        if self.current:
            self.current['markup'].append(self.get_starttag_text())
            for name in ('href', 'src'):
                if attrs.get(name, '').startswith('https://'):
                    self.current['urls'].append(attrs[name])

    def handle_endtag(self, tag):
        if self.current: self.current['markup'].append('</'+tag+'>')
        if self.current and tag == self.container:
            self.depth -= 1
            if self.depth == 0 and self.current:
                self.current['text'] = ' '.join(self.current['text']).strip()
                self.sections.append(self.current)
                self.current = None

    def handle_data(self, data):
        if self.current:
            self.current['markup'].append(data)
            if data.strip(): self.current['text'].append(data.strip())


def main():
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter, epilog="""
주간 제작 순서:
  init → ingest → prepare → 독립 approve-research 및 record-skill
  → approve-packet source/korean → draft → packet → 렌더러
  → approve-section content/korean/ui → advance → snapshot → check
  섹션은 독립적으로 병렬 제작하되 최종 check는 모든 섹션 승인을 요구합니다.
  오류는 record-failure로 남기며 뒤 단계는 재승인 전까지 차단됩니다.

입력 JSON 계약:
  ingest: sources 배열은 uri를 가진 실제 조사 기록입니다. renewalCorpus가 있으면
    sections와 supplementalSections의 sectionId·candidate를 해당 패킷과 대조합니다.
  prepare/draft: text 또는 body, HTTPS urls 배열, 렌더용 candidate 객체를 사용합니다.
    candidate의 lead, paragraphs, sourceLabels, table, practice, media, cardTexts,
    copyPrompts, imageReplacements, downloadArtifacts 등은 렌더러 계약을 따릅니다. 출처는 원장에
    결속하며 미완성 검수 상태를 공개 문장에 넣지 않습니다.
    lead는 기본 접힘에서도 보이는 판단 요약입니다. practice는 heading/body/constraint를
    사용하며, 복사 가능한 실제 AI 요청문은 prompt에 넣습니다. prompt가 없으면
    복사 버튼을 만들지 않습니다. table은 caption/columns/동일 길이 rows로 구성합니다.
    game-ideas/ai-production의 copyPrompts는 카드 제목별 승인 Markdown의 실제 요청문
    세 개를 담습니다. imageReplacements는 검수한 공개 로컬 이미지 src의 대체 경로입니다.
  검수 evidence: observation, sources 배열, section, reviewedPacketHash가 필요합니다.
    연구 검수는 observation과 sources를 사용합니다. pre-korean은 changes 또는
    noChangeReason, content는 claimChecks[{claim,sourceUrl,status}], duplicateFinding,
    mediaFinding을 기록합니다. claim sourceUrl은 조사 원장과 packet.urls에 있어야 합니다.
    외부 사실이 없는 editorial_proposal과 빈 packet.urls는 독립 검수자의
    noExternalClaimsReason을 남기면 빈 sources와 claimChecks를 허용합니다.
  UI evidence: 위 공통 항목과 mediaFinding, widths [320,390,768,1440], checks의
    layout/typography/responsive/accessibility/media, uiEvidence를 기록합니다.
    루트 DESIGN.md가 있으면 designContractSha256에 해당 파일의 SHA-256을 기록합니다.
    폭마다 실제 PNG의 path, sha256, width, viewportHeight, devicePixelRatio를 남깁니다.
    JSON/TXT는 보조 증거이며 PNG의 크기·구조와 해시를 검사합니다.
  실패 evidence: observation과 findingReason. 재승인은 새 증거에 해당 실패의
    resolvesFailureEventId, correction, recheck를 기록해야 합니다.

store-receipt는 실제 최종 검수·배포·전송 JSON의 바이트와 hash를 이력에 보관합니다.
승인이나 전송으로 해석하지 않으며 기존 snapshot 게이트를 변경하지 않습니다.
history는 연구·패킷·검수·영수증 이력과 과거 공개 HTML/텍스트 첨부를 조회합니다.
history --summary는 본문을 제외하고 경로·해시·이벤트 메타데이터만 조회합니다.
queue --run은 현재 섹션별 실제 검수 상태만 간결히 조회합니다.
import-html은 과거 호를 미검수 상태로 보관하고 duplicates는 URL·영상 ID·정확한
본문 일치 후보를 표시합니다. 의미 중복과 실제 조사·검수 수행은 독립 확인합니다.
명령별 옵션은 각 하위 명령의 --help를 확인하세요.
""")
    p.add_argument('--db', default='_workspace/weekly-game-report.sqlite3')
    sub = p.add_subparsers(dest='command', required=True)
    sub.add_parser('init')
    ingest = sub.add_parser('ingest')
    for key in ('run', 'issue-date', 'research', 'author'):
        ingest.add_argument('--'+key, required=True)
    imp = sub.add_parser('import-html')
    for key in ('run', 'issue-date', 'html'):
        imp.add_argument('--'+key, required=True)
    for command in ('prepare','draft'):
        draft = sub.add_parser(command)
        for key in ('run', 'section', 'packet', 'author', 'media-note'):
            draft.add_argument('--'+key, required=True)
    receipt=sub.add_parser('store-receipt')
    for key in ('run','file','actor'):
        receipt.add_argument('--'+key,required=True)
    receipt.add_argument('--kind',required=True,choices=['editorial-review','verification','ready','final-review','publication','delivery'])
    failure=sub.add_parser('record-failure')
    for key in ('run','section','reviewer','evidence'):
        failure.add_argument('--'+key,required=True)
    failure.add_argument('--kind',required=True,choices=['source','korean','content','ui'])
    pre=sub.add_parser('approve-packet')
    for key in ('run','section','reviewer','evidence'):
        pre.add_argument('--'+key,required=True)
    pre.add_argument('--kind',required=True,choices=['source','korean'])
    for cmd in ('approve-research', 'approve-section'):
        a = sub.add_parser(cmd)
        for key in ('run', 'reviewer', 'evidence'):
            a.add_argument('--'+key, required=True)
        if cmd == 'approve-section':
            a.add_argument('--section', required=True)
            a.add_argument('--kind', required=True, choices=['content', 'korean', 'ui'])
            a.add_argument('--html', required=True)
    skill = sub.add_parser('record-skill')
    for key in ('run', 'actor', 'phase', 'skill-path', 'action', 'evidence'):
        skill.add_argument('--'+key, required=True)
    for cmd in ('advance', 'duplicates', 'packet', 'approved-section'):
        a = sub.add_parser(cmd)
        a.add_argument('--run', required=True)
        a.add_argument('--section', required=True)
    for cmd in ('history', 'check', 'snapshot', 'queue'):
        a = sub.add_parser(cmd)
        a.add_argument('--run', required=True)
    sub.choices['snapshot'].add_argument('--output', required=True)
    sub.choices['history'].add_argument('--summary',action='store_true')
    sub.choices['check'].add_argument('--html', required=True)
    sub.choices['check'].add_argument('--json', action='store_true')
    sub.choices['check'].add_argument('--snapshot')
    sub.choices['check'].add_argument('--prior-dir', default='reports')
    a = p.parse_args()
    dbpath = Path(a.db)
    dbpath.parent.mkdir(parents=True, exist_ok=True)
    db = sqlite3.connect(dbpath, timeout=30)
    db.row_factory = sqlite3.Row
    db.execute('PRAGMA foreign_keys=ON')
    db.execute('PRAGMA journal_mode=WAL')
    db.executescript('''
    CREATE TABLE IF NOT EXISTS runs(id TEXT PRIMARY KEY, issue_date TEXT NOT NULL, author TEXT, research TEXT, research_hash TEXT);
    CREATE TABLE IF NOT EXISTS research_versions(run TEXT NOT NULL REFERENCES runs(id), hash TEXT NOT NULL, document TEXT NOT NULL, PRIMARY KEY(run,hash));
    CREATE TABLE IF NOT EXISTS materials(run TEXT NOT NULL REFERENCES runs(id), research_hash TEXT NOT NULL, ordinal INTEGER NOT NULL, data TEXT NOT NULL, PRIMARY KEY(run,research_hash,ordinal));
    CREATE TABLE IF NOT EXISTS sections(run TEXT NOT NULL REFERENCES runs(id), id TEXT NOT NULL, position INTEGER NOT NULL, packet TEXT, packet_hash TEXT, author TEXT, media_note TEXT, imported INTEGER NOT NULL DEFAULT 0, stage TEXT NOT NULL DEFAULT 'prepared', PRIMARY KEY(run,id));
    CREATE TABLE IF NOT EXISTS imports(run TEXT PRIMARY KEY REFERENCES runs(id), path TEXT NOT NULL, hash TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS archive_issues(run TEXT NOT NULL REFERENCES runs(id), hash TEXT NOT NULL, document TEXT NOT NULL, capturedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY(run,hash));
    CREATE TABLE IF NOT EXISTS archive_materials(run TEXT NOT NULL REFERENCES runs(id), issue_hash TEXT NOT NULL, relativePath TEXT NOT NULL, hash TEXT NOT NULL, document TEXT NOT NULL, capturedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY(run,issue_hash,relativePath,hash));
    CREATE TABLE IF NOT EXISTS receipt_records(run TEXT NOT NULL REFERENCES runs(id), kind TEXT NOT NULL, path TEXT NOT NULL, sha256 TEXT NOT NULL, document TEXT NOT NULL, actor TEXT NOT NULL, capturedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY(run,kind,path,sha256));
    CREATE TABLE IF NOT EXISTS packet_versions(run TEXT NOT NULL, section TEXT NOT NULL, hash TEXT NOT NULL, document TEXT NOT NULL, PRIMARY KEY(run,section,hash));
    CREATE TABLE IF NOT EXISTS events(id INTEGER PRIMARY KEY, run TEXT NOT NULL REFERENCES runs(id), section TEXT, kind TEXT NOT NULL, actor TEXT NOT NULL, metadata TEXT NOT NULL DEFAULT '{}', subject TEXT NOT NULL, hash TEXT NOT NULL, evidence TEXT NOT NULL, evidence_hash TEXT NOT NULL, created TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
    ''')

    if 'stage' not in {row['name'] for row in db.execute('PRAGMA table_info(sections)')}:
        with db: db.execute("ALTER TABLE sections ADD COLUMN stage TEXT NOT NULL DEFAULT 'prepared'")
    db.execute('CREATE UNIQUE INDEX IF NOT EXISTS sections_run_position_unique ON sections(run,position)')

    def validate_ui_evidence(proof):
        design=Path.cwd()/'DESIGN.md'
        if design.is_file() and proof.get('designContractSha256') != digest(design): raise ValueError('UI design contract hash missing or stale')
        mirror=Path.cwd()/'assets/report/DESIGN.md'
        if design.is_file() and mirror.is_file() and digest(mirror) != digest(design): raise ValueError('UI design contract mirror mismatch')
        checks=proof.get('checks',[])
        if not all(w in proof.get('widths',[]) for w in (320,390,768,1440)) or not all(k in checks for k in ('layout','typography','responsive','accessibility','media')) or not proof.get('uiEvidence'): raise ValueError('UI evidence and width coverage missing')
        evidence_root=(Path.cwd()/'_workspace/harness/weekly-game-report'/a.run/'evidence').resolve()
        covered=set()
        for item in proof['uiEvidence']:
            if not isinstance(item,dict) or not isinstance(item.get('path'),str) or not isinstance(item.get('sha256'),str): raise ValueError('UI evidence path/hash missing')
            target=Path(item['path']).resolve()
            if not target.is_relative_to(evidence_root) or target.suffix.lower() not in ('.png','.json','.txt') or digest(target) != item['sha256']: raise ValueError('UI evidence path or hash invalid')
            if target.suffix.lower()=='.png':
                width=item.get('width'); ratio=item.get('devicePixelRatio'); viewport_height=item.get('viewportHeight')
                if isinstance(width,bool) or width not in (320,390,768,1440) or isinstance(ratio,bool) or not isinstance(ratio,(int,float)) or not math.isfinite(ratio) or ratio<=0: raise ValueError('PNG viewport width and devicePixelRatio required')
                if isinstance(viewport_height,bool) or not isinstance(viewport_height,(int,float)) or not math.isfinite(viewport_height) or viewport_height<200: raise ValueError('PNG viewportHeight required and must be at least 200')
                raw=target.read_bytes()
                if len(raw)<33 or raw[:8]!=b'\x89PNG\r\n\x1a\n': raise ValueError('Invalid PNG signature')
                offset=8; seen_header=False; seen_data=False; seen_end=False; pixels=height=0
                while offset+12<=len(raw):
                    length=struct.unpack('>I',raw[offset:offset+4])[0]; end=offset+12+length
                    if end>len(raw): raise ValueError('Truncated PNG chunk')
                    chunk=raw[offset+4:offset+8]; data=raw[offset+8:offset+8+length]; checksum=struct.unpack('>I',raw[offset+8+length:end])[0]
                    if zlib.crc32(chunk+data)&0xffffffff != checksum: raise ValueError('Invalid PNG chunk CRC')
                    if not seen_header:
                        if chunk!=b'IHDR' or length!=13: raise ValueError('Invalid PNG IHDR')
                        pixels,height=struct.unpack('>II',data[:8]); seen_header=True
                    elif chunk==b'IHDR': raise ValueError('Duplicate PNG IHDR')
                    if chunk==b'IDAT': seen_data=True
                    if chunk==b'IEND':
                        if length or end!=len(raw): raise ValueError('Invalid PNG IEND')
                        seen_end=True; break
                    offset=end
                if not seen_data or not seen_end: raise ValueError('Incomplete PNG')
                if abs(pixels-width*ratio)>1 or abs(height-viewport_height*ratio)>1: raise ValueError('PNG pixel dimensions differ from viewport and DPR')
                covered.add(width)
        if covered != {320,390,768,1440}: raise ValueError('PNG evidence missing required viewport widths')

    def event(section, kind, actor, subject, hash_, evidence, metadata=None):
        actor=identity(actor); nonempty(subject); nonempty(evidence)
        proof=json.loads(Path(evidence).read_text(encoding='utf8'))
        if not isinstance(proof,dict) or not isinstance(proof.get('observation'),str) or not proof['observation'].strip(): raise ValueError('Evidence requires observation')
        if kind.endswith('-blocked') and (not isinstance(proof.get('findingReason'),str) or not proof['findingReason'].strip()): raise ValueError('Failure evidence requires findingReason')
        if kind in ('pre-source','pre-korean','content','korean','ui'):
            block_kind=kind.removeprefix('pre-')+'-blocked'
            latest=db.execute('SELECT * FROM events WHERE run=? AND section IS ? AND kind IN (?,?) ORDER BY id DESC LIMIT 1',(a.run,section,kind,block_kind)).fetchone()
            if latest and latest['kind']==block_kind:
                if proof.get('resolvesFailureEventId') != latest['id'] or not isinstance(proof.get('correction'),str) or not proof['correction'].strip() or not isinstance(proof.get('recheck'),str) or not proof['recheck'].strip(): raise ValueError('Failure requires correction and recheck tied to failure event')
                prior=db.execute('SELECT evidence_hash FROM events WHERE run=? AND section IS ? AND kind=? AND id<? ORDER BY id DESC LIMIT 1',(a.run,section,kind,latest['id'])).fetchone()
                if prior and prior['evidence_hash']==digest(evidence): raise ValueError('Prior successful evidence cannot clear failure')
        editorial_without_claims=False
        if kind in ('pre-source','pre-korean','content','korean','ui'):
            packet_record=db.execute('SELECT document FROM packet_versions WHERE run=? AND section=? AND hash=?',(a.run,section,hash_)).fetchone()
            if not packet_record: raise ValueError('Reviewed packet version missing')
            packet=json.loads(packet_record['document'])
            candidate=packet.get('candidate',packet)
            editorial_without_claims=(isinstance(candidate,dict) and candidate.get('kind')=='editorial_proposal' and packet.get('urls')==[] and isinstance(proof.get('noExternalClaimsReason'),str) and bool(proof['noExternalClaimsReason'].strip()))
        if kind in ('research','pre-source','pre-korean','content','korean','ui') and (not isinstance(proof.get('sources'),list) or (not proof['sources'] and not editorial_without_claims) or any(not isinstance(url,str) or not url.startswith('https://') for url in proof['sources'])): raise ValueError('Review evidence requires sources')
        if kind in ('research','pre-source','pre-korean','content','korean','ui'):
            record=db.execute('SELECT document FROM research_versions WHERE run=? AND hash=(SELECT research_hash FROM runs WHERE id=?)',(a.run,a.run)).fetchone()
            if not record: raise ValueError('Research document missing')
            research=json.loads(record['document']); allowed={item.get('uri') for item in research.get('sources',[]) if isinstance(item,dict)}
            if not set(proof['sources']).issubset(allowed): raise ValueError('Review source not in research ledger')
        if kind in ('pre-source','pre-korean','content','korean','ui') and proof.get('section') != section: raise ValueError('Evidence section mismatch')
        if kind in ('pre-source','pre-korean','content','korean','ui') and proof.get('reviewedPacketHash') != hash_: raise ValueError('Evidence must identify reviewed packet hash')
        if kind == 'pre-korean' and not (proof.get('changes') or str(proof.get('noChangeReason','')).strip()): raise ValueError('Korean correction evidence missing')
        if kind == 'content' and (not isinstance(proof.get('claimChecks'),list) or (not proof['claimChecks'] and not editorial_without_claims) or not str(proof.get('duplicateFinding','')).strip()): raise ValueError('Claim or duplicate finding missing')
        if kind == 'content':
            packet_record=db.execute('SELECT document FROM packet_versions WHERE run=? AND section=? AND hash=?',(a.run,section,hash_)).fetchone()
            if not packet_record: raise ValueError('Reviewed packet version missing')
            packet_urls=set(json.loads(packet_record['document']).get('urls',[]))
            for claim in proof['claimChecks']:
                if not isinstance(claim,dict) or not str(claim.get('claim','')).strip() or claim.get('status') not in ('verified','limited') or claim.get('sourceUrl') not in allowed or claim.get('sourceUrl') not in packet_urls: raise ValueError('Claim checks require claim, status and packet-linked source')
        if kind == 'ui': validate_ui_evidence(proof)
        if kind in ('content','ui') and not str(proof.get('mediaFinding','')).strip(): raise ValueError('Review evidence requires media finding')
        db.execute('INSERT INTO events(run,section,kind,actor,metadata,subject,hash,evidence,evidence_hash) VALUES(?,?,?,?,?,?,?,?,?)', (a.run, section, kind, actor, json.dumps(metadata or {},sort_keys=True), subject, hash_, evidence, digest(evidence)))

    def run():
        row = db.execute('SELECT * FROM runs WHERE id=?', (a.run,)).fetchone()
        if not row: raise ValueError('Unknown run')
        return row

    def section():
        row = db.execute('SELECT * FROM sections WHERE run=? AND id=?', (a.run, a.section)).fetchone()
        if not row: raise ValueError('Unknown section')
        return row

    def skills_digest():
        rows=db.execute("SELECT subject, hash FROM events WHERE run=? AND kind='skill' ORDER BY subject,id",(a.run,)).fetchall()
        latest={r['subject']:r['hash'] for r in rows}
        return hashlib.sha256(json.dumps(latest,sort_keys=True).encode()).hexdigest()

    def section_dependency_hash(section_id, packet_hash):
        current=run()
        packet_row=db.execute('SELECT document FROM packet_versions WHERE run=? AND section=? AND hash=?',(a.run,section_id,packet_hash)).fetchone()
        research_row=db.execute('SELECT document FROM research_versions WHERE run=? AND hash=?',(a.run,current['research_hash'])).fetchone()
        if not packet_row or not research_row: raise ValueError('Section dependency data missing')
        packet=json.loads(packet_row['document']); research=json.loads(research_row['document'])
        candidate=packet.get('candidate')
        corpus=research.get('renewalCorpus')
        if corpus is not None:
            entries=corpus.get('sections',[])+corpus.get('supplementalSections',[])
            matches=[entry for entry in entries if isinstance(entry,dict) and entry.get('sectionId')==section_id]
            if len(matches)!=1: raise ValueError('Section candidate missing from research corpus')
            candidate=matches[0].get('candidate')
        def urls(value):
            if isinstance(value,dict):
                for item in value.values(): yield from urls(item)
            elif isinstance(value,list):
                for item in value: yield from urls(item)
            elif isinstance(value,str):
                for match in re.findall(r'https://[^\s<>\"\']+',value): yield match.rstrip('.,;:!?)')
        referenced=set(packet.get('urls',[])) | set(urls(candidate))
        sources=research.get('sources',[])
        relevant={url:[source for source in sources if isinstance(source,dict) and source.get('uri')==url] for url in sorted(referenced)}
        inputs=research.get('inputs') if isinstance(research.get('inputs'),dict) else {}
        context_value=inputs.get('context')
        context_identity={'fullContext':context_value if isinstance(context_value,str) and re.fullmatch(r'[a-f0-9]{64}',context_value) else current['research_hash']}
        files=['instructions/REPORT-GUIDE.md','instructions/REPORT-OUTPUT-CONTRACT.md','instructions/KOREAN-EDITORIAL-POLICY.md','instructions/DESIGN.md','instructions/QUALITY-PIPELINE.md','instructions/FORMAT-REFERENCE.md','.agents/skills/weekly-game-report/references/report-format-reference.json','.codex/agents/report-content-reviewer.toml','.codex/agents/report-ui-reviewer.toml']
        context_path=Path.cwd()/'_workspace/harness/weekly-game-report'/a.run/'context.json'
        try:
            if digest(context_path)==inputs.get('context'):
                context=json.loads(context_path.read_text(encoding='utf8')); mapping=context.get('instructionFiles',{})
                if isinstance(mapping,dict) and all(isinstance(mapping.get(file),str) and re.fullmatch(r'[a-f0-9]{64}',mapping[file]) and digest(Path.cwd()/file)==mapping[file] for file in files):
                    context_identity={'contentContract':{file:mapping[file] for file in files}}
        except (OSError,ValueError,TypeError): pass
        value={'run':a.run,'issueDate':current['issue_date'],'instructionRevision':research.get('instructionRevision'),'context':context_identity,'sources':relevant,'candidate':candidate}
        return hashlib.sha256(json.dumps(value,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest()

    def dependency_valid(metadata, section_id, packet_hash):
        if 'dependency_hash' not in metadata: return metadata.get('research_hash') == run()['research_hash']
        return metadata['dependency_hash'] == section_dependency_hash(section_id,packet_hash)

    def valid_review(section_id, kind, hash_, author):
        failure_kind=kind.removeprefix('pre-')+'-blocked'
        rows = db.execute('SELECT * FROM events WHERE run=? AND section IS ? AND kind IN (?,?) ORDER BY id DESC', (a.run, section_id, kind, failure_kind)).fetchall()
        for row in rows[:1]:
            if row['kind'] != kind: return False
            try:
                if kind == 'ui': validate_ui_evidence(json.loads(Path(row['evidence']).read_text(encoding='utf8')))
                if row['hash'] == hash_ and row['actor'] != author and digest(row['evidence']) == row['evidence_hash'] and (kind == 'research' or (kind in ('pre-source','pre-korean') and dependency_valid(json.loads(row['metadata']),section_id,hash_) and json.loads(row['metadata']).get('skills_hash') == skills_digest()) or (Path(row['subject']).is_file() and ((kind in ('content','korean') and 'reader_hash' in json.loads(row['metadata']) and reader_hash(row['subject'],section_id) == json.loads(row['metadata'])['reader_hash']) or (not (kind in ('content','korean') and 'reader_hash' in json.loads(row['metadata'])) and section_hash(row['subject'],section_id) == json.loads(row['metadata'])['html_hash'])) and (kind != 'ui' or presentation_hash(row['subject']) == json.loads(row['metadata'])['presentation_hash']) and dependency_valid(json.loads(row['metadata']),section_id,hash_) and skills_digest() == json.loads(row['metadata'])['skills_hash'])):
                    return True
            except (OSError, IndexError, KeyError, ValueError):
                continue
        return False

    def issues(row):
        errors = []
        if not row['research'] or digest(row['research']) != row['research_hash'] or not valid_review(None, 'research', row['research_hash'], row['author']):
            errors.append('Research missing, changed, or not independently approved')
        skills = db.execute("SELECT * FROM events WHERE run=? AND kind='skill'", (a.run,)).fetchall()
        valid_skills=[s for s in skills if Path(s['subject']).is_file() and digest(s['subject']) == s['hash'] and Path(s['evidence']).is_file() and digest(s['evidence']) == s['evidence_hash']]
        required=('impeccable','humanizer','grammar-checker','style-guide','korean-humanizer','korean-spell-check')
        for name in required:
            if not any(Path(s['subject']).parent.name == name and Path(s['subject']).name == 'SKILL.md' for s in valid_skills): errors.append('Required skill evidence missing: '+name)
        return errors

    def validate_candidate(doc, research, section_id):
        candidate=doc.get('candidate')
        if candidate is None: return
        if not isinstance(candidate,dict): raise ValueError('Packet candidate must be an object')
        def nested_urls(value):
            if isinstance(value,dict):
                for item in value.values(): yield from nested_urls(item)
            elif isinstance(value,list):
                for item in value: yield from nested_urls(item)
            elif isinstance(value,str):
                for match in re.findall(r'https://[^\s<>\"\']+',value): yield match.rstrip('.,;:!?)')
        render_fields=[candidate.get('text'),candidate.get('lead'),candidate.get('limitation'),*(candidate.get('paragraphs') or [])]
        practice=candidate.get('practice')
        if isinstance(practice,dict): render_fields.extend([practice.get('heading'),practice.get('body'),practice.get('constraint'),practice.get('prompt')])
        tables=list(candidate.get('tables') or [])
        if isinstance(candidate.get('table'),dict): tables.append(candidate['table'])
        for table in tables:
            if isinstance(table,dict):
                render_fields.extend([table.get('caption'),*(table.get('columns') or [])])
                render_fields.extend(cell for row in table.get('rows',[]) if isinstance(row,list) for cell in row)
        for key in ('cardTexts','sourceLabels'):
            if isinstance(candidate.get(key),dict): render_fields.extend(candidate[key].values())
        if any(isinstance(value,str) and re.search(r'최종\s*한국어\s*및\s*독립\s*검수\s*필요',value) for value in render_fields):
            raise ValueError('Rendered candidate contains pending review status')
        urls=set(nested_urls(candidate))
        if candidate.get('kind')=='editorial_proposal' and doc.get('urls')==[] and urls:
            raise ValueError('Source-free editorial candidate contains external URL')
        corpus=research.get('renewalCorpus')
        if corpus is not None:
            if not isinstance(corpus,dict): raise ValueError('Invalid renewal corpus')
            entries=corpus.get('sections',[])+corpus.get('supplementalSections',[])
            matches=[entry for entry in entries if isinstance(entry,dict) and entry.get('sectionId')==section_id]
            if len(matches)!=1 or matches[0].get('candidate')!=candidate: raise ValueError('Candidate differs from authoritative research corpus')
        elif not urls.issubset(set(doc.get('urls',[]))):
            raise ValueError('Candidate URL is not linked to packet sources')

    def import_linked_text(html_file, issue_hash):
        root=Path.cwd().resolve(); parser=AssetLinks(); parser.feed(html_file.read_text(encoding='utf8'))
        stored=[]; skipped=[]
        for url in sorted(set(parser.links)):
            parts=urlsplit(url)
            if parts.scheme or parts.netloc or not parts.path: continue
            try:
                decoded=unquote(parts.path)
                if '\\' in decoded or '\x00' in decoded: raise ValueError('unsafe path')
                target=(root/decoded.lstrip('/') if decoded.startswith('/') else html_file.parent/decoded).resolve()
                if not target.is_relative_to(root): raise ValueError('outside root')
                rel=target.relative_to(root); chunks=rel.parts
                if not chunks or chunks[0] not in ('assets','reports') or any(part in ('private','_workspace','vendor') or part.startswith('.env') or part.startswith('.') for part in chunks): raise ValueError('private or outside public assets')
                if any(part.endswith(('.content-review.json','.language-review.json','.pipeline.json','.summary.txt','.published.json','.vercel-published.json','.sent.json')) for part in chunks): raise ValueError('private review')
                if target.suffix.lower() not in ('.json','.md','.js'): continue
                if not target.is_file() or target.stat().st_size>4*1024*1024: raise ValueError('missing or oversized')
                data=target.read_bytes(); content=data.decode('utf8'); checksum=hashlib.sha256(data).hexdigest()
                db.execute('INSERT OR IGNORE INTO archive_materials(run,issue_hash,relativePath,hash,document) VALUES(?,?,?,?,?)',(a.run,issue_hash,rel.as_posix(),checksum,content))
                stored.append(rel.as_posix())
            except (OSError,UnicodeError,ValueError) as exc:
                skipped.append({'url':url,'reason':str(exc)})
        return stored,skipped

    def duplicate_matches(section_row):
        if section_row['imported']:
            doc=json.loads(section_row['packet'])
        else:
            doc=json.loads(db.execute('SELECT document FROM packet_versions WHERE run=? AND section=? AND hash=?',(a.run,section_row['id'],section_row['packet_hash'])).fetchone()[0])
        urls={canonical_url(u) for u in doc.get('urls',[])}
        video=lambda u: (re.search(r'(?:[?&]v=|youtu\.be/|/embed/)([\w-]{11})',u) or [None,None])[1]
        def video_ids(value):
            found=set()
            if isinstance(value,dict):
                for key,item in value.items():
                    if key=='videoId' and isinstance(item,str) and re.fullmatch(r'[A-Za-z0-9_-]{11}',item): found.add(item)
                    found.update(video_ids(item))
            elif isinstance(value,list):
                for item in value: found.update(video_ids(item))
            elif isinstance(value,str):
                found.update(v for v in (video(u) for u in re.findall(r'https://[^\s<>\"\']+',value)) if v)
            return found
        ids=({video(u) for u in urls}-{None}) | video_ids(doc); matches=[]
        for peer in db.execute('SELECT sections.* FROM sections JOIN runs ON runs.id=sections.run WHERE (sections.imported=1 AND sections.run<>? AND runs.issue_date<?) OR (sections.run=? AND sections.id<>? AND sections.imported=0)',(a.run,run()['issue_date'],a.run,section_row['id'])):
            if peer['imported']: old=json.loads(peer['packet'])
            else:
                record=db.execute('SELECT document FROM packet_versions WHERE run=? AND section=? AND hash=?',(a.run,peer['id'],peer['packet_hash'])).fetchone()
                if not record: continue
                old=json.loads(record[0])
            oldurls={canonical_url(u) for u in old.get('urls',[])}
            common=urls & oldurls; common_ids=ids & ({video(u) for u in oldurls}-{None})
            same_text=bool(normalized_text(doc) and normalized_text(doc)==normalized_text(old))
            if common or common_ids or same_text: matches.append({'run':peer['run'],'section':peer['id'],'urls':sorted(common),'videoIds':sorted(common_ids),'sameText':same_text})
        query='SELECT m.* FROM archive_materials m JOIN imports i ON i.run=m.run AND i.hash=m.issue_hash JOIN runs r ON r.id=m.run WHERE m.run<>? AND r.issue_date<? AND m.rowid=(SELECT MAX(v.rowid) FROM archive_materials v WHERE v.run=m.run AND v.issue_hash=m.issue_hash AND v.relativePath=m.relativePath)'
        for material in db.execute(query,(a.run,run()['issue_date'])):
            text=material['document']; oldurls={canonical_url(u.rstrip('.,;:!?)')) for u in re.findall(r'https://[^\s<>\"\']+',text)}
            try: parsed=json.loads(text)
            except (ValueError,TypeError): parsed=None
            found=video_ids(parsed) if parsed is not None else set()
            found.update(v for v in (video(u) for u in oldurls) if v)
            common=urls & oldurls; common_ids=ids & found
            if common or common_ids: matches.append({'run':material['run'],'artifactPath':material['relativePath'],'source':'prior_public_attachment','urls':sorted(common),'videoIds':sorted(common_ids)})
        return matches

    def approved_section(item):
        if issues(run()): raise ValueError('Research or skill review is not current')
        if item['imported'] or item['stage']!='drafted' or not Path(item['packet']).is_file() or digest(item['packet'])!=item['packet_hash']: raise ValueError('Section packet is not current')
        for kind in ('pre-source','pre-korean','content','korean','ui'):
            if not valid_review(item['id'],kind,item['packet_hash'],item['author']): raise ValueError('Section approval missing or stale: '+kind)
        reviews={kind:db.execute('SELECT * FROM events WHERE run=? AND section=? AND kind=? ORDER BY id DESC LIMIT 1',(a.run,item['id'],kind)).fetchone() for kind in ('content','korean','ui')}
        if reviews['ui']['actor'] in (reviews['content']['actor'],reviews['korean']['actor']): raise ValueError('Section UI reviewer must be independent')
        if duplicate_matches(item):
            proof=json.loads(Path(reviews['content']['evidence']).read_text(encoding='utf8'))
            if not str(proof.get('repeatReason','')).strip(): raise ValueError('repeat reason missing')
        reader=reader_hash(reviews['ui']['subject'],item['id'])
        if any(reader_hash(reviews[kind]['subject'],item['id'])!=reader for kind in ('content','korean')): raise ValueError('Reviewed section reader content differs')
        ui=reviews['ui']
        return {'sectionId':item['id'],'packetSha':item['packet_hash'],'sectionSha':section_hash(ui['subject'],item['id']),'readerSha':reader,'presentationSha':presentation_hash(ui['subject']),'subjectFileSha':digest(ui['subject']),'currentPath':ui['subject'],'reviewIds':{k:v['id'] for k,v in reviews.items()},'evidenceHashes':{k:v['evidence_hash'] for k,v in reviews.items()}}

    with db:
        if a.command in ('prepare','draft'): db.execute('BEGIN IMMEDIATE')
        if a.command == 'init':
            result = {'status': 'initialized'}
        elif a.command in ('ingest', 'import-html'):
            datetime.date.fromisoformat(a.issue_date)
            nonempty(a.run)
            existing = db.execute('SELECT * FROM runs WHERE id=?', (a.run,)).fetchone()
            if existing and existing['issue_date'] != a.issue_date: raise ValueError('Run date mismatch')
            db.execute('INSERT OR IGNORE INTO runs(id,issue_date) VALUES(?,?)', (a.run,a.issue_date))
            if a.command == 'ingest':
                data = json.loads(Path(a.research).read_text(encoding='utf8'))
                if not isinstance(data.get('sources'), list) or not data['sources']: raise ValueError('Research sources missing')
                db.execute('UPDATE runs SET author=?,research=?,research_hash=? WHERE id=?', (identity(a.author),str(Path(a.research).resolve()),digest(a.research),a.run))
                db.execute('INSERT OR IGNORE INTO research_versions(run,hash,document) VALUES(?,?,?)',(a.run,digest(a.research),json.dumps(data,ensure_ascii=False,sort_keys=True)))
                db.executemany('INSERT OR IGNORE INTO materials(run,research_hash,ordinal,data) VALUES(?,?,?,?)', [(a.run,digest(a.research),i,json.dumps(source,ensure_ascii=False,sort_keys=True)) for i,source in enumerate(data['sources'])])
                result = {'sources': len(data['sources']), 'sha256': digest(a.research)}
            else:
                html_file=Path(a.html).resolve(); reports_root=(Path.cwd()/'reports').resolve()
                if not reports_root.is_relative_to(Path.cwd().resolve()) or not html_file.is_relative_to(reports_root) or html_file.name!='weekly-'+a.issue_date+'.html' or not html_file.is_file(): raise ValueError('Historical HTML must be a public report under reports with matching issue date')
                db.execute('INSERT INTO imports(run,path,hash) VALUES(?,?,?) ON CONFLICT(run) DO UPDATE SET path=excluded.path,hash=excluded.hash',(a.run,str(html_file),digest(html_file)))
                html_file=Path(a.html).resolve(); html_bytes=html_file.read_bytes(); html_text=html_bytes.decode('utf8'); issue_hash=hashlib.sha256(html_bytes).hexdigest()
                db.execute('INSERT OR IGNORE INTO archive_issues(run,hash,document) VALUES(?,?,?)',(a.run,issue_hash,html_text))
                archived,skipped=import_linked_text(html_file,issue_hash)
                parser = Sections(); parser.feed(html_text)
                if not parser.sections or len({s['id'] for s in parser.sections}) != len(parser.sections): raise ValueError('Missing or duplicate sections')
                if db.execute('SELECT 1 FROM sections WHERE run=? AND imported=0', (a.run,)).fetchone(): raise ValueError('Cannot import over active drafts')
                for pos, s in enumerate(parser.sections):
                    db.execute('INSERT INTO sections(run,id,position,packet,packet_hash,author,media_note,imported) VALUES(?,?,?,?,?,?,?,1) ON CONFLICT(run,id) DO UPDATE SET position=excluded.position,packet=excluded.packet,packet_hash=excluded.packet_hash', (a.run,s['id'],pos,json.dumps(s,ensure_ascii=False),hashlib.sha256(s['text'].encode()).hexdigest(),'historical','unreviewed import'))
                result = {'sections': len(parser.sections), 'archivedMaterials':archived, 'skippedLinks':skipped, 'status': 'historical-unreviewed'}
        elif a.command in ('prepare','draft'):
            r=run(); nonempty(a.media_note)
            if not r['research'] or digest(r['research']) != r['research_hash']: raise ValueError('Current research required for collection')
            if a.command == 'draft' and issues(r): raise ValueError('; '.join(issues(r)))
            packet = Path(a.packet).resolve(); payload=json.loads(packet.read_text(encoding='utf8'))
            if not isinstance(payload,dict) or not normalized_text(payload) or not isinstance(payload.get('urls'),list) or any(not isinstance(url,str) or not url.startswith('https://') for url in payload['urls']): raise ValueError('Packet requires text/body and HTTPS urls array')
            source_doc=json.loads(db.execute('SELECT document FROM research_versions WHERE run=? AND hash=?',(a.run,r['research_hash'])).fetchone()[0]); allowed={item.get('uri') for item in source_doc['sources'] if isinstance(item,dict)}
            if not set(payload['urls']).issubset(allowed): raise ValueError('Packet URL not in research ledger')
            validate_candidate(payload,source_doc,a.section)
            old = db.execute('SELECT position FROM sections WHERE run=? AND id=?',(a.run,a.section)).fetchone()

            if a.command == 'draft':
                if not old: raise ValueError('Prepare packet first')
                existing=section()
                if existing['packet_hash'] != digest(packet) or any(not valid_review(a.section,'pre-'+kind,digest(packet),identity(a.author)) for kind in ('source','korean')): raise ValueError('Packet source and Korean reviews required before draft')
            pos = old['position'] if old else db.execute('SELECT COALESCE(MAX(position),-1)+1 FROM sections WHERE run=?',(a.run,)).fetchone()[0]
            db.execute('INSERT INTO sections(run,id,position,packet,packet_hash,author,media_note,imported) VALUES(?,?,?,?,?,?,?,0) ON CONFLICT(run,id) DO UPDATE SET packet=excluded.packet,packet_hash=excluded.packet_hash,author=excluded.author,media_note=excluded.media_note,imported=0', (a.run,nonempty(a.section),pos,str(packet),digest(packet),identity(a.author),a.media_note))
            db.execute('INSERT OR IGNORE INTO packet_versions(run,section,hash,document) VALUES(?,?,?,?)',(a.run,a.section,digest(packet),packet.read_text(encoding='utf8')))
            db.execute('UPDATE sections SET stage=? WHERE run=? AND id=?',('drafted' if a.command=='draft' else 'prepared',a.run,a.section))
            result = {'section': a.section, 'sha256': digest(packet)}
        elif a.command == 'store-receipt':
            r=run(); root=Path.cwd().resolve(); given=Path(os.path.abspath(a.file)); target=given.resolve()
            if target!=given or not target.is_relative_to(root) or not target.is_file(): raise ValueError('Receipt must be a non-symlink regular file inside the repository')
            rel=target.relative_to(root).as_posix(); issue=r['issue_date']; run_id=a.run
            harness_prefix='_workspace/harness/weekly-game-report/'+run_id+'/'
            if a.kind in ('editorial-review','verification','ready','final-review'):
                allowed=rel==harness_prefix+a.kind+'.json'
            elif a.kind=='publication':
                allowed=rel in ('reports/weekly-'+issue+'.html.published.json','reports/weekly-'+issue+'.html.vercel-published.json')
            else:
                allowed=bool(re.fullmatch(r'private/delivery/'+re.escape(issue)+r'\.[0-9]+\.sent\.json',rel))
            if not allowed: raise ValueError('Receipt path is not allowed for kind and run')
            data=target.read_bytes()
            if len(data)>4*1024*1024: raise ValueError('Receipt exceeds size limit')
            document=data.decode('utf8'); obj=json.loads(document.removeprefix('\ufeff'))
            if not isinstance(obj,dict): raise ValueError('Receipt JSON must be an object')
            for key in ('runId','run_id'):
                if key in obj and obj[key]!=run_id: raise ValueError('Receipt run ID mismatch')
            for key in ('issueDate','issue_date','reportDate','report_date','date'):
                if key in obj and obj[key]!=issue: raise ValueError('Receipt date mismatch')
            checksum=hashlib.sha256(data).hexdigest()
            db.execute('INSERT OR IGNORE INTO receipt_records(run,kind,path,sha256,document,actor) VALUES(?,?,?,?,?,?)',(run_id,a.kind,rel,checksum,document,identity(a.actor)))
            result={'run':run_id,'kind':a.kind,'path':rel,'sha256':checksum,'status':'stored-not-approved'}
        elif a.command == 'record-failure':
            r=run(); s=section()
            if s['imported'] or not s['packet_hash']: raise ValueError('Current packet required for failure record')
            metadata={'research_hash':r['research_hash'],'packet_hash':s['packet_hash'],'stage':s['stage']}
            event(a.section,a.kind+'-blocked',a.reviewer,s['packet'],s['packet_hash'],a.evidence,metadata)
            result={'status':'blocked','section':a.section,'kind':a.kind}
        elif a.command == 'approve-packet':
            r=run(); s=section()
            if not valid_review(None,'research',r['research_hash'],r['author']): raise ValueError('Independent research approval required')
            if s['imported'] or identity(a.reviewer) == s['author'] or digest(s['packet']) != s['packet_hash']: raise ValueError('Packet stale or self reviewed')
            event(a.section,'pre-'+a.kind,a.reviewer,s['packet'],s['packet_hash'],a.evidence,{'research_hash':run()['research_hash'],'dependency_hash':section_dependency_hash(a.section,s['packet_hash']),'skills_hash':skills_digest()}); result={'status':'recorded'}
        elif a.command == 'approve-research':
            r = run()
            if not r['research'] or digest(r['research']) != r['research_hash'] or identity(a.reviewer) == r['author']: raise ValueError('Stale research or reviewer is author')
            event(None,'research',a.reviewer,r['research'],r['research_hash'],a.evidence); result = {'status':'recorded'}
        elif a.command == 'approve-section':
            r = run(); s = section()
            if issues(r): raise ValueError('; '.join(issues(r)))
            if s['imported'] or s['stage'] != 'drafted' or identity(a.reviewer) == s['author'] or digest(s['packet']) != s['packet_hash']: raise ValueError('Draft missing, stale, historical, or reviewer is author')
            if any(not valid_review(s['id'],'pre-'+kind,s['packet_hash'],s['author']) for kind in ('source','korean')): raise ValueError('Packet source and Korean reviews required')
            if a.kind == 'content' and duplicate_matches(s):
                proof=json.loads(Path(a.evidence).read_text(encoding='utf8'))
                if not str(proof.get('repeatReason','')).strip(): raise ValueError('repeat reason missing')
            if a.kind == 'ui' and db.execute("SELECT 1 FROM events WHERE run=? AND section=? AND kind IN ('content','korean') AND actor=?",(a.run,a.section,identity(a.reviewer))).fetchone(): raise ValueError('UI reviewer must be independent of content and Korean reviewers')
            if a.kind == 'ui' and any(not valid_review(s['id'],kind,s['packet_hash'],s['author']) for kind in ('content','korean')): raise ValueError('Content and Korean review must precede UI review')
            html=Path(a.html).resolve(); parser=Sections(); parser.feed(html.read_text(encoding='utf8'))
            if a.section not in [item['id'] for item in parser.sections]: raise ValueError('Section not present in HTML')
            event(a.section,a.kind,a.reviewer,str(html),s['packet_hash'],a.evidence,{'html_hash':section_hash(html,a.section),'research_hash':r['research_hash'],'dependency_hash':section_dependency_hash(a.section,s['packet_hash']),'skills_hash':skills_digest(), **({'presentation_hash':presentation_hash(html)} if a.kind=='ui' else {'reader_hash':reader_hash(html,a.section)})}); result = {'status':'recorded'}
        elif a.command == 'record-skill':
            run(); nonempty(a.phase); nonempty(a.action)
            skillpath=Path(a.skill_path).resolve(); allowed=[Path.home()/'.codex/skills',Path.home()/'.agents/skills',Path.home()/'.codex/plugins/cache',Path.cwd()/'.agents/skills']
            if skillpath.name != 'SKILL.md' or not any(skillpath.is_relative_to(root.resolve()) for root in allowed): raise ValueError('Skill must be an installed SKILL.md')
            header=skillpath.read_text(encoding='utf8').split('---',2)
            if len(header)<3 or not re.search(r'^name:\s*[\"\']?'+re.escape(skillpath.parent.name)+r'[\"\']?\s*$',header[1],re.M): raise ValueError('Skill identity mismatch')
            event(None,'skill',a.actor,str(Path(a.skill_path).resolve()),digest(a.skill_path),a.evidence,{'phase':a.phase,'action':a.action}); result = {'status':'recorded','action':a.action}
        elif a.command == 'packet':
            r=run(); s=section(); errors=issues(r)
            if s['imported'] or s['stage'] != 'drafted': errors.append('Section must be drafted')
            if not Path(s['packet']).is_file() or digest(s['packet']) != s['packet_hash']: errors.append('Packet file is missing or changed')
            for kind in ('source','korean'):
                if not valid_review(s['id'],'pre-'+kind,s['packet_hash'],s['author']): errors.append('Missing current packet '+kind+' review')
            stored=db.execute('SELECT document FROM packet_versions WHERE run=? AND section=? AND hash=?',(a.run,s['id'],s['packet_hash'])).fetchone()
            if not stored: errors.append('Stored packet is missing')
            if errors: raise ValueError('; '.join(errors))
            doc=json.loads(stored['document']); source_doc=json.loads(db.execute('SELECT document FROM research_versions WHERE run=? AND hash=?',(a.run,r['research_hash'])).fetchone()[0]); validate_candidate(doc,source_doc,s['id']); candidate=doc.get('candidate')
            if not isinstance(candidate,dict): raise ValueError('Packet candidate object is required for rendering')
            approvals={kind:db.execute("SELECT id FROM events WHERE run=? AND section=? AND kind=? ORDER BY id DESC LIMIT 1",(a.run,s['id'],'pre-'+kind)).fetchone()['id'] for kind in ('source','korean')}
            result={'sectionId':s['id'],'issueDate':r['issue_date'],'candidate':candidate,'reviewApproval':{'source':'passed','korean':'passed','packetSha256':s['packet_hash'],'eventIds':approvals}}
        elif a.command == 'approved-section':
            result=approved_section(section())
        elif a.command == 'queue':
            r=run()
            try: global_ready=not issues(r)
            except (OSError,ValueError): global_ready=False
            items=[]
            for item in db.execute('SELECT * FROM sections WHERE run=? ORDER BY position',(a.run,)):
                try: fresh=not item['imported'] and bool(item['packet']) and digest(item['packet'])==item['packet_hash']
                except OSError: fresh=False
                valid={kind:bool(global_ready and fresh and item['stage']=='drafted' and valid_review(item['id'],kind,item['packet_hash'],item['author'])) for kind in ('content','korean','ui')}
                valid_pre={kind:bool(global_ready and fresh and valid_review(item['id'],'pre-'+kind,item['packet_hash'],item['author'])) for kind in ('source','korean')}
                ready=all(valid.values()); stage='historical' if item['imported'] else ('complete' if ready else item['stage'])
                items.append({'sectionId':item['id'],'state':stage,'packetKey':item['packet_hash'],'preReview':valid_pre,'review':valid,'needsRepair':not ready})
            result={'run':a.run,'sections':items}
        elif a.command == 'duplicates':
            result={'matches':duplicate_matches(section()),'limitation':'Exact normalized matches only; review semantic duplicates independently.'}
        elif a.command in ('advance','check','snapshot','history'):
            r=run(); rows=[] if a.command=='history' and a.summary else db.execute('SELECT * FROM sections WHERE run=? ORDER BY position',(a.run,)).fetchall(); errors=[] if a.command=='history' else issues(r)
            if a.command=='history':
                if a.summary:
                    result={'run':a.run,'events':[dict(x) for x in db.execute('SELECT * FROM events WHERE run=? ORDER BY id',(a.run,))], 'research':[dict(x) for x in db.execute('SELECT hash FROM research_versions WHERE run=? ORDER BY rowid',(a.run,))], 'packets':[dict(x) for x in db.execute('SELECT section,hash FROM packet_versions WHERE run=? ORDER BY rowid',(a.run,))], 'sections':[dict(x) for x in db.execute('SELECT run,id,position,CASE WHEN imported=0 THEN packet ELSE NULL END AS packet,packet_hash,author,media_note,imported,stage FROM sections WHERE run=? ORDER BY position',(a.run,))], 'receipts':[dict(x) for x in db.execute('SELECT kind,path,sha256,actor,capturedAt FROM receipt_records WHERE run=? ORDER BY rowid',(a.run,))], 'archiveIssues':[dict(x) for x in db.execute('SELECT run,hash,capturedAt FROM archive_issues WHERE run=? ORDER BY rowid',(a.run,))], 'archiveMaterials':[dict(x) for x in db.execute('SELECT run,issue_hash,relativePath,hash,capturedAt FROM archive_materials WHERE run=? ORDER BY rowid',(a.run,))]}
                    print(json.dumps(result,ensure_ascii=False)); return 0
                result={'run':a.run,'events':[dict(x) for x in db.execute('SELECT * FROM events WHERE run=? ORDER BY id',(a.run,))], 'research':[dict(x) for x in db.execute('SELECT hash,document FROM research_versions WHERE run=? ORDER BY rowid',(a.run,))], 'packets':[dict(x) for x in db.execute('SELECT section,hash,document FROM packet_versions WHERE run=? ORDER BY rowid',(a.run,))], 'sections':[dict(x) for x in rows], 'receipts':[dict(x) for x in db.execute('SELECT kind,path,sha256,document,actor,capturedAt FROM receipt_records WHERE run=? ORDER BY rowid',(a.run,))], 'archiveIssues':[dict(x) for x in db.execute('SELECT * FROM archive_issues WHERE run=? ORDER BY rowid',(a.run,))], 'archiveMaterials':[dict(x) for x in db.execute('SELECT * FROM archive_materials WHERE run=? ORDER BY rowid',(a.run,))]}
                print(json.dumps(result,ensure_ascii=False)); return 0
            if a.command == 'advance':
                s=section(); rows=[s]
            for s in rows:
                if s['imported'] or s['stage'] != 'drafted': errors.append(s['id']+': section not drafted'); continue
                try: current=digest(s['packet'])
                except OSError: current='missing'
                if current != s['packet_hash']: errors.append(s['id']+': stale packet')
                if current != 'missing':
                    repeated=bool(duplicate_matches(s))
                    if repeated:
                        reviews=db.execute("SELECT evidence FROM events WHERE run=? AND section=? AND kind='content' AND hash=? ORDER BY id DESC LIMIT 1",(a.run,s['id'],current)).fetchone()
                        if not reviews or not valid_review(s['id'],'content',current,s['author']) or not str(json.loads(Path(reviews['evidence']).read_text(encoding='utf8')).get('repeatReason','')).strip(): errors.append(s['id']+': repeat reason missing')
                for kind in ('content','korean','ui'):
                    if not valid_review(s['id'],kind,current,s['author']): errors.append(s['id']+': missing '+kind+' review')
            if not rows: errors.append('No sections')
            if a.command == 'check':
                if Path(a.html).name != 'weekly-'+r['issue_date']+'.html': errors.append('HTML filename and issue date differ')
                parser=Sections(); parser.feed(Path(a.html).read_text(encoding='utf8'))
                for prior in Path(a.prior_dir).glob('weekly-????-??-??.html'):
                    day=prior.stem.removeprefix('weekly-')
                    try: datetime.date.fromisoformat(day)
                    except ValueError: continue
                    if day >= r['issue_date']: continue
                    imported=db.execute('SELECT i.hash FROM imports i JOIN runs r ON r.id=i.run WHERE r.issue_date=? AND i.path=?',(day,str(prior.resolve()))).fetchone()
                    if not imported or imported['hash']!=digest(prior): errors.append('Prior issue not imported or changed: '+str(prior))
                expected=[s['id'] for s in parser.sections]; required=['issue-summary','top10','game-ai-tools','github-trending','ai-trends','game-ai','ai-releases','techniques','games','reverse','ai-only-lab','ai-planning','game-ideas','ai-production','prototype','lab','careers','opportunities','reading','sources']
                if any(x not in expected for x in required) or [x for x in expected if x in required] != required: errors.append('Required canonical section coverage missing or out of order')
                actual=[s['id'] for s in rows]
                if len(expected)!=len(actual) or set(expected)!=set(actual): errors.append('HTML section coverage differs from ledger')
                for s in rows:
                    try:
                        approved=approved_section(s)
                        if section_hash(a.html,s['id'])!=approved['sectionSha'] or reader_hash(a.html,s['id'])!=approved['readerSha'] or presentation_hash(a.html)!=approved['presentationSha']: errors.append(s['id']+': assembled section differs from approved fragment')
                    except (OSError,ValueError,TypeError,KeyError) as exc: errors.append(s['id']+': '+str(exc))
            result={'run':a.run,'issueDate':r['issue_date'],'status':'blocked' if errors else 'passed','errors':errors,'events':[dict(x) for x in db.execute('SELECT * FROM events WHERE run=? ORDER BY id',(a.run,))]}
            if a.command == 'check' and a.snapshot:
                saved=json.loads(Path(a.snapshot).read_text(encoding='utf8'))
                if saved != result: errors.append('Snapshot does not match current ledger'); result['status']='blocked'
            if a.command == 'history':
                result['research']=[dict(x) for x in db.execute('SELECT hash,document FROM research_versions WHERE run=? ORDER BY rowid',(a.run,))]
                result['packets']=[dict(x) for x in db.execute('SELECT section,hash,document FROM packet_versions WHERE run=? ORDER BY rowid',(a.run,))]
                result['sections']=[dict(x) for x in db.execute('SELECT * FROM sections WHERE run=? ORDER BY position',(a.run,))]
            if a.command == 'snapshot': Path(a.output).write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
            if a.command in ('advance','check'):
                result={'run':a.run,'issueDate':r['issue_date'],'status':'blocked' if errors else 'passed','errors':errors,'eventCount':len(result['events'])}
                if errors: print(json.dumps(result,ensure_ascii=False)); return 1
        print(json.dumps(result,ensure_ascii=False))
    return 0


if __name__ == '__main__':
    try: sys.exit(main())
    except (ValueError, OSError, sqlite3.Error, json.JSONDecodeError) as exc:
        print(str(exc), file=sys.stderr); sys.exit(1)
