#!/usr/bin/env python3
"""Versioned private section-template index; templates never constitute approval."""
import argparse
import hashlib
import json
from pathlib import Path
import sqlite3
import subprocess
import sys

ROOT = Path(__file__).resolve().parent.parent
CATALOG = ROOT / '.agents/skills/weekly-game-report/references/section-templates.json'
DB = ROOT / '_workspace/weekly-game-report.sqlite3'

def sha(data):
    return hashlib.sha256(data).hexdigest()

def load_catalog(path):
    data = path.read_bytes()
    doc = json.loads(data)
    if doc.get('schemaVersion') != 1 or not isinstance(doc.get('sections'), list) or not doc['sections'] or not isinstance(doc.get('references'), list) or not doc['references']:
        raise ValueError('Invalid catalog schema')
    ids = [s.get('id') for s in doc['sections']]
    if any(not isinstance(x, str) or not x for x in ids) or len(set(ids)) != len(ids):
        raise ValueError('Missing or duplicate section ID')
    for ref in doc['references']:
        name, revision, expected = ref['path'], ref.get('gitRevision'), ref['sha256']
        if not isinstance(name, str) or name.startswith('/') or '..' in Path(name).parts:
            raise ValueError('Invalid reference path')
        if revision:
            if not all(c in '0123456789abcdef' for c in revision.lower()) or not 7 <= len(revision) <= 40:
                raise ValueError('Invalid reference revision')
            content = subprocess.check_output(['git', 'show', revision + ':' + name], cwd=ROOT)
        else:
            content = (ROOT / name).read_bytes()
        if sha(content) != expected:
            raise ValueError('Reference hash mismatch: ' + name)
    return data, doc

def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('--db',type=Path,default=DB)
    p.add_argument('--catalog',type=Path,default=CATALOG)
    sub=p.add_subparsers(dest='command',required=True)
    for name in ('import','check','list'): sub.add_parser(name)
    s=sub.add_parser('section'); s.add_argument('--id',required=True); s.add_argument('--run')
    a=p.parse_args()
    data,doc=load_catalog(a.catalog)
    key=sha(data)
    a.db.parent.mkdir(parents=True,exist_ok=True)
    db=sqlite3.connect(a.db,timeout=30)
    db.execute('PRAGMA foreign_keys=ON')
    db.executescript('''CREATE TABLE IF NOT EXISTS template_versions (hash TEXT PRIMARY KEY, document BLOB NOT NULL, created TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE IF NOT EXISTS template_sections (hash TEXT NOT NULL REFERENCES template_versions(hash), id TEXT NOT NULL, document TEXT NOT NULL, PRIMARY KEY(hash,id));''')
    if a.command=='import':
        with db:
            existing=db.execute('SELECT document FROM template_versions WHERE hash=?',(key,)).fetchone()
            if existing and bytes(existing[0])!=data: raise ValueError('Stored catalog differs')
            db.execute('INSERT OR IGNORE INTO template_versions(hash,document) VALUES(?,?)',(key,data))
            for section in doc['sections']:
                encoded=json.dumps(section,ensure_ascii=False,sort_keys=True,separators=(',',':'))
                old=db.execute('SELECT document FROM template_sections WHERE hash=? AND id=?',(key,section['id'])).fetchone()
                if old and old[0]!=encoded: raise ValueError('Stored section differs')
                db.execute('INSERT OR IGNORE INTO template_sections VALUES(?,?,?)',(key,section['id'],encoded))
    stored=db.execute('SELECT document FROM template_versions WHERE hash=?',(key,)).fetchone()
    if not stored or bytes(stored[0])!=data: raise ValueError('Catalog not imported or stored bytes changed')
    rows=db.execute('SELECT id,document FROM template_sections WHERE hash=?',(key,)).fetchall()
    expected={s['id']:json.dumps(s,ensure_ascii=False,sort_keys=True,separators=(',',':')) for s in doc['sections']}
    if dict(rows)!=expected: raise ValueError('Stored sections missing or changed')
    if a.command in ('import','check'):
        result={'catalogSha256':key,'sections':len(rows),'status':'verified'}
    elif a.command=='list':
        result={'catalogSha256':key,'sections':[{'id':s['id'],'group':s.get('group'),'lane':s.get('lane')} for s in doc['sections']]}
    else:
        if a.id not in expected: raise ValueError('Unknown section')
        result={'catalogSha256':key,'shared':doc.get('shared',{}),'references':doc['references'],'section':json.loads(expected[a.id]),'notice':'Template is not approval; research and review each issue anew.'}
        if a.run:
            # Reuse the canonical ledger gate, never infer approval from stored stage.
            output=subprocess.check_output([sys.executable,str(ROOT/'workflows/report-ledger.py'),'--db',str(a.db),'packet','--run',a.run,'--section',a.id],cwd=ROOT,text=True)
            result['approvedPacket']=json.loads(output)
    print(json.dumps(result,ensure_ascii=False))

if __name__=='__main__':
    try: main()
    except (ValueError,KeyError,OSError,sqlite3.Error,subprocess.CalledProcessError,json.JSONDecodeError) as exc:
        print(str(exc),file=sys.stderr); sys.exit(1)
