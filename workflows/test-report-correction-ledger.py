"""Correction sources stay separate, time-bound and linked to real reviews."""
import hashlib
import importlib.util
import json
from pathlib import Path
import sqlite3
import subprocess
import sys
import tempfile
import unittest

HERE=Path(__file__).resolve().parent
spec=importlib.util.spec_from_file_location('ledger_helpers',HERE/'test-report-ledger.py')
helpers=importlib.util.module_from_spec(spec);spec.loader.exec_module(helpers)
SCRIPT=HERE/'report-ledger.py'

class CorrectionLedgerTest(unittest.TestCase):
 def test_correction_sources_and_review_binding(self):
  with tempfile.TemporaryDirectory() as tmp:
   root=Path(tmp);helpers.install_test_skills(root);db=root/'db.sqlite3'
   context=root/'_workspace/harness/weekly-game-report/r/context.json';context.parent.mkdir(parents=True)
   base_context={'runId':'r','issueDate':'2020-01-01','authorization':{'generate':True,'publish':False,'send':False},'correction':{'checkedAt':'2020-01-03T12:00:00Z','previousIssueSha256':'a'*64,'reason':'발행 후 정정','priorRunId':'prior','priorPublicationEvidence':[{'path':'p','sourcePath':'pages','sha256':'b'*64},{'path':'v','sourcePath':'vercel','sha256':'c'*64}]}}
   context.write_text(json.dumps(base_context))
   weekly={'uri':'https://example.com/weekly','publisher':'weekly','scope':'old','retrievedAt':'2020-01-01','kind':'background'}
   correction={'uri':'https://example.com/correction','publisher':'official','scope':'current','retrievedAt':'2020-01-02T11:00:00Z','kind':'correction','limitation':'발행 후 확인'}
   data={'inputs':{'context':hashlib.sha256(context.read_bytes()).hexdigest()},'sources':[weekly],'correctionSources':[correction]}
   research=root/'research.json';research.write_text(json.dumps(data))
   def call(*args,ok=True):
    r=subprocess.run([sys.executable,str(SCRIPT),'--db',str(db),*args],cwd=root,capture_output=True,text=True)
    self.assertEqual(r.returncode==0,ok,r.stderr+r.stdout);return r
   ingest=['ingest','--run','r','--issue-date','2020-01-01','--research',str(research),'--author','author']
   for change in ('early','after','missing-context','no-limitation'):
    bad=json.loads(json.dumps(data))
    if change=='early':bad['correctionSources'][0]['retrievedAt']='2020-01-01'
    if change=='after':bad['correctionSources'][0]['retrievedAt']='2020-01-03T13:00:00Z'
    if change=='missing-context':bad['inputs']['context']='0'*64
    if change=='no-limitation':bad['correctionSources'][0]['limitation']=''
    research.write_text(json.dumps(bad));call(*ingest,ok=False)
   # The same official URL can be checked again as a separately dated observation.
   for alias in ('https://EXAMPLE.COM/weekly','https://example.com/weekly/',
                 'https://example.com/weekly#section','https://example.com/weekly?utm_source=feed'):
    bad=json.loads(json.dumps(data));bad['correctionSources'][0]['uri']=alias
    research.write_text(json.dumps(bad));call(*ingest)
   bad=json.loads(json.dumps(data));duplicate=dict(bad['correctionSources'][0]);duplicate['uri']='https://EXAMPLE.COM/correction/?utm_campaign=test#section';bad['correctionSources'].append(duplicate)
   research.write_text(json.dumps(bad));self.assertIn('separate and unique',call(*ingest,ok=False).stderr)
   # A genuinely different path remains valid.
   valid=json.loads(json.dumps(data));valid['correctionSources'][0]['uri']='https://example.com/weekly-other'
   research.write_text(json.dumps(valid));call(*ingest)
   # Offset timestamps are classified by Seoul calendar day, not the source string.
   offset=json.loads(json.dumps(data));offset['correctionSources'][0]['retrievedAt']='2020-01-01T16:00:00Z'
   research.write_text(json.dumps(offset));call(*ingest)
   offset['correctionSources'][0]['retrievedAt']='2020-01-02T00:00:00+14:00'
   research.write_text(json.dumps(offset));call(*ingest,ok=False)
   # A correction cannot choose a traversal run ID or a symlinked context.
   research.write_text(json.dumps(data))
   unsafe=list(ingest);unsafe[unsafe.index('--run')+1]='../r'
   self.assertIn('Unsafe correction run ID',call(*unsafe,ok=False).stderr)
   original_context=context.read_bytes();outside=root/'outside-context.json';outside.write_bytes(original_context)
   context.unlink();context.symlink_to(outside)
   self.assertIn('Unsafe correction context path',call(*ingest,ok=False).stderr)
   context.unlink();context.write_bytes(original_context)
   for mutation in ('run','auth','identity','prior'):
    ctx=json.loads(json.dumps(base_context))
    if mutation=='run':ctx['runId']='different'
    if mutation=='auth':ctx['authorization']['generate']=False
    if mutation=='identity':ctx['correction']['previousIssueSha256']='bad'
    if mutation=='prior':ctx['correction']['priorRunId']='r'
    context.write_text(json.dumps(ctx));bad=json.loads(json.dumps(data));bad['inputs']['context']=hashlib.sha256(context.read_bytes()).hexdigest();research.write_text(json.dumps(bad));call(*ingest,ok=False)
   # The packet links the weekly URL while correction uses its normalized alias.
   # Changing the later observation must invalidate the existing packet review.
   weekly['uri']='https://example.com/correction'
   correction['uri']='https://EXAMPLE.COM/correction/?utm_source=review#top'
   context.write_text(json.dumps(base_context));research.write_text(json.dumps(data));call(*ingest)
   with sqlite3.connect(db) as con:
    self.assertEqual(con.execute("select count(*) from materials where research_hash=(select research_hash from runs where id='r')").fetchone()[0],1)
    self.assertEqual(con.execute("select count(*) from correction_materials where research_hash=(select research_hash from runs where id='r')").fetchone()[0],1)
   overview=json.loads(call('overview','--run','r').stdout)
   self.assertEqual(overview['sources'][0]['url'],weekly['uri'])
   self.assertEqual(overview['correctionSources'][0]['uri'],correction['uri'])
   # Simulate a pre-migration database and verify explicit safe backfill.
   with sqlite3.connect(db) as con: con.execute('delete from correction_materials')
   call('overview','--run','r',ok=False)
   self.assertEqual(json.loads(call('migrate-correction-materials','--run','r').stdout)['status'],'indexed-not-approved')
   with sqlite3.connect(db) as con: con.execute("update correction_materials set data='{}'")
   call('overview','--run','r',ok=False)
   call('migrate-correction-materials','--run','r',ok=False)
   with sqlite3.connect(db) as con: con.execute('delete from correction_materials')
   call('migrate-correction-materials','--run','r')
   with sqlite3.connect(db) as con: con.execute("insert into correction_materials(run,research_hash,ordinal,data) values('r','orphan',0,'{}')")
   self.assertIn('Orphan correction materials',call('overview','--run','r',ok=False).stderr)
   with sqlite3.connect(db) as con: con.execute("delete from correction_materials where research_hash='orphan'")
   packet=root/'packet.json';packet.write_text(json.dumps({'text':'정정 원고','urls':[weekly['uri']]}))
   args=['--run','r','--section','games','--packet',str(packet),'--author','author','--media-note','없음']
   call('prepare',*args)
   proof=root/'proof.json';research_proof=root/'research-proof.json'
   research_proof.write_text(json.dumps({'observation':'정정 출처 확인','sources':[correction['uri']]}))
   call('approve-research','--run','r','--reviewer','reviewer','--evidence',str(research_proof))
   for name in ('impeccable','humanizer','grammar-checker','style-guide','korean-humanizer','korean-spell-check'):
    call('record-skill','--run','r','--actor','author','--phase','test','--skill-path',str(root/'.agents/skills'/name/'SKILL.md'),'--action','inspect','--evidence',str(research_proof))
   html=root/'issue.html';html.write_text('<main class="content"><section id="games"><p>정정 원고</p></section></main>')
   helpers.packet_evidence(proof,packet,html);p=json.loads(proof.read_text());p['sources']=[weekly['uri']];p['claimChecks'][0]['sourceUrl']=weekly['uri'];proof.write_text(json.dumps(p))
   for kind in ('source','korean'):call('approve-packet','--run','r','--section','games','--kind',kind,'--reviewer','reviewer','--evidence',str(proof))
   call('draft',*args)
   for kind in ('content','korean'):call('approve-section','--run','r','--section','games','--kind',kind,'--reviewer','reviewer','--html',str(html),'--evidence',str(proof))
   state=json.loads(call('queue','--run','r').stdout)['sections'][0]
   self.assertTrue(state['preReview']['source']);self.assertTrue(state['review']['content'])
   context.write_text('{}')
   state=json.loads(call('queue','--run','r').stdout)
   self.assertTrue(any('Research' in blocker for blocker in state['globalBlockers']))
   context.write_text(json.dumps(base_context))
   with sqlite3.connect(db) as con:
    original=con.execute("select document from research_versions where run='r' and hash=(select research_hash from runs where id='r')").fetchone()[0]
    con.execute("update research_versions set document='{}' where run='r' and hash=(select research_hash from runs where id='r')")
   state=json.loads(call('queue','--run','r').stdout)
   self.assertTrue(any('Research' in blocker for blocker in state['globalBlockers']))
   with sqlite3.connect(db) as con: con.execute("update research_versions set document=? where run='r' and hash=(select research_hash from runs where id='r')",(original,))
   # Re-ingesting changed correction evidence invalidates packet-bound approvals.
   data['correctionSources'][0]['scope']='changed source scope';research.write_text(json.dumps(data));call(*ingest)
   state=json.loads(call('queue','--run','r').stdout)['sections'][0]
   self.assertFalse(state['preReview']['source']);self.assertFalse(state['review']['content'])
   context.write_text('{}')
   result=call('prepare',*args,ok=False);self.assertIn('context missing or hash mismatch',result.stderr)

if __name__=='__main__':unittest.main()
