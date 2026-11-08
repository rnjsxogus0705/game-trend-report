"""Section visual candidates remain versioned, queryable and unapproved."""
import concurrent.futures
import json
import hashlib
import importlib.util
import sqlite3
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

SCRIPT = Path(__file__).with_name('report-ledger.py')

class VisualLedgerTest(unittest.TestCase):
    def test_next_issue_ui_review_binds_generation_evidence_and_image(self):
        spec=importlib.util.spec_from_file_location('ledger_test_helpers',SCRIPT.with_name('test-report-ledger.py'))
        helpers=importlib.util.module_from_spec(spec); spec.loader.exec_module(helpers)
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp); db=root/'ledger.db'; helpers.install_test_skills(root)
            research=root/'research.json'; research.write_text(json.dumps({'sources':[{'uri':'https://example.com'}]}))
            evidence=root/'general.json'; evidence.write_text(json.dumps({'observation':'synthetic only','sources':['https://example.com']}))
            asset=root/'assets/report/test.webp'; asset.parent.mkdir(parents=True); asset.write_bytes(b'synthetic image')
            tool=root/'tool-output.txt'; tool.write_text('synthetic tool evidence, not a real generation')
            manifest=root/'generation.json'
            def checksum(p): return hashlib.sha256(p.read_bytes()).hexdigest()
            manifest.write_text(json.dumps({'generator':'image_gen','outputSha256':checksum(asset),'toolEvidencePath':str(tool),'toolEvidenceSha256':checksum(tool)}))
            visual={'title':'핵심 요약','points':['하나','둘'],'image':{'src':'../assets/report/test.webp','alt':'요약 그림','caption':'가상 예시','width':1200,'height':800,'generationEvidence':{'path':str(manifest),'sha256':checksum(manifest)}}}
            packet=root/'packet.json'; packet.write_text(json.dumps({'text':'본문','urls':['https://example.com'],'candidate':{'sectionVisual':visual}},ensure_ascii=False))
            html=root/'reports/issue.html'; html.parent.mkdir(); html.write_text('<section id="games"><img src="../assets/report/test.webp" alt="요약 그림"></section>')
            proof=root/'proof.json'; helpers.packet_evidence(proof,packet,html)
            def call(*args,ok=True):
                result=subprocess.run([sys.executable,str(SCRIPT),'--db',str(db),*args],cwd=root,text=True,capture_output=True)
                self.assertEqual(result.returncode==0,ok,result.stderr)
                return result
            call('ingest','--run','r','--issue-date','2026-11-14','--research',str(research),'--author','writer')
            call('approve-research','--run','r','--reviewer','reviewer','--evidence',str(evidence))
            for name in ('impeccable','humanizer','grammar-checker','style-guide','korean-humanizer','korean-spell-check'):
                call('record-skill','--run','r','--actor','writer','--phase','test','--skill-path',str(root/'.agents/skills'/name/'SKILL.md'),'--action','read','--evidence',str(evidence))
            args=['--run','r','--section','games','--packet',str(packet),'--author','writer','--media-note','synthetic']
            call('prepare',*args)
            for kind in ('source','korean'): call('approve-packet','--run','r','--section','games','--kind',kind,'--reviewer','reviewer','--evidence',str(proof))
            call('draft',*args)
            for kind in ('content','korean','ui'):
                call('approve-section','--run','r','--section','games','--kind',kind,'--reviewer','ui-reviewer' if kind=='ui' else 'reviewer','--evidence',str(proof),'--html',str(html))
            def approved(): return json.loads(call('queue','--run','r').stdout)['sections'][0]['review']['ui']
            self.assertTrue(approved())
            tool.write_text('tampered tool evidence'); self.assertFalse(approved())
            tool.write_text('synthetic tool evidence, not a real generation'); self.assertTrue(approved())
            manifest.write_text(manifest.read_text()+' '); self.assertFalse(approved())
            manifest.write_text(manifest.read_text().rstrip()); self.assertTrue(approved())
            asset.write_bytes(b'tampered image'); self.assertFalse(approved())
            asset.write_bytes(b'synthetic image'); self.assertTrue(approved())
            html.write_text('<section id="games"><p>no image</p></section>'); self.assertFalse(approved())

    def test_parallel_visual_ingestion_and_validation(self):
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp); db=root/'ledger.db'; research=root/'research.json'
            research.write_text(json.dumps({'sources':[{'uri':'https://example.com'}]}))
            def call(*args):
                return subprocess.run([sys.executable,str(SCRIPT),'--db',str(db),*args],cwd=root,text=True,capture_output=True)
            result=call('ingest','--run','r','--issue-date','2026-11-07','--research',str(research),'--author','author')
            self.assertEqual(result.returncode,0,result.stderr)
            def prepare(i):
                visual={'title':'핵심 요약','points':['첫 번째 내용','두 번째 내용'],
                        'image':{'src':'../assets/report/test.webp','alt':'요약 이미지','caption':'생성한 개념 그림','width':1200,'height':800}}
                packet=root/('packet-%s.json'%i)
                packet.write_text(json.dumps({'text':'본문','urls':['https://example.com'],'candidate':{'sectionVisual':visual}},ensure_ascii=False))
                return call('prepare','--run','r','--section','s%s'%i,'--packet',str(packet),'--author','author','--media-note','개념 그림')
            with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
                results=list(pool.map(prepare,range(22)))
            self.assertTrue(all(r.returncode==0 for r in results),[r.stderr for r in results if r.returncode])
            result=call('visuals','--run','r')
            self.assertEqual(result.returncode,0,result.stderr)
            data=json.loads(result.stdout); self.assertEqual(len(data['sections']),22)
            self.assertTrue(all(item['stage']=='prepared' and item['sectionVisual']['points']==['첫 번째 내용','두 번째 내용'] for item in data['sections']))
            self.assertIn('not review or approval',data['note'])
            filtered=json.loads(call('visuals','--run','r','--section','s1').stdout)
            self.assertEqual([item['sectionId'] for item in filtered['sections']],['s1'])
            packet=root/'bad.json'; packet.write_text(json.dumps({'text':'본문','urls':['https://example.com'],'candidate':{'sectionVisual':{'title':'요약','points':['하나'],'image':{'src':'x','alt':'a','caption':'c'}}}}))
            result=call('prepare','--run','r','--section','bad','--packet',str(packet),'--author','author','--media-note','검수 필요')
            self.assertNotEqual(result.returncode,0); self.assertIn('two or three points',result.stderr)
            # Cutover is based on the immutable run date, never an optional packet flag.
            result=call('ingest','--run','next','--issue-date','2026-11-14','--research',str(research),'--author','author')
            self.assertEqual(result.returncode,0,result.stderr)
            legacy=root/'legacy.json'; legacy.write_text(json.dumps({'text':'본문','urls':['https://example.com']}))
            def prepare_for(run,packet,section):
                return call('prepare','--run',run,'--section',section,'--packet',str(packet),'--author','author','--media-note','검수 필요')
            self.assertEqual(prepare_for('r',legacy,'legacy').returncode,0)
            rejected=prepare_for('next',legacy,'missing')
            self.assertNotEqual(rejected.returncode,0); self.assertIn('sectionVisual required',rejected.stderr)
            accepted=prepare_for('next',root/'packet-0.json','visual')
            self.assertEqual(accepted.returncode,0,accepted.stderr)
            # Previously prepared incomplete packets cannot bypass the new gate.
            payload=legacy.read_text(); sha=hashlib.sha256(legacy.read_bytes()).hexdigest()
            with sqlite3.connect(db) as con:
                con.execute("INSERT INTO sections(run,id,position,packet,packet_hash,author,media_note) VALUES(?,?,?,?,?,?,?)",('next','old-incomplete',7,str(legacy),sha,'author','legacy'))
                con.execute("INSERT INTO packet_versions(run,section,hash,document) VALUES(?,?,?,?)",('next','old-incomplete',sha,payload))
            proof=root/'review.json'; proof.write_text(json.dumps({'observation':'reviewed','sources':['https://example.com']}))
            self.assertEqual(call('approve-research','--run','next','--reviewer','reviewer','--evidence',str(proof)).returncode,0)
            result=call('approve-packet','--run','next','--section','old-incomplete','--kind','source','--reviewer','reviewer','--evidence',str(proof))
            self.assertNotEqual(result.returncode,0); self.assertIn('sectionVisual required',result.stderr)

if __name__ == '__main__': unittest.main()
