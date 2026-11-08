"""Isolated synthetic tests for review impact records; never publication evidence."""
import hashlib
import importlib.util
import json
from pathlib import Path
import sqlite3
import subprocess
import sys
import tempfile
from concurrent.futures import ThreadPoolExecutor
import unittest

HERE = Path(__file__).resolve().parent
SCRIPT = HERE / 'report-ledger.py'
spec = importlib.util.spec_from_file_location('ledger_test_helpers', HERE / 'test-report-ledger.py')
helpers = importlib.util.module_from_spec(spec)
spec.loader.exec_module(helpers)


class ImpactTest(unittest.TestCase):
    def test_parallel_sections_and_changed_scope(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            helpers.install_test_skills(root)
            db = root / 'ledger.sqlite3'
            research = root / 'research.json'
            research.write_text(json.dumps({'sources': [{'uri': 'https://example.com'}]}))
            evidence = root / 'general.json'
            evidence.write_text(json.dumps({'observation': 'synthetic review', 'sources': ['https://example.com']}))
            html = root / 'issue.html'
            html.write_text('<main class="content"><section id="alpha"><p>alpha</p></section><section id="beta"><p>beta</p></section></main>')

            def call(*args, ok=True):
                result = subprocess.run([sys.executable, str(SCRIPT), '--db', str(db), *args], cwd=root, capture_output=True, text=True)
                self.assertEqual(result.returncode == 0, ok, result.stderr + result.stdout)
                return result

            def import_legacy_fixture(manifest):
                # Seed a historical record as it existed before manual entry was disabled.
                # Production CLI must not accept this path for new records.
                call('record-impact', '--run', 'run', '--actor', 'coordinator', '--manifest', str(manifest), ok=False)
                raw = manifest.read_bytes()
                doc = json.loads(raw)
                with sqlite3.connect(db) as connection:
                    cursor = connection.execute('INSERT INTO impact_records(run,actor,manifest_path,manifest_hash,document) VALUES(?,?,?,?,?)',
                        ('run','legacy-fixture',str(manifest),hashlib.sha256(raw).hexdigest(),raw.decode()))
                    for review in doc['reviews']:
                        connection.execute('INSERT INTO impact_reviews(impact_id,section,kind,state,review_event_id,reason) VALUES(?,?,?,?,?,?)',
                            (cursor.lastrowid,review['section'],review['kind'],review['state'],review['reviewEventId'],review['reason']))
                    return cursor.lastrowid

            call('ingest', '--run', 'run', '--issue-date', '2026-11-07', '--research', str(research), '--author', 'author')
            call('approve-research', '--run', 'run', '--reviewer', 'source-reviewer', '--evidence', str(evidence))
            for name in ('impeccable', 'humanizer', 'grammar-checker', 'style-guide', 'korean-humanizer', 'korean-spell-check'):
                call('record-skill', '--run', 'run', '--actor', 'author', '--phase', 'test', '--skill-path', str(root / '.agents' / 'skills' / name / 'SKILL.md'), '--action', 'inspect', '--evidence', str(evidence))

            packets = {}
            proofs = {}
            for section in ('alpha', 'beta'):
                packet = root / (section + '.json')
                packet.write_text(json.dumps({'text': section, 'urls': ['https://example.com']}))
                proof = root / (section + '-proof.json')
                helpers.packet_evidence(proof, packet, html)
                if section == 'alpha':
                    # The first impact has ID 1. Prepopulate the recovery fields so
                    # rejection below isolates the old evidence-hash check.
                    original = json.loads(proof.read_text())
                    original.update({'resolvesImpactId':1, 'correction':'synthetic', 'recheck':'synthetic'})
                    proof.write_text(json.dumps(original))
                packets[section] = packet
                proofs[section] = proof

            def produce(section):
                args = ['--run', 'run', '--section', section, '--packet', str(packets[section]), '--author', 'author', '--media-note', 'synthetic']
                call('prepare', *args)
                for kind in ('source', 'korean'):
                    call('approve-packet', '--run', 'run', '--section', section, '--kind', kind, '--reviewer', 'editor', '--evidence', str(proofs[section]))
                call('draft', *args)
                for kind in ('content', 'korean', 'ui'):
                    call('approve-section', '--run', 'run', '--section', section, '--kind', kind, '--reviewer', 'visual' if kind == 'ui' else 'editor', '--evidence', str(proofs[section]), '--html', str(html))
                call('advance', '--run', 'run', '--section', section)

            with ThreadPoolExecutor(max_workers=2) as pool:
                list(pool.map(produce, ('alpha', 'beta')))
            with sqlite3.connect(db) as connection:
                review_ids = {(section, kind): event_id for event_id, section, kind in connection.execute("SELECT id,section,kind FROM events WHERE run='run' AND kind IN ('pre-source','pre-korean','content','korean','ui')")}
            before = hashlib.sha256(html.read_bytes()).hexdigest()
            html.write_text(html.read_text().replace('<p>alpha</p>', '<p><span>alpha</span></p>'))
            after = hashlib.sha256(html.read_bytes()).hexdigest()
            manifest = root / 'impact.json'
            data = {'changes': [{'path': str(html), 'beforeSha256': before, 'afterSha256': after}], 'reviews': [
                {'section': 'alpha', 'kind': 'ui', 'state': 'invalidated', 'reviewEventId': review_ids['alpha', 'ui'], 'reason': '섹션 마크업 변경'},
                {'section': 'beta', 'kind': 'ui', 'state': 'reused', 'reviewEventId': review_ids['beta', 'ui'], 'reason': '이 섹션과 공통 셸 불변'},
            ]}
            manifest.write_text(json.dumps(data, ensure_ascii=False))
            impact_id = import_legacy_fixture(manifest)
            call('advance', '--run', 'run', '--section', 'alpha', ok=False)
            call('advance', '--run', 'run', '--section', 'beta')
            ui_args = ['--run', 'run', '--section', 'alpha', '--kind', 'ui', '--reviewer', 'visual', '--html', str(html)]
            old_result = call('approve-section', *ui_args, '--evidence', str(proofs['alpha']), ok=False)
            self.assertIn('Invalidated review evidence cannot clear impact', old_result.stderr)
            recheck = root / 'alpha-recheck.json'
            recheck_data = json.loads(proofs['alpha'].read_text())
            recheck_data.update({'observation':'synthetic recheck after changed section markup', 'resolvesImpactId':impact_id, 'correction':'synthetic correction', 'recheck':'synthetic recheck'})
            wrong_id = dict(recheck_data, resolvesImpactId=impact_id + 1)
            recheck.write_text(json.dumps(wrong_id))
            call('approve-section', *ui_args, '--evidence', str(recheck), ok=False)
            missing_correction = dict(recheck_data, correction='')
            recheck.write_text(json.dumps(missing_correction))
            call('approve-section', *ui_args, '--evidence', str(recheck), ok=False)
            recheck.write_text(json.dumps(recheck_data))
            call('approve-section', *ui_args, '--evidence', str(recheck))
            call('advance', '--run', 'run', '--section', 'alpha')
            history = json.loads(call('impact-history', '--run', 'run', '--section', 'alpha').stdout)
            self.assertEqual(len(history['impacts']), 1)
            record = history['impacts'][0]
            self.assertEqual(record['verification']['mode'], 'legacy-manual-unverified')
            self.assertEqual(record['manifestSha256'], hashlib.sha256(manifest.read_bytes()).hexdigest())
            self.assertEqual(record['changes'], data['changes'])
            self.assertEqual(record['reviews'], data['reviews'])
            self.assertEqual(len(json.loads(call('impact-history', '--run', 'run', '--section', 'beta').stdout)['impacts']), 1)
            self.assertEqual(json.loads(call('impact-history', '--run', 'run', '--section', 'missing').stdout)['impacts'], [])

            # Fabricated, cross-section or stale reuse must never grant approval.
            data['reviews'] = [{'section': 'alpha', 'kind': 'ui', 'state': 'reused', 'reviewEventId': review_ids['beta', 'ui'], 'reason': 'wrong section'}]
            manifest.write_text(json.dumps(data))
            call('record-impact', '--run', 'run', '--actor', 'coordinator', '--manifest', str(manifest), ok=False)
            data['reviews'][0]['reviewEventId'] = review_ids['alpha', 'ui']
            manifest.write_text(json.dumps(data))
            call('record-impact', '--run', 'run', '--actor', 'coordinator', '--manifest', str(manifest), ok=False)
            with sqlite3.connect(db) as connection:
                new_alpha_ui = connection.execute("SELECT MAX(id) FROM events WHERE run='run' AND section='alpha' AND kind='ui'").fetchone()[0]
            data['reviews'] = [
                {'section': 'alpha', 'kind': 'ui', 'state': 'invalidated', 'reviewEventId': new_alpha_ui, 'reason': 'batch must be atomic'},
                {'section': 'beta', 'kind': 'ui', 'state': 'reused', 'reviewEventId': new_alpha_ui, 'reason': 'wrong section'},
            ]
            manifest.write_text(json.dumps(data))
            call('record-impact', '--run', 'run', '--actor', 'coordinator', '--manifest', str(manifest), ok=False)
            stored = json.loads(call('impact-history', '--run', 'run').stdout)['impacts']
            self.assertEqual(len(stored), 1)
            self.assertEqual(stored[0]['manifestSha256'], record['manifestSha256'])
            self.assertNotEqual(stored[0]['manifestSha256'], hashlib.sha256(manifest.read_bytes()).hexdigest())
            call('advance', '--run', 'run', '--section', 'alpha')
            data['reviews'] = [{'section': 'alpha', 'kind': 'pre-source', 'state': 'invalidated', 'reviewEventId': review_ids['alpha', 'pre-source'], 'reason': 'source must be rechecked'}]
            manifest.write_text(json.dumps(data))
            impact_id = import_legacy_fixture(manifest)
            call('advance', '--run', 'run', '--section', 'alpha', ok=False)
            queue = json.loads(call('queue', '--run', 'run').stdout)
            alpha = next(item for item in queue['sections'] if item['sectionId'] == 'alpha')
            self.assertTrue(alpha['needsRepair'])
            self.assertFalse(alpha['preReview']['source'])
            call('advance', '--run', 'run', '--section', 'beta')
            pre_args = ['--run', 'run', '--section', 'alpha', '--kind', 'source', '--reviewer', 'editor']
            call('approve-packet', *pre_args, '--evidence', str(proofs['alpha']), ok=False)
            pre_recheck = root / 'alpha-source-recheck.json'
            pre_data = json.loads(proofs['alpha'].read_text())
            pre_data.update({'observation':'synthetic source recheck', 'resolvesImpactId':impact_id, 'correction':'synthetic source correction', 'recheck':'synthetic source recheck'})
            pre_recheck.write_text(json.dumps(pre_data))
            call('approve-packet', *pre_args, '--evidence', str(pre_recheck))
            call('advance', '--run', 'run', '--section', 'alpha')

            for kind in ('pre-korean', 'content', 'korean'):
                data['reviews'] = [{'section': 'alpha', 'kind': kind, 'state': 'invalidated', 'reviewEventId': review_ids['alpha', kind], 'reason': 'independent recheck required'}]
                manifest.write_text(json.dumps(data))
                impact_id = import_legacy_fixture(manifest)
                call('advance', '--run', 'run', '--section', 'alpha', ok=False)
                call('advance', '--run', 'run', '--section', 'beta')
                if kind == 'pre-korean':
                    cmd, args = 'approve-packet', ['--run','run','--section','alpha','--kind','korean','--reviewer','editor']
                else:
                    cmd, args = 'approve-section', ['--run','run','--section','alpha','--kind',kind,'--reviewer','editor','--html',str(html)]
                call(cmd, *args, '--evidence', str(proofs['alpha']), ok=False)
                new_proof = root / ('alpha-' + kind + '-recheck.json')
                proof_data = json.loads(proofs['alpha'].read_text())
                proof_data.update({'observation':'synthetic recheck ' + kind, 'resolvesImpactId':impact_id, 'correction':'synthetic correction', 'recheck':'synthetic recheck'})
                new_proof.write_text(json.dumps(proof_data))
                call(cmd, *args, '--evidence', str(new_proof))
                call('advance', '--run', 'run', '--section', 'alpha')


if __name__ == '__main__':
    unittest.main()
