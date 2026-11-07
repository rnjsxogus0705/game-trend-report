import {test} from 'node:test';
import assert from 'node:assert/strict';
import {sectionMetrics,compareQuality,validateLayoutContract} from './audit-report-quality.mjs';
test('섹션 실제 미디어와 축약·반복 후보를 비교한다',()=>{
 const prior=sectionMetrics('<section id="games"><p>'+('이전 사례 설명 '.repeat(40))+'</p><img src="a.png" alt="게임 화면"><a href="https://www.youtube.com/watch?v=abcdefghijk">제작자 영상</a></section>');
 const sentence='같은 설명을 단순 반복하면 독자가 새로 배울 정보가 없어지므로 검수 후보로 표시한다.';
 const current=sectionMetrics('<section id="games"><p>'+sentence+'</p><p>'+sentence+'</p><a href="https://example.com">출처</a></section>');
 const result=compareQuality(current,prior)[0];
 assert.deepEqual(result.flags,['depth_reduced','images_removed','videos_removed','repeated_paragraphs']);
 assert.equal(result.links[0],'https://example.com');
 assert.equal(prior[0].videos[0],'abcdefghijk');
});
test('처음 등장한 섹션은 이전 호 부재를 명시하고 가짜 축약 판정을 내리지 않는다',()=>{
 const result=compareQuality(sectionMetrics('<section id="new"><p>새로운 정보</p></section>'),[])[0];
 assert.equal(result.prior,null);assert.deepEqual(result.flags,[]);
});

test('이전 UI 파손을 유발한 TOP10 직접 자식 불일치를 차단한다',()=>{
 const shell='<main class="content"><div id="issue-summary"><div class="issue-summary-layout"></div></div>CONTENT</main>';
 assert.doesNotThrow(()=>validateLayoutContract(shell.replace('CONTENT','<li class="top-ten-item"><span class="top-rank">1</span><div>본문</div></li>')));
 assert.throws(()=>validateLayoutContract(shell.replace('CONTENT','<li class="top-ten-item"><span>1</span><p>제목</p><p>본문</p></li>')),/two-column/);
});
