import {test} from 'node:test';
import assert from 'node:assert/strict';
import {sectionMetrics,compareQuality,validateLayoutContract} from './audit-report-quality.mjs';
test('섹션 실제 미디어와 축약·반복 후보를 비교한다',()=>{
 const prior=sectionMetrics('<script src="../assets/report/rich-media.js"></script><section id="games"><p>'+('이전 사례 설명 '.repeat(40))+'</p><img src="a.png" alt="게임 화면"><div class="youtube-preview"><button data-youtube-play="abcdefghijk">영상</button></div><a href="https://www.youtube.com/watch?v=abcdefghijk">제작자 영상</a></section>');
 const sentence='같은 설명을 단순 반복하면 독자가 새로 배울 정보가 없어지므로 검수 후보로 표시한다.';
 const current=sectionMetrics('<section id="games"><p>'+sentence+'</p><p>'+sentence+'</p><a href="https://example.com">출처</a></section>');
 const result=compareQuality(current,prior)[0];
 assert.deepEqual(result.flags,['depth_reduced','images_removed','videos_removed','repeated_paragraphs']);
 assert.equal(result.links[0],'https://example.com');
 assert.equal(prior[0].videos[0],'abcdefghijk');
});
test('링크만 있는 영상과 실제 플레이어 후보를 구분한다',()=>{
 const wrap=body=>sectionMetrics('<script src="../assets/report/rich-media.js"></script><script src="weekly-2026-11-07.js"></script><section id="video">'+body+'</section>')[0];
 const link='<a href="https://www.youtube.com/watch?v=abcdefghijk">원문</a>';
 const only=wrap(link);
 assert.deepEqual(only.videoLinks,['abcdefghijk']);assert.deepEqual(only.videos,[]);
 assert.deepEqual(compareQuality([only],[])[0].flags,['link_only_media']);
 const lazy='<div class="youtube-preview"><button data-youtube-play="abcdefghijk">보기</button></div>';
 assert.deepEqual(wrap(link+lazy).videos,['abcdefghijk']);
 assert.deepEqual(compareQuality([wrap(link+lazy)],[])[0].flags,[]);
 assert.deepEqual(compareQuality([wrap(link+lazy+'<a href="https://youtu.be/12345678901">두 번째</a>')],[])[0].flags,['link_only_media']);
 const slot='<div><button data-play-video="12345678901">보기</button><div class="video-slot"></div></div>';
 assert.deepEqual(wrap(slot).videos,['12345678901']);
 assert.deepEqual(wrap('<button data-play-video="12345678901">보기</button>').videos,[]);
 assert.deepEqual(wrap('<button data-youtube-play="12345678901">보기</button><iframe src="https://example.com/page"></iframe>').videos,[]);
 assert.deepEqual(wrap('<a href="https://notyoutube.com/watch?v=abcdefghijk">유사 주소</a>').videoLinks,[]);
 assert.deepEqual(wrap('<iframe src="https://www.youtube-nocookie.com/embed/abcdefghijk"></iframe><video controls src="https://example.com/demo.mp4"></video>').videos,['abcdefghijk','https://example.com/demo.mp4']);
 assert.deepEqual(wrap('<video controls><source src="https://example.com/demo.webm"></video>').videos,['https://example.com/demo.webm']);
 const vimeo=wrap('<a href="https://vimeo.com/12345">원문</a><iframe src="https://player.vimeo.com/video/12345"></iframe>');
 assert.deepEqual(vimeo.videoLinks,['vimeo:12345']);assert.deepEqual(vimeo.videos,['vimeo:12345']);assert.deepEqual(compareQuality([vimeo],[])[0].flags,[]);
});
test('출처 목록과 핸들러 없는 가짜 미리보기를 구분한다',()=>{
 const button='<div class="youtube-preview"><button data-youtube-play="abcdefghijk">보기</button></div>';
 const slot='<div><button data-play-video="12345678901">보기</button><div class="video-slot"></div></div>';
 const wrap=(body,scripts='')=>sectionMetrics(scripts+'<section id="video">'+body+'</section>')[0];
 assert.deepEqual(wrap(button+slot).videos,[]);
 assert.deepEqual(wrap(button+slot,'<script src="../assets/report/report.js"></script>').videos,[]);
 assert.deepEqual(wrap(button+slot,'<script src="../assets/report/rich-media.js"></script>').videos,['abcdefghijk']);
 assert.deepEqual(wrap(button+slot,'<script src="weekly-2026-11-07.js"></script>').videos,['12345678901']);
 assert.deepEqual(wrap(button+slot,'<script src="weekly-1999-01-01.js"></script>').videos,[]);
 const sources=sectionMetrics('<section id="sources"><a href="https://youtu.be/abcdefghijk">영상 출처</a></section>');
 assert.deepEqual(sources[0].videoLinks,['abcdefghijk']);assert.deepEqual(compareQuality(sources,[])[0].flags,[]);
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
