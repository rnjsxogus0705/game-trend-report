#!/usr/bin/env python3
"""Test-only synthetic receipts. Never use for research or publication."""
import hashlib
import importlib.util
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import struct
import zlib

def synthetic_png(width):
    def chunk(kind,data): return struct.pack('>I',len(data))+kind+data+struct.pack('>I',zlib.crc32(kind+data)&0xffffffff)
    return b'\x89PNG\r\n\x1a\n'+chunk(b'IHDR',struct.pack('>IIBBBBB',width,240,8,2,0,0,0))+chunk(b'IDAT',zlib.compress((b'\0'+b'\xff\xff\xff'*width)*240))+chunk(b'IEND',b'')

root=Path(sys.argv[1]).resolve(); html=Path(sys.argv[2]).resolve(); run='fixture-run'
if not root.is_relative_to(Path(tempfile.gettempdir()).resolve()) or any((p/'.git').exists() for p in (root,*root.parents)) or not (root/'.synthetic-report-test').is_file() or not html.is_relative_to(root):
    raise SystemExit('Fixture requires a marked temporary root outside any Git repository')
script=root/'workflows/report-ledger.py'; db=root/'_workspace/weekly-game-report.sqlite3'
spec=importlib.util.spec_from_file_location('ledger_fixture',script); module=importlib.util.module_from_spec(spec); spec.loader.exec_module(module)
parser=module.Sections(); parser.feed(html.read_text(encoding='utf8'))
issue_date=html.stem.removeprefix('weekly-'); evidence_dir=root/'_workspace/harness/weekly-game-report'/run/'evidence'; evidence_dir.mkdir(parents=True,exist_ok=True)
research=evidence_dir/'research.json'; research.write_text(json.dumps({'sources':[{'uri':'https://example.com/fixture'}]}))
general=evidence_dir/'general.json'; general.write_text(json.dumps({'observation':'synthetic test only','sources':['https://example.com/fixture']}))
def invoke(*args):
    subprocess.run([sys.executable,str(script),'--db',str(db),*args],cwd=root,check=True,stdout=subprocess.DEVNULL)
invoke('ingest','--run',run,'--issue-date',issue_date,'--research',str(research),'--author','fixture-author')
invoke('approve-research','--run',run,'--reviewer','fixture-editor','--evidence',str(general))
for name in ('impeccable','humanizer','grammar-checker','style-guide','korean-humanizer','korean-spell-check'):
    skill=root/'.agents/skills'/name/'SKILL.md'; skill.parent.mkdir(parents=True,exist_ok=True); skill.write_text('---\nname: '+name+'\ndescription: synthetic fixture\n---\n')
    invoke('record-skill','--run',run,'--actor','fixture','--phase','fixture','--skill-path',str(skill),'--action','fixture','--evidence',str(general))
for item in parser.sections:
    name=item['id']; packet=evidence_dir/(name+'-packet.json'); packet.write_text(json.dumps({'text':'fixture '+name,'urls':['https://example.com/fixture']}))
    observed=evidence_dir/(name+'-ui.txt'); observed.write_text('synthetic UI observation for '+name)
    images=[]
    for width in (320,390,768,1440):
        image=evidence_dir/(name+'-'+str(width)+'.png'); image.write_bytes(synthetic_png(width)); images.append({'path':str(image),'sha256':hashlib.sha256(image.read_bytes()).hexdigest(),'width':width,'viewportHeight':240,'devicePixelRatio':1})
    proof=evidence_dir/(name+'-review.json'); proof.write_text(json.dumps({'section':name,'observation':'synthetic '+name,'sources':['https://example.com/fixture'],'mediaFinding':'synthetic only','reviewedPacketHash':hashlib.sha256(packet.read_bytes()).hexdigest(),'noChangeReason':'synthetic','claimChecks':[{'claim':'fixture '+name,'sourceUrl':'https://example.com/fixture','status':'verified'}],'duplicateFinding':'synthetic','repeatReason':'synthetic fixture reference','widths':[320,390,768,1440],'checks':['layout','typography','responsive','accessibility','media'],'uiEvidence':images}))
    args=['--run',run,'--section',name,'--packet',str(packet),'--author','fixture-author','--media-note','synthetic']
    invoke('prepare',*args)
    for kind in ('source','korean'): invoke('approve-packet','--run',run,'--section',name,'--kind',kind,'--reviewer','fixture-editor','--evidence',str(proof))
    invoke('draft',*args)
    for kind in ('content','korean','ui'): invoke('approve-section','--run',run,'--section',name,'--kind',kind,'--reviewer','fixture-visual' if kind=='ui' else 'fixture-editor','--evidence',str(proof),'--html',str(html))
snapshot=evidence_dir.parent/'ledger-snapshot.json'; invoke('snapshot','--run',run,'--output',str(snapshot))
summary=Path(str(html)+'.summary.txt'); summary.write_text('합성 시험용 요약입니다. 실제 전송하지 않습니다.',encoding='utf8')
receipt={'summarySha256':hashlib.sha256(summary.read_bytes()).hexdigest(),'schemaVersion':1,'issueDate':issue_date,'runId':run,'htmlSha256':hashlib.sha256(html.read_bytes()).hexdigest(),'snapshotPath':'_workspace/harness/weekly-game-report/'+run+'/ledger-snapshot.json','snapshotSha256':hashlib.sha256(snapshot.read_bytes()).hexdigest()}
Path(str(html)+'.pipeline.json').write_text(json.dumps(receipt))
