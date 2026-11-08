import {test} from 'node:test';
import assert from 'node:assert/strict';
import {validateReportIds} from './validate-weekly-presentation.mjs';

test('유사 속성, 주석과 스크립트 문자열은 DOM ID가 아니다',()=>{
 const html=`<main id="report"><section id="games"><div data-infographic-id="games"></div></section><!-- <p id="games"></p> --><script>const x = '<p id="games">';</script></main>`;
 assert.deepEqual(validateReportIds(html),['report','games']);
});

test('실제 요소의 중복 ID는 따옴표 형식과 무관하게 거부한다',()=>{
 assert.throws(()=>validateReportIds(`<main><p id='same'></p><p id=same></p></main>`),/Duplicate DOM IDs/);
});

test('script·style을 가린 뒤에도 원문 인덱스는 실제 요소 위치와 일치한다',async()=>{
 const {reportElements}=await import('./validate-weekly-presentation.mjs');
 const html='<html><head><style>.x{content:"🕹 <p>"}</style><script>const y="<span>긴 내용</span>";</script></head><body><p id="notice">실제 안내</p></body></html>';
 const {source,elements}=reportElements(html),notice=elements.find(n=>n.attrs.id==='notice');
 assert.equal(source.length,html.length);
 assert.equal(html.slice(notice.start,notice.end),'<p id="notice">실제 안내</p>');
});
