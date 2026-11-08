import hashlib
import json
from pathlib import Path
import sqlite3
import subprocess
import sys
import tempfile
from concurrent.futures import ThreadPoolExecutor
import unittest

SCRIPT = Path(__file__).with_name('report-ledger.py')


class TimingTest(unittest.TestCase):
    def test_parallel_intervals_record_actual_bounds_failures_and_evidence(self):
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp); db=root/'ledger.sqlite'; evidence=root/'proof.txt'; evidence.write_text('observed result'); html=root/'weekly-2026-11-14.html'; html.write_text('<section id="one">본문</section>')
            def call(*args, ok=True):
                p=subprocess.run([sys.executable,str(SCRIPT),'--db',str(db),*args],cwd=root,text=True,capture_output=True)
                self.assertEqual(p.returncode==0,ok,p.stderr+p.stdout)
                return json.loads(p.stdout) if ok else p.stderr
            call('timing-start','--run','run','--issue-date','2026-11-14','--section','one','--phase','research','--actor','one',ok=False)
            call('timing-init','--run','../unsafe','--issue-date','2026-11-14',ok=False)
            call('timing-init','--run','run','--issue-date','2026-11-14')
            def start(section):
                return call('timing-start','--run','run','--issue-date','2026-11-14','--section',section,'--phase','research','--actor',section)
            with ThreadPoolExecutor(max_workers=4) as pool:
                starts=list(pool.map(start,['one','two','three','four']))
            research=root/'research.json'; research.write_text(json.dumps({'sources':[{'uri':'https://example.com'}]}))
            call('ingest','--run','run','--issue-date','2026-11-14','--research',str(research),'--author','author')
            self.assertEqual(len({x['id'] for x in starts}),4)
            report=call('timing-report','--run','run')
            self.assertEqual(report['summary']['running'],4); self.assertIsNone(report['summary']['wallSpanSeconds'])
            self.assertTrue(all(x['elapsedSeconds'] is None for x in report['intervals']))
            first=starts[0]
            base=['timing-finish','--run','run','--id',str(first['id']),'--actor','one','--status','failed','--finding','source unavailable','--evidence',str(evidence)]
            wrong=base.copy(); wrong[wrong.index('one')]='intruder'; self.assertIn('actor mismatch',call(*wrong,ok=False))
            result=call(*base); self.assertGreaterEqual(result['elapsedSeconds'],0)
            self.assertEqual(result['evidenceSha256'],hashlib.sha256(evidence.read_bytes()).hexdigest())
            self.assertIn('already finished',call(*base,ok=False))
            def finish(row):
                return call('timing-finish','--run','run','--id',str(row['id']),'--actor',row['actor'],'--status','completed','--finding','checked')
            with ThreadPoolExecutor(max_workers=3) as pool:
                list(pool.map(finish,starts[1:]))
            report=call('timing-report','--run','run')
            self.assertEqual((report['summary']['failed'],report['summary']['completed'],report['summary']['running']),(1,3,0))
            self.assertIsNotNone(report['summary']['wallSpanSeconds'])
            self.assertTrue(next(x for x in report['intervals'] if x['id']==first['id'])['evidenceCurrent'])
            evidence.write_text('changed')
            self.assertFalse(call('timing-report','--run','run','--section','one')['intervals'][0]['evidenceCurrent'])
            with sqlite3.connect(db) as conn: conn.execute("INSERT INTO sections(run,id,position) VALUES('run','one',0)")
            self.assertIn('unresolvedFailureIds',call('timing-close','--run','run','--html',str(html),ok=False))
            related=call('timing-start','--run','run','--issue-date','2026-11-14','--section','one','--phase','correction','--actor','editor','--related-id',str(first['id']))
            self.assertEqual(related['relatedId'],first['id'])
            self.assertEqual(next(x for x in call('timing-report','--run','run','--section','one')['intervals'] if x['id']==related['id'])['related_id'],first['id'])
            self.assertIn(first['id'],call('timing-report','--run','run')['summary']['unresolvedFailureIds'])
            call('timing-close','--run','run','--html',str(html),ok=False)
            call('timing-finish','--run','run','--id',str(related['id']),'--actor','editor','--status','completed','--finding','수정')
            recheck=call('timing-start','--run','run','--issue-date','2026-11-14','--section','one','--phase','change-review','--actor','reviewer','--related-id',str(related['id']))
            call('timing-finish','--run','run','--id',str(recheck['id']),'--actor','reviewer','--status','completed','--finding','재검토')
            self.assertNotIn(first['id'],call('timing-report','--run','run')['summary']['unresolvedFailureIds'])
            call('timing-start','--run','run','--issue-date','2026-11-14','--section','two','--phase','review','--actor','editor','--related-id',str(first['id']),ok=False)
            self.assertIn('not evidence',report['note'])
            call('timing-start','--run','run','--issue-date','2026-11-15','--section','one','--phase','review','--actor','one',ok=False)
            self.assertEqual(call('timing-report','--run','run')['summary']['missingCompletedPhases']['one'],['image','production','research','review'])
            self.assertIn('coverage incomplete',call('timing-close','--run','run','--html',str(html),ok=False))
            html.write_text('<section id="one">본문</section><section id="missing">누락</section>')
            self.assertIn('coverage differs',call('timing-close','--run','run','--html',str(html),ok=False))
            html.write_text('<section id="one">본문</section>')
            for phase in ('research','image','production','review'):
                interval=call('timing-start','--run','run','--issue-date','2026-11-14','--section','one','--phase',phase,'--actor','editor')
                call('timing-finish','--run','run','--id',str(interval['id']),'--actor','editor','--status','completed','--finding','완료')
            closed=call('timing-close','--run','run','--html',str(html)); self.assertGreaterEqual(closed['elapsedSeconds'],0)
            self.assertEqual(closed['htmlSha256'],hashlib.sha256(html.read_bytes()).hexdigest())
            self.assertIsNotNone(call('timing-report','--run','run')['summary']['runElapsedSeconds'])
            self.assertTrue(call('timing-report','--run','run')['summary']['closedHtmlCurrent'])
            html.write_text('<section id="one">변경</section>')
            self.assertFalse(call('timing-report','--run','run')['summary']['closedHtmlCurrent'])
            call('timing-close','--run','run','--html',str(html),ok=False)
            call('timing-start','--run','run','--issue-date','2026-11-14','--section','one','--phase','review','--actor','one',ok=False)

    def test_clock_reversal_does_not_finish_interval(self):
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp); db=root/'ledger.sqlite'
            def call(*args): return subprocess.run([sys.executable,str(SCRIPT),'--db',str(db),*args],cwd=root,text=True,capture_output=True)
            self.assertEqual(call('timing-init','--run','run','--issue-date','2026-11-14').returncode,0)
            start=call('timing-start','--run','run','--issue-date','2026-11-14','--section','games','--phase','image','--actor','author')
            self.assertEqual(start.returncode,0,start.stderr); ident=json.loads(start.stdout)['id']
            with sqlite3.connect(db) as conn: conn.execute('UPDATE timing_intervals SET started_ns=? WHERE id=?',(8_000_000_000_000_000_000,ident))
            finish=call('timing-finish','--run','run','--id',str(ident),'--actor','author','--status','completed','--finding','checked')
            self.assertNotEqual(finish.returncode,0); self.assertIn('clock moved backwards',finish.stderr)
            report=call('timing-report','--run','run'); item=json.loads(report.stdout)['intervals'][0]
            self.assertEqual(item['status'],'running'); self.assertIsNone(item['elapsedSeconds'])


if __name__=='__main__': unittest.main()
