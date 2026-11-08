"""Regression tests: explicit failing review verdicts never grant ledger approval."""
import hashlib
import importlib.util
import json
from pathlib import Path
import sqlite3
import subprocess
import sys
import tempfile
import unittest

HERE = Path(__file__).resolve().parent
SCRIPT = HERE / 'report-ledger.py'
spec = importlib.util.spec_from_file_location('ledger_test_helpers', HERE / 'test-report-ledger.py')
helpers = importlib.util.module_from_spec(spec)
spec.loader.exec_module(helpers)


class ReviewVerdictTest(unittest.TestCase):
    def test_all_approval_paths_reject_nonpassing_evidence_and_legacy_bad_event(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            helpers.install_test_skills(root)
            db = root / 'ledger.sqlite3'
            research = root / 'research.json'
            research.write_text(json.dumps({'sources': [{'uri': 'https://example.com'}]}))
            packet = root / 'packet.json'
            packet.write_text(json.dumps({'text': '실제 원고', 'urls': ['https://example.com']}))
            html = root / 'issue.html'
            html.write_text('<main class="content"><section id="games"><p>내용</p></section></main>')
            proof = root / 'proof.json'
            helpers.packet_evidence(proof, packet, html)
            valid = json.loads(proof.read_text())
            evidence = root / 'research-evidence.json'
            evidence.write_text(json.dumps({'observation': 'source reviewed', 'sources': ['https://example.com']}))

            def call(*args, ok=True):
                result = subprocess.run([sys.executable, str(SCRIPT), '--db', str(db), *args],
                                        cwd=root, capture_output=True, text=True)
                self.assertEqual(result.returncode == 0, ok, result.stderr + result.stdout)
                return result

            def rejected_fields(args, base):
                negative = [('status', 'blocked'), ('status', 'FAILED'), ('status', 'partial'),
                            ('status', 'unverified'), ('status', None), ('status', False),
                            ('verdict', 'rejected'), ('verdict', 'fail'), ('verdict', 'pending'),
                            ('verdict', 'unknown'), ('status', 'complete'), ('status', 'ready')]
                for index, (field, value) in enumerate(negative):
                    target = root / ('rejected-' + str(index) + '.json')
                    target.write_text(json.dumps(dict(base, **{field: value})))
                    result = call(*args, '--evidence', str(target), ok=False)
                    self.assertIn('non-passing ' + field, result.stderr)
                contradictory = root / 'contradictory.json'
                contradictory.write_text(json.dumps(dict(base, status='passed', verdict='blocked')))
                self.assertIn('non-passing verdict', call(*args, '--evidence', str(contradictory), ok=False).stderr)

            call('ingest', '--run', 'r', '--issue-date', '2026-11-07', '--research', str(research), '--author', 'author')
            research_args = ['approve-research', '--run', 'r', '--reviewer', 'source-reviewer']
            rejected_fields(research_args, json.loads(evidence.read_text()))
            accepted = root / 'accepted-research.json'
            accepted.write_text(json.dumps({'observation': 'reviewed', 'sources': ['https://example.com'], 'status': 'pass-pending-ledger'}))
            call(*research_args, '--evidence', str(accepted))
            for name in ('impeccable', 'humanizer', 'grammar-checker', 'style-guide', 'korean-humanizer', 'korean-spell-check'):
                call('record-skill', '--run', 'r', '--actor', 'author', '--phase', 'test',
                     '--skill-path', str(root / '.agents' / 'skills' / name / 'SKILL.md'),
                     '--action', 'inspect', '--evidence', str(evidence))
            common = ['--run', 'r', '--section', 'games', '--packet', str(packet),
                      '--author', 'author', '--media-note', 'synthetic']
            call('prepare', *common)
            for kind in ('source', 'korean'):
                args = ['approve-packet', '--run', 'r', '--section', 'games', '--kind', kind, '--reviewer', 'editor']
                rejected_fields(args, valid)
                call(*args, '--evidence', str(proof))  # Legacy evidence with no verdict remains valid.
            call('draft', *common)
            for kind in ('content', 'korean', 'ui'):
                args = ['approve-section', '--run', 'r', '--section', 'games', '--kind', kind,
                        '--reviewer', 'visual' if kind == 'ui' else 'editor', '--html', str(html)]
                rejected_fields(args, valid)
                call(*args, '--evidence', str(proof))
            call('advance', '--run', 'r', '--section', 'games')

            # A legacy database may already contain a bad event. Even with a matching
            # stored file hash it cannot continue to satisfy current approval gates.
            blocked = root / 'legacy-blocked.json'
            blocked.write_text(json.dumps(dict(valid, verdict='blocked')))
            with sqlite3.connect(db) as connection:
                connection.execute("UPDATE events SET evidence=?, evidence_hash=? WHERE run='r' AND section='games' AND kind='ui'",
                                   (str(blocked), hashlib.sha256(blocked.read_bytes()).hexdigest()))
            call('advance', '--run', 'r', '--section', 'games', ok=False)
            queue = json.loads(call('queue', '--run', 'r').stdout)
            self.assertFalse(queue['sections'][0]['review']['ui'])

            # Failure events deliberately accept a blocked verdict.
            failure = root / 'failure.json'
            failure.write_text(json.dumps({'observation': '실패 확인', 'findingReason': '충돌',
                                           'status': 'blocked'}))
            call('record-failure', '--run', 'r', '--section', 'games', '--kind', 'ui',
                 '--reviewer', 'visual', '--evidence', str(failure))


if __name__ == '__main__':
    unittest.main()
