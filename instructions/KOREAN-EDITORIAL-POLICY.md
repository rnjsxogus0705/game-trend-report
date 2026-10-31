# 게임 리포트 한국어 편집 기준

출처: https://github.com/DaleSeo/korean-skills
적용 기준 버전: ae12ba27982ebeff03b46dc738365aaa34260d9a (MIT). 위 저장소에서 설치한 humanizer, grammar-checker, style-guide의 SKILL.md와 관련 참조 문서를 사용한다. 스킬이 업데이트되면 의미 보존 기준을 다시 확인한다.

1. humanizer: 번역투, 추상 주어와 만능 동사, 불필요한 명사화, 반복되는 수식어를 맥락에 맞게 다듬는다. 전문 용어를 모두 쉬운 말로 치환하거나 해요체를 무작위로 바꾸지 않는다. 대규모 수정 대신 최소 수정으로 뜻을 보존한다.
2. grammar-checker: 맞춤법 → 띄어쓰기 → 조사·어미·호응 → 문장부호 순서로 실제 문장을 검토한다. 확실한 오류와 권장·선택 사항을 구분한다. 단위 표기와 보조 용언은 문맥과 허용 표기를 고려한다. 참고 문서의 예시가 서로 충돌하면 기계적으로 적용하지 않는다.
3. style-guide: 학생을 독자로 한 해요체와 용어·날짜·수치·출처 표기를 통일한다. 제목, 표 머리, 코드와 인용문의 문체는 본문과 다를 수 있다.

권장 용어: 핵심 루프(처음에 반복 구조를 설명), 완료 조건, 프로토타입, 플레이어(게임을 하는 사람), 사용자(도구·서비스 이용자), 가상 실행(확률 모형 실험), 플레이테스트(실제로 게임을 하는 검증), 데이터 형식, FSM(처음에 유한 상태 머신이라고 설명). Unity, C#, CSV, ID, 모델·제품명, 원본 채용공고의 직무명은 정확히 보존한다. 같은 말로 바꾸면 의미가 달라지는 개념은 구분한다.

발행 전 의미 보존 검사는 숫자·날짜·고유명사, 인과 방향, 부정, 직접 인용, 핵심 주장·불확실성, 말투의 여섯 항목이다. 교정 전후 숫자와 URL을 비교하고, 자동 비교만으로 의미 검토를 대신하지 않는다. 코드·수식·API·링크·HTML ID와 차트 데이터는 편집 대상에서 제외한다. 사실 확인 과정에서 바뀐 내용과 문장 교정은 별도 기록한다.

검토 기록은 모델 편집 기록이다. 외부 문법 검사기나 사람이 검수한 것처럼 표시하지 않고, 근거 없는 자연스러움 점수·AI 판별 정확도를 쓰지 않는다. 현재 예시는 `quality/2026-10-31-korean/review.json`에 있다. 실제 교정·최종 검토를 마친 뒤에만 최종 HTML 해시가 든 `.language-review.json`을 작성한다.

## 자연스러운 표현과 최종 검수 (2026-11-07 발행 호부터 필수)

[NomaDamas/k-skill](https://github.com/NomaDamas/k-skill)의 `korean-humanizer`와 `korean-spell-check`를 사용한다. 적용 기준은 소스 커밋 `cf462ca81af7f83691e7c4b7c4fe0ceb0331fefa`, CLI `@nomadamas/k-skill@0.10.4`다. 두 스킬의 SKILL.md는 실행 지침을 안내하는 스텁이므로 모델이 실제 교정을 시작하기 전에 아래 명령의 전체 출력을 읽는다. 사용자 동의 없이 모든 스킬을 갱신하는 `update`는 실행하지 않는다. 프로젝트에서 필요한 두 스킬만 별도로 설치한다.

```powershell
$env:KSKILL_ANALYTICS_DISABLED = '1'
npx -y @nomadamas/k-skill@0.10.4 instruct korean-humanizer
npx -y @nomadamas/k-skill@0.10.4 instruct korean-spell-check
```

1. 기존 humanizer를 적용하고 `korean-humanizer`의 기준으로 문맥을 읽어 자연스럽게 고친다. 바꿀 필요가 없는 곳은 남긴다. 숫자·날짜·실제 제품과 고유명사·URL·인용·불확실성·인과 방향을 보존하고 허위 예시나 효과를 더하지 않는다. 창작한 게임명·아이디어명은 지나치게 추상적이면 게임에서 무엇을 하는지 드러나는 표현으로 고치되, 본문과 다운로드·복사용 요청서 사이의 이름을 일치시킨다. 전문 용어는 첫 등장에 쉬운 풀이를 붙인다.
2. 기존 `grammar-checker`, `style-guide` 순서로 맞춤법·띄어쓰기·문체를 실제로 검토한다. 이전 영수증과의 호환을 위해 `.language-review.json`의 `pipeline`은 `["humanizer","grammar-checker","style-guide"]`로 유지한다. 새 스킬 검수는 아래 별도 필드에 기록한다.
3. 수정자와 독립된 최종 검수자가 원문·수정본을 대조한다. 모델 검토이면 사람 검수라고 표시하지 않는다. 공개 HTML의 제목, 본문 마지막 문장까지, 접힌 내용, 캡션, 표와 복사용 요청서, 함께 발행하는 각 Markdown을 빠짐없이 읽고 의미 보존 여섯 항목을 확인한다. 각 파일의 최종 SHA-256과 검토 범위를 남긴다. 최종 검수 이후 파일을 고치면 해당 파일을 다시 검수하고 해시를 갱신한다.
4. `korean-spell-check`의 공개 웹 검사는 사용자가 요청한 소량의 최종 검수에 한정한다. 공급자 조건·접근 가능성·민감정보 공개 여부를 확인하고 저빈도로 실행한다. 정기 예약에서 문서 전체를 외부 서비스에 대량 제출하거나 배치 검사하지 않는다. 조건이 맞지 않거나 접속에 실패하면 모델·수동 검토로 대체하고 외부 검증을 수행했다고 쓰지 않는다.

최종 `.language-review.json`에 기존 필드와 별도로 `naturalnessReview`를 기록한다. `editor`와 `reviewer`에는 서로 다른 실행 주체를 적는다. `coverage`는 실제로 검토한 다음 8개 값을 담은 배열이다: `body`, `headings`, `tables`, `captions`, `collapsed`, `copy`, `downloads`, `terms`. `sectionIdsReviewed`에는 HTML의 모든 `<section id="…">`의 ID와 `agent-skills`를 기록한다. `changes`는 `path`, `before`, `after`, `reason`이 있는 변경 목록이며 실제 변경이 없으면 빈 배열로 둔다. `fileHashes`는 해당 주간 HTML과 같은 호의 모든 Markdown 파일을 경로 없는 파일명(basename)으로 키를 만들고 각 최종 SHA-256을 값으로 넣는다. `externalVerified`는 외부 검사 실제 수행 여부다. true이면 `externalScope`에 검사 범위를 적고, `method`에는 실제 수행한 방법 또는 모델·수동 대체 이유를 적는다. 수행하지 않은 범위를 기록하지 않는다. 필드 유효성은 `validate-language-review.mjs`가 검사하지만 실제 자연스러움과 의미 보존을 자동으로 판정하지는 않는다.
