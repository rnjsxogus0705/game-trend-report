"""Safety tests for snapshot-based impact analysis; fixtures are not review evidence."""
import hashlib
import importlib.util
import json
import os
from unittest import mock
from pathlib import Path
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

class AutoImpactTest(unittest.TestCase):
    def test_snapshot_integrity_scope_and_review_gate(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp).resolve() / 'work'; root.mkdir()
            helpers.install_test_skills(root)
            db = root / 'ledger.sqlite3'
            research = root / 'research.json'
            research.write_text(json.dumps({'sources': [{'uri': 'https://example.com'}]}))
            evidence = root / 'general.json'
            evidence.write_text(json.dumps({'observation': 'synthetic review', 'sources': ['https://example.com']}))
            base = '<main class="content"><section id="alpha"><p>alpha</p></section><section id="beta"><p>beta</p></section></main>'
            site = root
            (site / 'reports').mkdir(); (site / 'assets/report').mkdir(parents=True)
            html = site / 'reports/issue.html'
            html.write_text(base)
            before, after = Path(tmp).resolve() / 'before', Path(tmp).resolve() / 'after'
            before.mkdir(); after.mkdir()
            for snapshot in (before, after):
                (snapshot / 'reports').mkdir(); (snapshot / 'assets/report').mkdir(parents=True)
            (before / 'reports/issue.html').write_text(base)
            (after / 'reports/issue.html').write_text(base.replace('<p>alpha</p>', '<p><span>alpha</span></p>'))
            (site / 'assets/report/unknown.txt').write_text('old'); (before / 'assets/report/unknown.txt').write_text('old'); (after / 'assets/report/unknown.txt').write_text('old')
            runner = root / 'synthetic_harness_runner.py'
            runner.write_text('''import importlib.util, subprocess, sys
script = sys.argv.pop(1)
spec = importlib.util.spec_from_file_location('synthetic_ledger', script)
module = importlib.util.module_from_spec(spec); spec.loader.exec_module(module)
module.subprocess.run = lambda args, **kwargs: subprocess.CompletedProcess(args, 0, '', '')
try: sys.exit(module.main())
except Exception as exc: print(str(exc), file=sys.stderr); sys.exit(1)
''')

            def call(*args, ok=True, mock_harness=False):
                command = [sys.executable, str(runner), str(SCRIPT)] if mock_harness else [sys.executable, str(SCRIPT)]
                result = subprocess.run([*command, '--db', str(db), *args], cwd=root, capture_output=True, text=True)
                self.assertEqual(result.returncode == 0, ok, result.stderr + result.stdout)
                return result

            call('ingest', '--run', 'run', '--issue-date', '2026-11-07', '--research', str(research), '--author', 'author')
            call('approve-research', '--run', 'run', '--reviewer', 'source-reviewer', '--evidence', str(evidence))
            for name in ('impeccable', 'humanizer', 'grammar-checker', 'style-guide', 'korean-humanizer', 'korean-spell-check'):
                call('record-skill', '--run', 'run', '--actor', 'author', '--phase', 'test', '--skill-path', str(root / '.agents' / 'skills' / name / 'SKILL.md'), '--action', 'inspect', '--evidence', str(evidence))
            packets, proofs = {}, {}
            for section in ('alpha', 'beta'):
                packet = root / (section + '.json')
                packet.write_text(json.dumps({'text': section, 'urls': ['https://example.com']}))
                proof = root / (section + '-proof.json')
                helpers.packet_evidence(proof, packet, html)
                packets[section], proofs[section] = packet, proof

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
            self.assertEqual(hashlib.sha256((before / 'reports/issue.html').read_bytes()).hexdigest(), hashlib.sha256(html.read_bytes()).hexdigest())
            # Additional assertions exercise the actual CLI after its contract is established.
            inventory = root / '_workspace/harness/weekly-game-report/run/issue-index.json'
            inventory.parent.mkdir(parents=True, exist_ok=True)
            inventory.write_text(json.dumps({'runId':'run', 'files':[{'path':'reports/issue.html', 'sha256': hashlib.sha256((before / 'reports/issue.html').read_bytes()).hexdigest()},{'path':'assets/report/unknown.txt', 'sha256': hashlib.sha256(b'old').hexdigest()}]}))
            final_review = root / '_workspace/harness/weekly-game-report/run/final-review.json'
            final_review.parent.mkdir(parents=True, exist_ok=True)
            final_review.write_text(json.dumps({'runId':'run','issueDate':'2026-11-07','verdict':'approved','inputs':{'issue':hashlib.sha256(inventory.read_bytes()).hexdigest()}}))
            call('store-receipt', '--run', 'run', '--kind', 'final-review', '--file', str(final_review), '--actor', 'fixture')
            capture_args = ['--run','run','--snapshot-dir',str(before),'--source-dir',str(site),'--scope','reports','--scope','assets/report','--inventory',str(inventory)]
            inventory_bytes = inventory.read_bytes()
            falsified_inventory = json.loads(inventory_bytes)
            falsified_inventory['files'][0]['sha256'] = '0' * 64
            inventory.write_text(json.dumps(falsified_inventory))
            call('capture-impact-baseline', *capture_args, ok=False, mock_harness=True)
            missing_inventory = json.loads(inventory_bytes)
            missing_inventory['files'].pop()
            inventory.write_text(json.dumps(missing_inventory))
            call('capture-impact-baseline', *capture_args, ok=False, mock_harness=True)
            inventory.write_bytes(inventory_bytes)
            call('capture-impact-baseline', '--run','run','--snapshot-dir',str(before),'--source-dir',str(site),'--scope','../outside','--inventory',str(inventory), ok=False, mock_harness=True)
            (site / 'escape-scope').symlink_to(site / 'reports', target_is_directory=True)
            call('capture-impact-baseline', '--run','run','--snapshot-dir',str(before),'--source-dir',str(site),'--scope','escape-scope','--inventory',str(inventory), ok=False, mock_harness=True)
            (site / 'escape-scope').unlink()
            # The real harness rejects this incomplete synthetic run. Only the
            # isolated unit fixture substitutes its result; no CLI bypass exists.
            call('capture-impact-baseline', *capture_args, ok=False)
            captured = json.loads(call('capture-impact-baseline', *capture_args, mock_harness=True).stdout)
            html.write_bytes((after / 'reports/issue.html').read_bytes())
            args = ['--run', 'run', '--baseline-id', str(captured['baselineId']), '--after-dir', str(after)]
            result = json.loads(call('analyze-impact', *args).stdout)
            change = next(c for c in result['changes'] if c['path'] == 'reports/issue.html')
            self.assertEqual(change['beforeSha256'], hashlib.sha256((before / 'reports/issue.html').read_bytes()).hexdigest())
            self.assertEqual(change['afterSha256'], hashlib.sha256((after / 'reports/issue.html').read_bytes()).hexdigest())
            self.assertEqual({r['section'] for r in result['reviews'] if r['state'] == 'invalidated'}, {'alpha'})
            self.assertEqual({r['section'] for r in result['reviews'] if r['state'] == 'reused'}, {'beta'})

            # Insertion exactly between sibling sections belongs to the shell.
            boundary = base.replace('</section><section id="beta">', '</section><!-- shell change --><section id="beta">')
            (after / 'reports/issue.html').write_text(boundary); html.write_text(boundary)
            boundary_result = json.loads(call('analyze-impact', *args).stdout)
            self.assertEqual({r['section'] for r in boundary_result['reviews'] if r['state'] == 'invalidated'}, {'alpha', 'beta'})
            (after / 'reports/issue.html').write_text(base.replace('<p>alpha</p>', '<p><span>alpha</span></p>'))
            html.write_bytes((after / 'reports/issue.html').read_bytes())

            # Manual declarations can never claim to be verified, even with valid events.
            fake = root / 'forged.json'
            fake.write_text(json.dumps({'changes': [{'path': 'issue.html', 'beforeSha256': '0'*64, 'afterSha256': '1'*64}], 'reviews': result['reviews']}))
            call('record-impact', '--run', 'run', '--actor', 'coordinator', '--manifest', str(fake), ok=False)

            # A deliberately false previous snapshot must not result in reuse.
            (before / 'reports/issue.html').write_bytes((after / 'reports/issue.html').read_bytes())
            falsified = call('analyze-impact', *args, ok=False)
            self.assertNotEqual(falsified.returncode, 0)
            (before / 'reports/issue.html').write_text(base)

            # A non-HTML file changed, added or deleted is conservatively global.
            (after / 'assets/report/new.txt').write_text('new'); (site / 'assets/report/new.txt').write_text('new')
            new = json.loads(call('analyze-impact', *args).stdout)
            self.assertEqual({r['section'] for r in new['reviews'] if r['state'] == 'invalidated'}, {'alpha', 'beta'})
            new_file = next(c for c in new['changes'] if c['path'] == 'assets/report/new.txt')
            self.assertIsNone(new_file['beforeSha256'])
            self.assertEqual(new_file['afterSha256'], hashlib.sha256(b'new').hexdigest())
            (after / 'assets/report/new.txt').unlink(); (site / 'assets/report/new.txt').unlink(); (after / 'assets/report/unknown.txt').unlink(); (site / 'assets/report/unknown.txt').unlink()
            deleted = json.loads(call('analyze-impact', *args).stdout)
            removed_file = next(c for c in deleted['changes'] if c['path'] == 'assets/report/unknown.txt')
            self.assertEqual(removed_file['beforeSha256'], hashlib.sha256(b'old').hexdigest())
            self.assertIsNone(removed_file['afterSha256'])
            self.assertEqual({r['section'] for r in deleted['reviews'] if r['state'] == 'invalidated'}, {'alpha', 'beta'})
            (after / 'assets/report/unknown.txt').write_text('old'); (site / 'assets/report/unknown.txt').write_text('old')

            # Dropping a still-present source file from either complete snapshot fails.
            (after / 'assets/report/unknown.txt').unlink()
            call('analyze-impact', *args, ok=False)
            (after / 'assets/report/unknown.txt').write_text('old')
            (before / 'assets/report/unknown.txt').unlink()
            call('analyze-impact', *args, ok=False)
            (before / 'assets/report/unknown.txt').write_text('old')

            # Symlinks and absent directory cannot be used to escape or omit evidence.
            (after / 'escape').symlink_to(root / 'research.json')
            call('analyze-impact', *args, ok=False)
            (after / 'escape').unlink()
            call('analyze-impact', '--run', 'run', '--baseline-id', str(captured['baselineId']), '--after-dir', str(root / 'missing'), ok=False)

            # Deterministically simulate a snapshot changing between the first
            # and final byte read; the transaction must not write any impact.
            module_spec = importlib.util.spec_from_file_location('ledger_race', SCRIPT)
            module = importlib.util.module_from_spec(module_spec)
            module_spec.loader.exec_module(module)
            original_snapshot_files = module.snapshot_files
            calls = [0]
            def racing_snapshot(path):
                if Path(path) == before:
                    calls[0] += 1
                    if calls[0] == 2:
                        (after / 'reports/issue.html').write_text('changed during analysis')
                return original_snapshot_files(path)
            argv = [str(SCRIPT), '--db', str(db), 'record-impact-auto', *args, '--actor', 'coordinator']
            old_cwd = os.getcwd()
            try:
                os.chdir(root)
                with mock.patch.object(sys, 'argv', argv), mock.patch.object(module, 'snapshot_files', side_effect=racing_snapshot):
                    with self.assertRaisesRegex(ValueError, 'changed during analysis'):
                        module.main()
            finally:
                os.chdir(old_cwd)
                (after / 'reports/issue.html').write_bytes(html.read_bytes())
            self.assertEqual(json.loads(call('impact-history', '--run', 'run').stdout)['impacts'], [])

            # Competing writers cannot duplicate one invalidation.
            def record_once(_):
                return subprocess.run([sys.executable, str(SCRIPT), '--db', str(db), 'record-impact-auto', *args, '--actor', 'coordinator'], cwd=root, capture_output=True, text=True)
            with ThreadPoolExecutor(max_workers=2) as pool:
                attempts = list(pool.map(record_once, range(2)))
            self.assertEqual(sum(item.returncode == 0 for item in attempts), 1, [item.stderr for item in attempts])
            recorded = json.loads(next(item.stdout for item in attempts if item.returncode == 0))
            self.assertIn('impactId', recorded)
            impact_id = recorded['impactId']
            history = json.loads(call('impact-history', '--run', 'run').stdout)
            self.assertEqual(len(history['impacts']), 1)
            self.assertTrue(history['impacts'][0]['verification']['baselineBound'])
            self.assertEqual(history['impacts'][0]['changes'], result['changes'])
            call('advance', '--run', 'run', '--section', 'alpha', ok=False)
            call('advance', '--run', 'run', '--section', 'beta')
            for kind in ('pre-source', 'pre-korean', 'content', 'korean', 'ui'):
                reviewer = 'visual' if kind == 'ui' else 'editor'
                if kind.startswith('pre-'):
                    cmd = 'approve-packet'
                    approval = ['--run', 'run', '--section', 'alpha', '--kind', kind[4:], '--reviewer', reviewer]
                else:
                    cmd = 'approve-section'
                    approval = ['--run', 'run', '--section', 'alpha', '--kind', kind, '--reviewer', reviewer, '--html', str(html)]
                call(cmd, *approval, '--evidence', str(proofs['alpha']), ok=False)
                proof = json.loads(proofs['alpha'].read_text())
                proof.update({'observation': 'synthetic new ' + kind, 'resolvesImpactId': impact_id, 'correction': 'synthetic correction', 'recheck': 'synthetic recheck'})
                path = root / ('alpha-new-' + kind + '.json')
                path.write_text(json.dumps(proof))
                call(cmd, *approval, '--evidence', str(path))
            call('advance', '--run', 'run', '--section', 'alpha')

    def test_nested_child_change_never_excludes_child(self):
        module_spec = importlib.util.spec_from_file_location('ledger_auto', SCRIPT)
        module = importlib.util.module_from_spec(module_spec)
        module_spec.loader.exec_module(module)
        before = b'<main><section id="game-ai-tools"><p>parent</p><section id="agent-skills"><p>child</p></section></section></main>'
        after = before.replace(b'<p>child</p>', b'<p>updated child</p>')
        affected = module.html_changed_sections(before, after, {'game-ai-tools', 'agent-skills'})
        self.assertTrue(affected is None or affected == {'game-ai-tools', 'agent-skills'}, affected)

    def test_presentation_asset_must_stay_in_snapshot_inventory(self):
        module_spec = importlib.util.spec_from_file_location('ledger_assets', SCRIPT)
        module = importlib.util.module_from_spec(module_spec)
        module_spec.loader.exec_module(module)
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp); snapshot = root / 'snapshot'; snapshot.mkdir()
            (root / 'outside.css').write_text('body {}')
            html = snapshot / 'report.html'
            html.write_text('<link rel="stylesheet" href="../outside.css"><main></main>')
            with self.assertRaises(ValueError):
                module.snapshot_presentation_hash(html, snapshot, {'report.html': ''})
            (snapshot / 'inside.css').write_text('body {}')
            html.write_text('<link rel="stylesheet" href="inside.css"><main></main>')
            with self.assertRaises(ValueError):
                module.snapshot_presentation_hash(html, snapshot, {'report.html': ''})
            self.assertEqual(len(module.snapshot_presentation_hash(html, snapshot, {'report.html':'','inside.css':''})), 64)
            html.write_text('<main><img src="inside.png" alt="test"></main>')
            with self.assertRaises(ValueError):
                module.validate_snapshot_links(html, snapshot, {'report.html':''})
            (snapshot / 'inside.png').write_bytes(b'fixture')
            module.validate_snapshot_links(html, snapshot, {'report.html':'','inside.png':''})

if __name__ == '__main__':
    unittest.main()
