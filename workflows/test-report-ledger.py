import json
import hashlib
from pathlib import Path
import subprocess
import sys
import tempfile
import shutil
import sqlite3
from concurrent.futures import ThreadPoolExecutor
import struct
import zlib
import unittest

SCRIPT = Path(__file__).with_name('report-ledger.py')

def install_test_skills(root):
    for name in ('impeccable','humanizer','grammar-checker','style-guide','korean-humanizer','korean-spell-check'):
        target=root/'.agents'/'skills'/name/'SKILL.md'; target.parent.mkdir(parents=True); target.write_text('---\nname: '+name+'\ndescription: fixture\n---\n')

def synthetic_png(width):
    def chunk(kind,data): return struct.pack('>I',len(data))+kind+data+struct.pack('>I',zlib.crc32(kind+data)&0xffffffff)
    return b'\x89PNG\r\n\x1a\n'+chunk(b'IHDR',struct.pack('>IIBBBBB',width,240,8,2,0,0,0))+chunk(b'IDAT',zlib.compress((b'\0'+b'\xff\xff\xff'*width)*240))+chunk(b'IEND',b'')

def packet_evidence(path, packet, screenshot):
    run='run' if packet.stem != 'packet' else 'r'
    section=packet.stem if packet.stem != 'packet' else 'games'
    target=packet.parent/'_workspace/harness/weekly-game-report'/run/'evidence'/(section+'.txt')
    target.parent.mkdir(parents=True,exist_ok=True); target.write_text('synthetic section '+section)
    images=[]
    for width in (320,390,768,1440):
        image=target.with_name(section+'-'+str(width)+'.png'); image.write_bytes(synthetic_png(width)); images.append({'path':str(image),'sha256':hashlib.sha256(image.read_bytes()).hexdigest(),'width':width,'viewportHeight':240,'devicePixelRatio':1})
    path.write_text(json.dumps({'section':section,'observation':'reviewed '+section+' packet and source','sources':['https://example.com'],'mediaFinding':'no relevant media','reviewedPacketHash':hashlib.sha256(packet.read_bytes()).hexdigest(),'noChangeReason':'문장 검토 후 변경 없음','claimChecks':[{'claim':section+' 내용','sourceUrl':'https://example.com','status':'verified'}],'duplicateFinding':'이전 호 조사 결과 새 내용','repeatReason':'같은 출처의 다른 항목을 확인','widths':[320,390,768,1440],'checks':['layout','typography','responsive','accessibility','media'],'uiEvidence':images}))

