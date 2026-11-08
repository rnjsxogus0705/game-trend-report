import hashlib
import json
from pathlib import Path
import sqlite3
import subprocess
import sys
import tempfile
import unittest

ROOT=Path(__file__).resolve().parent.parent
SCRIPT=ROOT/'workflows/report-template-store.py'

class StoreTests(unittest.TestCase):
    def test_versioning_tamper_and_scoped_section(self):
        with tempfile.TemporaryDirectory() as temp:
            tmp=Path(temp); db=tmp/'ledger.db'; catalog=tmp/'catalog.json'
            ref='reports/weekly-2026-10-31.html'
            doc={'schemaVersion':1,'references':[{'path':ref,'sha256':hashlib.sha256((ROOT/ref).read_bytes()).hexdigest()}], 'shared':{'style':'current'},'sections':[{'id':'games','lane':'a'},{'id':'reading','lane':'b'}]}
            def write(): catalog.write_text(json.dumps(doc))
            def call(*args,ok=True):
                proc=subprocess.run([sys.executable,str(SCRIPT),'--db',str(db),'--catalog',str(catalog),*args],text=True,capture_output=True)
                self.assertEqual(proc.returncode==0,ok,proc.stderr)
                return json.loads(proc.stdout) if ok else proc.stderr
            write(); first=call('import')['catalogSha256']; self.assertEqual(call('check')['sections'],2)
            result=call('section','--id','games'); self.assertEqual(result['section']['id'],'games'); self.assertNotIn('reading',json.dumps(result)); call('section','--id','missing',ok=False)
            call('section','--id','games','--run','unapproved',ok=False)
            doc['sections'][0]['lane']='c'; write(); call('check',ok=False); second=call('import')['catalogSha256']; self.assertNotEqual(first,second)
            conn=sqlite3.connect(db); self.assertEqual(conn.execute('SELECT count(*) FROM template_versions').fetchone()[0],2)
            conn.execute("UPDATE template_sections SET document='{}' WHERE hash=? AND id='games'",(second,)); conn.commit(); conn.close(); call('check',ok=False)
            doc['references'][0]['sha256']='0'*64; write(); call('import',ok=False)

if __name__=='__main__': unittest.main()