class LedgerTest(unittest.TestCase):
    def test_review_requires_independence_and_detects_stale_packet(self):
        with tempfile.TemporaryDirectory() as tmp:
            d=Path(tmp); install_test_skills(d); db=d/'test.sqlite'; research=d/'research.json'; packet=d/'packet.json'; skill=d/'SKILL.md'; evidence=d/'evidence.txt'; html=d/'issue.html'
            research_data={'inputs':{'context':'b'*64},'sources':[{'uri':'https://example.com','scope':'원문'}],'renewalCorpus':{'sections':[{'sectionId':'games','candidate':{'title':'실제 원고'}},{'sectionId':'next','candidate':{'title':'다음'}}]}}; research.write_text(json.dumps(research_data)); packet.write_text(json.dumps({'text':'실제 원고','urls':['https://example.com'],'candidate':{'title':'실제 원고'}})); skill.write_text('skill'); evidence.write_text(json.dumps({'observation':'checked source and screen','sources':['https://example.com'],'mediaFinding':'no suitable media found'})); css=d/'screen.css'; css.write_text('body { color: black; }'); script=d/'screen.js'; script.write_text('void 0;'); html_source='<link rel="stylesheet" href="screen.css"><script src="screen.js"></script><style>p{margin:0}</style><body><div class="layout"><aside>목차</aside><main class="content"><section id="games"><p>내용</p><a href="https://example.com" aria-label="공식 자료">출처</a><pre><code>if True:\n    print(1)</code></pre></section><section id="untouched">다른 문단</section></main></div></body>'; html.write_text(html_source)
            def call(*args, ok=True):
                result=subprocess.run([sys.executable,str(SCRIPT),'--db',str(db),*args],capture_output=True,text=True,cwd=d)
                self.assertEqual(result.returncode==0,ok,result.stderr+result.stdout)
                return result
            call('ingest','--run','r','--issue-date','2026-11-07','--research',str(research),'--author','writer')
            early=['--run','r','--section','games','--packet',str(packet),'--author','writer','--media-note','source media unavailable']
            call('prepare',*early)
            overview=json.loads(call('overview','--run','r','--section','games','--limit','1').stdout)
            self.assertEqual(overview['sections'][0]['id'],'games')
            self.assertEqual(overview['sources'][0]['url'],'https://example.com')
            self.assertEqual(overview['sources'][0]['scope'],'원문')
            self.assertEqual(overview['sections'][0]['excerpt'],'실제 원고')
            self.assertEqual(overview['totalCounts'],{'sections':1,'sources':1})
            self.assertIn('not approval',overview['note'])
            call('overview','--run','r','--limit','0',ok=False)
            call('draft',*early,ok=False)
            call('approve-research','--run','r','--reviewer','writer','--evidence',str(evidence),ok=False)
            call('approve-research','--run','r','--reviewer','reviewer','--evidence',str(evidence))

            for name in ('impeccable','humanizer','grammar-checker','style-guide','korean-humanizer','korean-spell-check'):
                target=d/'.agents'/'skills'/name/'SKILL.md'
                call('record-skill','--run','r','--actor','fixture','--phase','design','--skill-path',str(target),'--action','inspect','--evidence',str(evidence))
            proof=d/'games-evidence.json'; packet_evidence(proof,packet,html)
            args=['--run','r','--section','games','--packet',str(packet),'--author','writer','--media-note','source media unavailable']
            call('prepare',*args)
            for kind in ('source','korean'): call('approve-packet','--run','r','--section','games','--kind',kind,'--reviewer','reviewer','--evidence',str(proof))
            call('approve-section','--run','r','--section','games','--kind','content','--reviewer','reviewer','--evidence',str(proof),'--html',str(html),ok=False)
            call('packet','--run','r','--section','games',ok=False)
            call('draft',*args)
            self.assertEqual(json.loads(call('packet','--run','r','--section','games').stdout)['candidate']['title'],'실제 원고')
            self.assertEqual(json.loads(call('packet','--run','r','--section','games').stdout)['issueDate'],'2026-11-07')
            call('advance','--run','r','--section','games',ok=False)
            next_packet=d/'next.json'; next_packet.write_text(json.dumps({'text':'다른 설명','urls':['https://example.com'],'candidate':{'title':'다음'}})); next_proof=d/'next-evidence.json'
            packet_evidence(next_proof,next_packet,html)
            next_data=json.loads(next_proof.read_text()); next_data['section']='next'; next_proof.write_text(json.dumps(next_data))
            next_args=['--run','r','--section','next','--packet',str(next_packet),'--author','writer','--media-note','미디어 없음']
            call('prepare',*next_args)
            for kind in ('source','korean'): call('approve-packet','--run','r','--section','next','--kind',kind,'--reviewer','reviewer','--evidence',str(next_proof))
            call('draft',*next_args)
            self.assertEqual(json.loads(call('packet','--run','r','--section','next').stdout)['candidate']['title'],'다음')
            missing_reason=d/'missing-repeat.json'; no_reason=json.loads(proof.read_text()); no_reason.pop('repeatReason'); missing_reason.write_text(json.dumps(no_reason))
            failed=call('approve-section','--run','r','--section','games','--kind','content','--reviewer','reviewer','--evidence',str(missing_reason),'--html',str(html),ok=False)
            self.assertIn('repeat reason missing',failed.stderr)
            for kind in ('content','korean','ui'):
                if kind=='ui':
                    wrong=d/'_workspace/harness/weekly-game-report/r/evidence/wrong.png'; wrong.write_bytes(synthetic_png(1600))
                    bad=json.loads(proof.read_text()); bad['uiEvidence'][0]={'path':str(wrong),'sha256':hashlib.sha256(wrong.read_bytes()).hexdigest(),'width':320,'viewportHeight':240,'devicePixelRatio':1}; badproof=d/'wrong-ui.json'; badproof.write_text(json.dumps(bad))
                    call('approve-section','--run','r','--section','games','--kind','ui','--reviewer','ui-reviewer','--evidence',str(badproof),'--html',str(html),ok=False)
                    wrong.write_bytes(synthetic_png(320)[:33]); bad['uiEvidence'][0]['sha256']=hashlib.sha256(wrong.read_bytes()).hexdigest(); badproof.write_text(json.dumps(bad)); call('approve-section','--run','r','--section','games','--kind','ui','--reviewer','ui-reviewer','--evidence',str(badproof),'--html',str(html),ok=False)
                    wrong.write_bytes(synthetic_png(320)); bad['uiEvidence'][0]['sha256']=hashlib.sha256(wrong.read_bytes()).hexdigest(); bad['uiEvidence'][0]['viewportHeight']=1; badproof.write_text(json.dumps(bad)); call('approve-section','--run','r','--section','games','--kind','ui','--reviewer','ui-reviewer','--evidence',str(badproof),'--html',str(html),ok=False)
                call('approve-section','--run','r','--section','games','--kind',kind,'--reviewer','ui-reviewer' if kind=='ui' else 'reviewer','--evidence',str(proof),'--html',str(html))
            design=d/'DESIGN.md'; design.write_text('canonical design')
            ui_args=['approve-section','--run','r','--section','games','--kind','ui','--reviewer','ui-reviewer','--html',str(html)]
            call(*ui_args,'--evidence',str(proof),ok=False)
            design_proof=d/'design-ui.json'; design_data=json.loads(proof.read_text()); design_data['designContractSha256']='0'*64; design_proof.write_text(json.dumps(design_data))
            call(*ui_args,'--evidence',str(design_proof),ok=False)
            design_data['designContractSha256']=hashlib.sha256(design.read_bytes()).hexdigest(); design_proof.write_text(json.dumps(design_data))
            mirror=d/'assets/report/DESIGN.md'; mirror.parent.mkdir(parents=True); mirror.write_bytes(design.read_bytes())
            call(*ui_args,'--evidence',str(design_proof))
            call('advance','--run','r','--section','games')
            mirror.write_text('tampered mirror')
            call(*ui_args,'--evidence',str(design_proof),ok=False)
            call('advance','--run','r','--section','games',ok=False)
            mirror.write_bytes(design.read_bytes())
            call('advance','--run','r','--section','games')
            design.write_text('changed canonical design')
            queue=json.loads(call('queue','--run','r').stdout); status=next(item for item in queue['sections'] if item['sectionId']=='games')
            self.assertTrue(status['review']['content']); self.assertTrue(status['review']['korean']); self.assertFalse(status['review']['ui'])
            call('advance','--run','r','--section','games',ok=False)
            design.unlink()
            call('advance','--run','r','--section','games')
            approved=call('approved-section','--run','r','--section','games'); self.assertEqual(json.loads(approved.stdout)['sectionId'],'games')
            call('approved-section','--run','r','--section','next',ok=False)
            call('advance','--run','r','--section','next',ok=False)
            queue=json.loads(call('queue','--run','r').stdout); statuses={item['sectionId']:item for item in queue['sections']}
            self.assertEqual(statuses['games']['state'],'complete'); self.assertTrue(statuses['next']['needsRepair'])
            self.assertEqual(queue['summary']['active'],2)
            self.assertEqual(queue['summary']['complete'],1)
            self.assertEqual(queue['summary']['needsRepair'],1)
            self.assertEqual(queue['summary']['missingReviews']['ui'],1)
            whole=d/'incomplete.json'; self.assertEqual(json.loads(call('snapshot','--run','r','--output',str(whole)).stdout)['status'],'blocked')
            conn=sqlite3.connect(db); conn.execute("UPDATE events SET evidence=?,evidence_hash=? WHERE run='r' AND section='games' AND kind='ui'",(str(badproof),hashlib.sha256(badproof.read_bytes()).hexdigest())); conn.commit(); conn.close()
            call('advance','--run','r','--section','games',ok=False)
            conn=sqlite3.connect(db); conn.execute("UPDATE events SET evidence=?,evidence_hash=? WHERE run='r' AND section='games' AND kind='ui'",(str(proof),hashlib.sha256(proof.read_bytes()).hexdigest())); conn.commit(); conn.close()
            call('advance','--run','r','--section','games')
            failed=d/'ui-failed.json'; failed.write_text(json.dumps({'observation':'화면 버튼이 겹침','findingReason':'모바일에서 공유 버튼과 본문이 겹침'}))
            failure=json.loads(call('record-failure','--run','r','--section','games','--kind','ui','--reviewer','ui-reviewer','--evidence',str(failed)).stdout)
            call('advance','--run','r','--section','games',ok=False)
            call('approve-section','--run','r','--section','games','--kind','ui','--reviewer','ui-reviewer','--evidence',str(proof),'--html',str(html),ok=False)
            incomplete=d/'ui-incomplete.json'; incomplete_data=json.loads(proof.read_text()); incomplete_data.update({'correction':'버튼 위치 수정','recheck':'다시 확인'}); incomplete.write_text(json.dumps(incomplete_data))
            call('approve-section','--run','r','--section','games','--kind','ui','--reviewer','ui-reviewer','--evidence',str(incomplete),'--html',str(html),ok=False)
            history=json.loads(call('history','--run','r').stdout); failure_id=next(e['id'] for e in reversed(history['events']) if e['kind']=='ui-blocked')
            recovered=d/'ui-recovered.json'; corrected=json.loads(proof.read_text()); corrected.update({'resolvesFailureEventId':failure_id,'correction':'버튼 위치를 수정','recheck':'네 화면 폭에서 다시 확인'}); recovered.write_text(json.dumps(corrected))
            call('approve-section','--run','r','--section','games','--kind','ui','--reviewer','ui-reviewer','--evidence',str(recovered),'--html',str(html))
            call('advance','--run','r','--section','games')
            history=json.loads(call('history','--run','r').stdout); self.assertTrue(any(e['kind']=='ui-blocked' for e in history['events']))
            invalid=d/'invalid-failure.json'; invalid.write_text(json.dumps({'observation':'증거 부족'}))
            call('record-failure','--run','r','--section','games','--kind','ui','--reviewer','ui-reviewer','--evidence',str(invalid),ok=False)
            research_data['renewalCorpus']['sections'][1]['candidate']['title']='다른 섹션 수정'
            research.write_text(json.dumps(research_data)); call('ingest','--run','r','--issue-date','2026-11-07','--research',str(research),'--author','writer')
            call('advance','--run','r','--section','games',ok=False)
            call('approve-research','--run','r','--reviewer','reviewer','--evidence',str(evidence)); call('advance','--run','r','--section','games')
            research_data['sources'][0]['scope']='바뀐 원문'; research.write_text(json.dumps(research_data)); call('ingest','--run','r','--issue-date','2026-11-07','--research',str(research),'--author','writer'); call('approve-research','--run','r','--reviewer','reviewer','--evidence',str(evidence)); call('advance','--run','r','--section','games',ok=False)
            research_data['sources'][0]['scope']='원문'; research_data['renewalCorpus']['sections'][0]['candidate']['title']='변경된 본문'; research.write_text(json.dumps(research_data)); call('ingest','--run','r','--issue-date','2026-11-07','--research',str(research),'--author','writer'); call('approve-research','--run','r','--reviewer','reviewer','--evidence',str(evidence)); call('advance','--run','r','--section','games',ok=False)
            research_data['renewalCorpus']['sections'][0]['candidate']['title']='실제 원고'; research_data['renewalCorpus']['sections'][1]['candidate']['title']='다음'; research.write_text(json.dumps(research_data)); call('ingest','--run','r','--issue-date','2026-11-07','--research',str(research),'--author','writer'); call('approve-research','--run','r','--reviewer','reviewer','--evidence',str(evidence)); call('advance','--run','r','--section','games')
            html.write_text(html_source.replace('class="content"','class="missing"')); call('advance','--run','r','--section','games',ok=False)
            html.write_text(html_source.replace('<aside>목차</aside>','')); call('advance','--run','r','--section','games',ok=False)
            html.write_text(html_source.replace('다른 문단','다음 섹션 변경')); call('advance','--run','r','--section','games')
            html.write_text(html_source)
            html.write_text(html_source.replace('<p>내용</p>','<p><span class="nowrap">내<br>용</span></p>')); call('advance','--run','r','--section','games',ok=False)
            call('approve-section','--run','r','--section','games','--kind','ui','--reviewer','ui-reviewer','--evidence',str(recovered),'--html',str(html)); call('advance','--run','r','--section','games')
            html.write_text(html_source); call('approve-section','--run','r','--section','games','--kind','ui','--reviewer','ui-reviewer','--evidence',str(recovered),'--html',str(html)); call('advance','--run','r','--section','games')
            for changed in (html_source.replace('내용','변경'),html_source.replace('https://example.com','https://example.org'),html_source.replace('공식 자료','다른 라벨'),html_source.replace('    print(1)','  print(1)')):
                html.write_text(changed); blocked=json.loads(call('advance','--run','r','--section','games',ok=False).stdout)
                self.assertIn('games: missing content review',blocked['errors']); self.assertIn('games: missing korean review',blocked['errors'])
            html.write_text(html_source)
            css.write_text('body { color: red; }'); call('advance','--run','r','--section','games',ok=False)
            css.unlink(); call('advance','--run','r','--section','games',ok=False)
            css.write_text('body { color: black; }'); call('advance','--run','r','--section','games')
            script.write_text('void 1;'); call('advance','--run','r','--section','games',ok=False)
            script.write_text('void 0;'); call('advance','--run','r','--section','games')
            html.write_text(html_source.replace('p{margin:0}','p{margin:1px}')); call('advance','--run','r','--section','games',ok=False)
            html.write_text(html_source)
            html.write_text('<section id="games"><p>바뀐 화면</p></section>')
            call('advance','--run','r','--section','games',ok=False)
            html.write_text(html_source)
            call('prepare','--run','r','--section','next','--packet',str(next_packet),'--author','writer','--media-note','미디어 없음')
            call('check','--run','r','--html',str(html),'--json',ok=False)
            packet.write_text('{"changed":true}')
            call('advance','--run','r','--section','games',ok=False)

    def test_editorial_packet_can_have_no_external_claims(self):
        with tempfile.TemporaryDirectory() as tmp:
            d=Path(tmp); install_test_skills(d); db=d/'db.sqlite'; research=d/'research.json'; packet=d/'brief.json'; evidence=d/'evidence.json'; html=d/'weekly-2026-11-07.html'
            research.write_text(json.dumps({'sources':[{'uri':'https://example.com'}]})); evidence.write_text(json.dumps({'observation':'research reviewed','sources':['https://example.com']})); html.write_text('<section id="brief"><p>읽는 법 안내</p></section>')
            def call(*args,ok=True):
                p=subprocess.run([sys.executable,str(SCRIPT),'--db',str(db),*args],capture_output=True,text=True,cwd=d)
                self.assertEqual(p.returncode==0,ok,p.stderr+p.stdout)
            call('ingest','--run','run','--issue-date','2026-11-07','--research',str(research),'--author','writer')
            call('approve-research','--run','run','--reviewer','editor','--evidence',str(evidence))
            for name in ('impeccable','humanizer','grammar-checker','style-guide','korean-humanizer','korean-spell-check'):
                call('record-skill','--run','run','--actor','writer','--phase','test','--skill-path',str(d/'.agents/skills'/name/'SKILL.md'),'--action','read','--evidence',str(evidence))
            args=['--run','run','--section','brief','--packet',str(packet),'--author','writer','--media-note','안내문']
            proof=d/'proof.json'
            def write_packet(kind):
                packet.write_text(json.dumps({'text':'읽는 법 안내','urls':[],'kind':kind},ensure_ascii=False)); packet_evidence(proof,packet,html)
                data=json.loads(proof.read_text()); data.update({'sources':[],'claimChecks':[],'noExternalClaimsReason':'외부 사실 주장이 없는 읽기 안내'})
                proof.write_text(json.dumps(data,ensure_ascii=False))
            write_packet('factual'); call('prepare',*args)
            pre=['--run','run','--section','brief','--kind','source','--reviewer','editor','--evidence',str(proof)]
            call('approve-packet',*pre,ok=False)
            write_packet('editorial_proposal'); call('prepare',*args)
            data=json.loads(proof.read_text()); del data['noExternalClaimsReason']; proof.write_text(json.dumps(data))
            call('approve-packet',*pre,ok=False)
            data['noExternalClaimsReason']='외부 사실 주장이 없는 읽기 안내'; proof.write_text(json.dumps(data))
            call('approve-packet',*pre)
            call('approve-packet','--run','run','--section','brief','--kind','korean','--reviewer','editor','--evidence',str(proof))
            call('draft',*args)
            for kind in ('content','korean','ui'):
                call('approve-section','--run','run','--section','brief','--kind',kind,'--reviewer','visual' if kind=='ui' else 'editor','--evidence',str(proof),'--html',str(html))
            call('advance','--run','run','--section','brief')

    def test_candidate_urls_are_bound_to_research(self):
        with tempfile.TemporaryDirectory() as tmp:
            d=Path(tmp); db=d/'ledger.sqlite'; research=d/'research.json'; packet=d/'packet.json'
            candidate={'text':'공식 도구','sourceUrls':['https://example.com/good']}
            data={'sources':[{'uri':'https://example.com/good'}],'renewalCorpus':{'sections':[{'sectionId':'one','candidate':candidate}],'supplementalSections':[]}}
            research.write_text(json.dumps(data)); packet.write_text(json.dumps({'text':'공식 도구','urls':['https://example.com/good'],'candidate':candidate}))
            def call(*args,ok=True):
                result=subprocess.run([sys.executable,str(SCRIPT),'--db',str(db),*args],capture_output=True,text=True,cwd=d)
                self.assertEqual(result.returncode==0,ok,result.stderr+result.stdout)
            call('ingest','--run','r','--issue-date','2026-11-07','--research',str(research),'--author','writer')
            args=['--run','r','--section','one','--packet',str(packet),'--author','writer','--media-note','검토']
            call('prepare',*args)
            payload=json.loads(packet.read_text()); payload['candidate']['media']=[{'sourceUrl':'https://evil.example/video'}]; packet.write_text(json.dumps(payload))
            call('prepare',*args,ok=False)
            del data['renewalCorpus']; research.write_text(json.dumps(data)); call('ingest','--run','r','--issue-date','2026-11-07','--research',str(research),'--author','writer')
            call('prepare',*args,ok=False)
            payload={'text':'읽기 안내','urls':[],'candidate':{'kind':'editorial_proposal','text':'안내','sourceUrls':['https://evil.example']}}; packet.write_text(json.dumps(payload))
            call('prepare',*args,ok=False)
            payload={'text':'안내','urls':[],'candidate':{'kind':'editorial_proposal','text':'안내','limitation':'최종 한국어 및 독립 검수 필요'}}; packet.write_text(json.dumps(payload))
            call('prepare',*args,ok=False)
            payload['candidate']['limitation']='직접 실행과 전체 영상 시청은 하지 않았습니다.'; payload['candidate']['sourceScope']='최종 한국어 및 독립 검수 필요'; packet.write_text(json.dumps(payload))
            call('prepare',*args)
            for key,value in [('lead','최종 한국어 및 독립 검수 필요'),('table',{'columns':['상태'],'rows':[['최종 한국어 및 독립 검수 필요']]})]:
                payload['candidate'][key]=value; packet.write_text(json.dumps(payload)); call('prepare',*args,ok=False); del payload['candidate'][key]

    def test_imports_public_attachments_and_detects_video_ids(self):
        with tempfile.TemporaryDirectory() as tmp:
            d=Path(tmp); (d/'reports').mkdir(); (d/'assets/report/research').mkdir(parents=True); (d/'private').mkdir()
            db=d/'ledger.sqlite'; old=d/'reports/weekly-2026-10-31.html'; ledger=d/'assets/report/research/videos.json'; guide=d/'reports/guide.md'
            ledger.write_text(json.dumps({'videos':[{'videoId':'abcdefghijk'}]})); guide.write_text('제작 안내 https://example.com/tutorial'); (d/'private/secret.json').write_text('SECRET'); (d/'.env').write_text('SECRET')
            (d/'assets/report/research/link.json').symlink_to(d/'private/secret.json')
            for suffix in ('.published.json','.vercel-published.json','.sent.json'): (d/'reports'/('weekly-2026-10-31.html'+suffix)).write_text('SECRET')
            old.write_text('<a href="../assets/report/research/videos.json?x=1">영상</a><a href="guide.md">안내</a><a href="../private/secret.json">비공개</a><a href="../.env">환경</a><a href="../assets/report/research/link.json">심볼릭</a><a href="https://outside.example/test.json">외부</a><a href="weekly-2026-10-31.html.published.json">발행</a><a href="weekly-2026-10-31.html.vercel-published.json">배포</a><a href="weekly-2026-10-31.html.sent.json">전송</a><section id="old"><p>예전 호</p></section>')
            def call(*args,ok=True):
                result=subprocess.run([sys.executable,str(SCRIPT),'--db',str(db),*args],capture_output=True,text=True,cwd=d)
                self.assertEqual(result.returncode==0,ok,result.stderr+result.stdout); return json.loads(result.stdout)
            args=['--run','old','--issue-date','2026-10-31','--html',str(old)]
            result=call('import-html',*args); self.assertEqual(set(result['archivedMaterials']),{'assets/report/research/videos.json','reports/guide.md'})
            self.assertGreaterEqual(len(result['skippedLinks']),6); call('import-html',*args)
            (d/'private/weekly-2026-10-31.html').write_text('PRIVATE HTML')
            with tempfile.TemporaryDirectory() as outside:
                outside_html=Path(outside)/'weekly-2026-10-31.html'; outside_html.write_text('PRIVATE HTML')
                for invalid in (['--run','bad-date','--issue-date','2026-10-30','--html',str(old)],['--run','bad-private','--issue-date','2026-10-31','--html',str(d/'private/weekly-2026-10-31.html')],['--run','bad-outside','--issue-date','2026-10-31','--html',str(outside_html)]):
                    denied=subprocess.run([sys.executable,str(SCRIPT),'--db',str(db),'import-html',*invalid],capture_output=True,text=True,cwd=d)
                    self.assertNotEqual(denied.returncode,0); self.assertIn('public report',denied.stderr)
            con=sqlite3.connect(db); self.assertEqual(con.execute('SELECT COUNT(*) FROM archive_issues').fetchone()[0],1); self.assertEqual(con.execute('SELECT COUNT(*) FROM archive_materials').fetchone()[0],2); con.close()
            ledger.write_text(json.dumps({'videos':[{'videoId':'abcdefghijk'},{'videoId':'zyxwvutsrqp'}]})); call('import-html',*args)
            old.write_text(old.read_text().replace('예전 호','변경된 예전 호')); call('import-html',*args)
            con=sqlite3.connect(db); self.assertEqual(con.execute('SELECT COUNT(*) FROM archive_issues').fetchone()[0],2); self.assertGreaterEqual(con.execute('SELECT COUNT(*) FROM archive_materials').fetchone()[0],4); self.assertNotIn('SECRET',' '.join(row[0] for row in con.execute('SELECT document FROM archive_materials'))); con.close()
            research=d/'research.json'; research.write_text(json.dumps({'sources':[{'uri':'https://www.youtube.com/watch?v=abcdefghijk'}]})); call('ingest','--run','new','--issue-date','2026-11-07','--research',str(research),'--author','writer')
            packet=d/'packet.json'; packet.write_text(json.dumps({'text':'새 영상','urls':['https://www.youtube.com/watch?v=abcdefghijk']})); call('prepare','--run','new','--section','video','--packet',str(packet),'--author','writer','--media-note','자료 확인')
            result=call('duplicates','--run','new','--section','video'); match=next(item for item in result['matches'] if item.get('artifactPath')=='assets/report/research/videos.json')
            self.assertEqual(match['source'],'prior_public_attachment'); self.assertEqual(match['videoIds'],['abcdefghijk'])

    def test_receipt_history_is_nongating_and_rejects_unsafe_paths(self):
        with tempfile.TemporaryDirectory() as tmp:
            d=Path(tmp).resolve(); db=d/'ledger.sqlite'; research=d/'research.json'; research.write_text(json.dumps({'sources':[{'uri':'https://example.com'}]}))
            def call(*args,ok=True):
                result=subprocess.run([sys.executable,str(SCRIPT),'--db',str(db),*args],capture_output=True,text=True,cwd=d)
                self.assertEqual(result.returncode==0,ok,result.stderr+result.stdout); return json.loads(result.stdout) if ok else result
            call('ingest','--run','run','--issue-date','2026-11-07','--research',str(research),'--author','writer')
            before=d/'before.json'; after=d/'after.json'; call('snapshot','--run','run','--output',str(before))
            directory=d/'_workspace/harness/weekly-game-report/run'; directory.mkdir(parents=True); file=directory/'final-review.json'
            file.write_text(json.dumps({'runId':'run','issueDate':'2026-11-07','value':'one'})); args=['--run','run','--kind','final-review','--file',str(file),'--actor','reviewer']
            call('store-receipt',*args); call('store-receipt',*args)
            file.write_text(json.dumps({'runId':'run','issueDate':'2026-11-07','value':'two'})); call('store-receipt',*args); file.unlink()
            history=call('history','--run','run'); self.assertEqual(len(history['receipts']),2); self.assertEqual([json.loads(row['document'])['value'] for row in history['receipts']],['one','two'])
            compact=call('history','--run','run','--summary'); self.assertEqual(len(compact['receipts']),2); self.assertTrue(all('document' not in row for row in compact['receipts']+compact['research'])); self.assertEqual([row['sha256'] for row in compact['receipts']],[row['sha256'] for row in history['receipts']]); self.assertIn('document',history['receipts'][0])
            call('snapshot','--run','run','--output',str(after)); self.assertEqual(before.read_bytes(),after.read_bytes())
            secret=d/'.env'; secret.write_text('{}'); call('store-receipt','--run','run','--kind','final-review','--file',str(secret),'--actor','reviewer',ok=False)
            file.write_text(json.dumps({'runId':'other','issueDate':'2026-11-07'})); call('store-receipt',*args,ok=False)
            file.unlink(); original=directory/'other.json'; original.write_text('{}'); file.symlink_to(original); call('store-receipt',*args,ok=False)
            delivery=d/'private/delivery/2026-11-07.1565894418156879942.sent.json'; delivery.parent.mkdir(parents=True); delivery.write_text(json.dumps({'issueDate':'2026-11-07','status':'sent'}))
            call('store-receipt','--run','run','--kind','delivery','--file',str(delivery),'--actor','operator')
            publication=d/'reports/weekly-2026-11-07.html.published.json'; publication.parent.mkdir(); publication.write_bytes(b'\xef\xbb\xbf'+json.dumps({'reportDate':'2026-11-07'}).encode())
            call('store-receipt','--run','run','--kind','publication','--file',str(publication),'--actor','operator')
            history=call('history','--run','run'); self.assertTrue(next(row for row in history['receipts'] if row['kind']=='publication')['document'].startswith('\ufeff'))

    def test_contract_cache_ignores_unrelated_context_only(self):
        with tempfile.TemporaryDirectory() as tmp:
            d=Path(tmp).resolve(); install_test_skills(d); db=d/'ledger.sqlite'; research=d/'research.json'; packet=d/'one.json'; evidence=d/'evidence.json'; proof=d/'one-evidence.json'; html=d/'issue.html'
            paths=['instructions/REPORT-GUIDE.md','instructions/REPORT-OUTPUT-CONTRACT.md','instructions/KOREAN-EDITORIAL-POLICY.md','instructions/DESIGN.md','instructions/QUALITY-PIPELINE.md','instructions/FORMAT-REFERENCE.md','.agents/skills/weekly-game-report/references/report-format-reference.json','.codex/agents/report-content-reviewer.toml','.codex/agents/report-ui-reviewer.toml']
            for name in paths:
                file=d/name; file.parent.mkdir(parents=True,exist_ok=True); file.write_text('fixed '+name)
            ctx=d/'_workspace/harness/weekly-game-report/run/context.json'; ctx.parent.mkdir(parents=True)
            context={'instructionFiles':{name:hashlib.sha256((d/name).read_bytes()).hexdigest() for name in paths},'note':'first'}; ctx.write_text(json.dumps(context))
            data={'instructionRevision':'a'*40,'inputs':{'context':hashlib.sha256(ctx.read_bytes()).hexdigest()},'sources':[{'uri':'https://example.com','scope':'original'}]};research.write_text(json.dumps(data))
            packet.write_text(json.dumps({'text':'fixture one','urls':['https://example.com'],'candidate':{'title':'one'}})); html.write_text('<section id="one"><p>one</p></section>'); evidence.write_text(json.dumps({'observation':'checked','sources':['https://example.com']})); packet_evidence(proof,packet,html)
            def call(*args,ok=True):
                result=subprocess.run([sys.executable,str(SCRIPT),'--db',str(db),*args],capture_output=True,text=True,cwd=d)
                self.assertEqual(result.returncode==0,ok,result.stderr+result.stdout);return json.loads(result.stdout) if ok else result
            def ingest_and_review():
                call('ingest','--run','run','--issue-date','2026-11-07','--research',str(research),'--author','writer');call('approve-research','--run','run','--reviewer','editor','--evidence',str(evidence))
            ingest_and_review()
            for name in ('impeccable','humanizer','grammar-checker','style-guide','korean-humanizer','korean-spell-check'):
                call('record-skill','--run','run','--actor','writer','--phase','test','--skill-path',str(d/'.agents/skills'/name/'SKILL.md'),'--action','read','--evidence',str(evidence))
            args=['--run','run','--section','one','--packet',str(packet),'--author','writer','--media-note','checked'];call('prepare',*args)
            for kind in ('source','korean'):call('approve-packet','--run','run','--section','one','--kind',kind,'--reviewer','editor','--evidence',str(proof))
            call('draft',*args)
            for kind in ('content','korean','ui'):call('approve-section','--run','run','--section','one','--kind',kind,'--reviewer','visual' if kind=='ui' else 'editor','--evidence',str(proof),'--html',str(html))
            call('advance','--run','run','--section','one')
            context['note']='different unrelated context';ctx.write_text(json.dumps(context));data['inputs']['context']=hashlib.sha256(ctx.read_bytes()).hexdigest();research.write_text(json.dumps(data));ingest_and_review()
            call('advance','--run','run','--section','one')
            quality=d/'instructions/QUALITY-PIPELINE.md';quality.write_text('changed policy');call('advance','--run','run','--section','one',ok=False);quality.write_text('fixed instructions/QUALITY-PIPELINE.md');call('advance','--run','run','--section','one')
            fmt=d/'instructions/FORMAT-REFERENCE.md';fmt.write_text('changed format');call('advance','--run','run','--section','one',ok=False);fmt.write_text('fixed instructions/FORMAT-REFERENCE.md');call('advance','--run','run','--section','one')
            (d/paths[0]).write_text('modified contract');call('advance','--run','run','--section','one',ok=False)
            (d/paths[0]).write_text('fixed '+paths[0]);context['instructionFiles'].pop(paths[1]);ctx.write_text(json.dumps(context));data['inputs']['context']=hashlib.sha256(ctx.read_bytes()).hexdigest();research.write_text(json.dumps(data));ingest_and_review();call('advance','--run','run','--section','one',ok=False)

    def test_full_issue_snapshot_and_history(self):
        with tempfile.TemporaryDirectory() as tmp:
            d=Path(tmp); install_test_skills(d); db=d/'_workspace'/'weekly-game-report.sqlite3'; research=d/'research.json'; evidence=d/'evidence.json'; html=d/'reports'/'weekly-2026-11-07.html'; html.parent.mkdir(); snapshot=d/'_workspace/harness/weekly-game-report/run/ledger-snapshot.json'
            ids=['issue-summary','top10','game-ai-tools','github-trending','ai-trends','game-ai','ai-releases','techniques','games','reverse','ai-only-lab','ai-planning','game-ideas','ai-production','prototype','lab','careers','opportunities','reading','sources']
            research.write_text(json.dumps({'sources':[{'uri':'https://example.com'}]}))
            evidence.write_text(json.dumps({'observation':'verified official source','sources':['https://example.com'],'mediaFinding':'no relevant media'}))
            html.write_text('<main class="content"><div id="issue-summary"><div class="issue-summary-layout">Summary</div></div>'+''.join('<section id="'+i+'"><p>'+i+'</p></section>' for i in ids[1:])+'</main>')
            def call(*args,ok=True):
                result=subprocess.run([sys.executable,str(SCRIPT),'--db',str(db),*args],capture_output=True,text=True,cwd=d)
                self.assertEqual(result.returncode==0,ok,result.stderr+result.stdout)
                return result
            prior=d/'reports'/'weekly-2026-10-24.html'; prior.write_text('<section id="prior"><p>이전 공개 호 내용</p><a href="https://old.example/">자료</a></section>')
            call('import-html','--run','old-1','--issue-date','2026-10-24','--html',str(prior))
            prior2=d/'reports'/'weekly-2026-10-31.html'; prior2.write_text(prior.read_text())
            call('import-html','--run','old-2','--issue-date','2026-10-31','--html',str(prior2))
            call('ingest','--run','run','--issue-date','2026-11-07','--research',str(research),'--author','writer')
            call('approve-research','--run','run','--reviewer','editor','--evidence',str(evidence))
            for name in ('impeccable','humanizer','grammar-checker','style-guide','korean-humanizer','korean-spell-check'):
                call('record-skill','--run','run','--actor','fixture','--phase','design','--skill-path',str(d/'.agents/skills'/name/'SKILL.md'),'--action','read','--evidence',str(evidence))
            for name in ids:
                packet=d/(name+'.json'); packet.write_text(json.dumps({'text':name,'urls':['https://example.com']}))
                proof=d/(name+'-evidence.json'); packet_evidence(proof,packet,html)
                args=['--run','run','--section',name,'--packet',str(packet),'--author','writer','--media-note','checked']
                call('prepare',*args)
                for kind in ('source','korean'): call('approve-packet','--run','run','--section',name,'--kind',kind,'--reviewer','editor','--evidence',str(proof))
                call('draft',*args)
                fragment=d/'reports'/('fragment-'+name+'.html');shutil.copy(html,fragment)
                for kind in ('content','korean','ui'): call('approve-section','--run','run','--section',name,'--kind',kind,'--reviewer','visual' if kind=='ui' else 'editor','--evidence',str(proof),'--html',str(fragment))
                self.assertEqual(json.loads(call('approved-section','--run','run','--section',name).stdout)['sectionId'],name)
            conn=sqlite3.connect(db);conn.execute("UPDATE sections SET position=100 WHERE run='run' AND id='issue-summary'");conn.execute("UPDATE sections SET position=0 WHERE run='run' AND id='sources'");conn.execute("UPDATE sections SET position=19 WHERE run='run' AND id='issue-summary'");conn.commit();conn.close()
            snapshot.parent.mkdir(parents=True,exist_ok=True)
            call('snapshot','--run','run','--output',str(snapshot))
            call('check','--run','run','--html',str(html),'--snapshot',str(snapshot),'--prior-dir',str(d/'reports'))
            fragment=d/'reports/fragment-top10.html'; original_fragment=fragment.read_text(); fragment.write_text(original_fragment.replace('<p>top10</p>','<p>tampered</p>'))
            call('check','--run','run','--html',str(html),'--snapshot',str(snapshot),'--prior-dir',str(d/'reports'),ok=False)
            fragment.write_text(original_fragment);call('check','--run','run','--html',str(html),'--snapshot',str(snapshot),'--prior-dir',str(d/'reports'))
            (d/'workflows').mkdir(); shutil.copy(SCRIPT,d/'workflows/report-ledger.py')
            summary=Path(str(html)+'.summary.txt'); summary.write_text('시험 전용 요약',encoding='utf8')
            receipt={'summarySha256':hashlib.sha256(summary.read_bytes()).hexdigest(),'schemaVersion':1,'issueDate':'2026-11-07','runId':'run','htmlSha256':hashlib.sha256(html.read_bytes()).hexdigest(),'snapshotPath':'_workspace/harness/weekly-game-report/run/ledger-snapshot.json','snapshotSha256':hashlib.sha256(snapshot.read_bytes()).hexdigest()}
            Path(str(html)+'.pipeline.json').write_text('\ufeff'+json.dumps(receipt),encoding='utf8')
            helper=SCRIPT.with_name('validate-quality-pipeline.mjs').as_uri()
            js="import {validateQualityPipeline} from '"+helper+"'; import fs from 'node:fs/promises'; await validateQualityPipeline({root:process.argv[1],htmlPath:process.argv[2],html:await fs.readFile(process.argv[2],'utf8'),issueDate:'2026-11-07'});"
            verified=subprocess.run(['node','--input-type=module','-e',js,str(d),str(html)],capture_output=True,text=True)
            self.assertEqual(verified.returncode,0,verified.stderr)
            original_summary=summary.read_text(); summary.write_text('변조된 요약')
            denied=subprocess.run(['node','--input-type=module','-e',js,str(d),str(html)],capture_output=True,text=True); self.assertNotEqual(denied.returncode,0)
            summary.write_text(original_summary)
            operating=d/'operating'; (operating/'reports').mkdir(parents=True); (operating/'site').symlink_to(d,target_is_directory=True)
            deployed=operating/'reports'/html.name; shutil.copy(html,deployed); shutil.copy(str(html)+'.pipeline.json',str(deployed)+'.pipeline.json'); shutil.copy(summary,str(deployed)+'.summary.txt')
            verified=subprocess.run(['node','--input-type=module','-e',js,str(operating),str(deployed)],capture_output=True,text=True)
            self.assertEqual(verified.returncode,0,verified.stderr)
            deployed.write_text(deployed.read_text()+'tamper')
            denied=subprocess.run(['node','--input-type=module','-e',js,str(operating),str(deployed)],capture_output=True,text=True)
            self.assertNotEqual(denied.returncode,0)
            (d/'top10.json').unlink()
            history=json.loads(call('history','--run','run').stdout)
            self.assertTrue(any(item['section']=='top10' for item in history['packets']))
            call('check','--run','run','--html',str(html),'--snapshot',str(snapshot),'--prior-dir',str(d/'reports'),ok=False)

    def test_concurrent_prepare_allocates_unique_positions(self):
        with tempfile.TemporaryDirectory() as tmp:
            d=Path(tmp).resolve(); db=d/'ledger.sqlite'; research=d/'research.json'
            research.write_text(json.dumps({'sources':[{'uri':'https://example.com'}]}))
            def execute(*args): return subprocess.run([sys.executable,str(SCRIPT),'--db',str(db),*args],capture_output=True,text=True,cwd=d)
            result=execute('ingest','--run','parallel','--issue-date','2026-11-07','--research',str(research),'--author','writer');self.assertEqual(result.returncode,0,result.stderr)
            def prepare(i):
                packet=d/f'packet-{i}.json';packet.write_text(json.dumps({'text':f'내용 {i}','urls':['https://example.com']}))
                return execute('prepare','--run','parallel','--section',f'section-{i}','--packet',str(packet),'--author','writer','--media-note','미디어 없음')
            with ThreadPoolExecutor(max_workers=20) as pool: results=list(pool.map(prepare,range(20)))
            for result in results:self.assertEqual(result.returncode,0,result.stderr)
            conn=sqlite3.connect(db); positions=[row[0] for row in conn.execute("SELECT position FROM sections WHERE run='parallel' ORDER BY position")];conn.close()
            self.assertEqual(positions,list(range(20)))

    def test_existing_duplicate_positions_fail_without_changing_data(self):
        with tempfile.TemporaryDirectory() as tmp:
            d=Path(tmp).resolve(); db=d/'old.sqlite'; conn=sqlite3.connect(db)
            conn.execute('CREATE TABLE sections(run TEXT,id TEXT,position INTEGER,packet TEXT,packet_hash TEXT,author TEXT,media_note TEXT,imported INTEGER,stage TEXT,PRIMARY KEY(run,id))')
            conn.executemany('INSERT INTO sections VALUES(?,?,?,?,?,?,?,?,?)',[('run','first',0,'a','x','w','note',0,'prepared'),('run','second',0,'b','y','w','note',0,'prepared')]);conn.commit();conn.close()
            result=subprocess.run([sys.executable,str(SCRIPT),'--db',str(db),'init'],capture_output=True,text=True,cwd=d)
            self.assertNotEqual(result.returncode,0);self.assertIn('UNIQUE constraint failed',result.stderr)
            conn=sqlite3.connect(db);self.assertEqual(conn.execute('SELECT id,position FROM sections ORDER BY id').fetchall(),[('first',0),('second',0)]);conn.close()

    def test_migrates_existing_section_without_deleting_rows(self):
        with tempfile.TemporaryDirectory() as tmp:
            db=Path(tmp)/'old.sqlite'; conn=sqlite3.connect(db)
            conn.execute('CREATE TABLE sections(run TEXT,id TEXT,position INTEGER,packet TEXT,packet_hash TEXT,author TEXT,media_note TEXT,imported INTEGER,PRIMARY KEY(run,id))')
            conn.execute("INSERT INTO sections VALUES('legacy','one',0,'data','hash','author','note',1)"); conn.commit(); conn.close()
            result=subprocess.run([sys.executable,str(SCRIPT),'--db',str(db),'init'],capture_output=True,text=True)
            self.assertEqual(result.returncode,0,result.stderr)
            conn=sqlite3.connect(db); self.assertEqual(conn.execute('SELECT stage FROM sections').fetchone()[0],'prepared'); self.assertEqual(conn.execute('SELECT count(*) FROM sections').fetchone()[0],1)

    def test_fixture_rejects_repository_root(self):
        helper=SCRIPT.parent/'fixtures/report-ledger-fixture.py'
        result=subprocess.run([sys.executable,str(helper),str(SCRIPT.parent.parent),str(SCRIPT.parent.parent/'reports/weekly-2026-11-07.html')],capture_output=True,text=True)
        self.assertNotEqual(result.returncode,0)
        self.assertIn('marked temporary root',result.stderr)

if __name__=='__main__': unittest.main()
