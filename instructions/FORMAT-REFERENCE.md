# 주간 리포트 형식 참조

새 호를 기획하기 전에 `.agents/skills/weekly-game-report/references/report-format-reference.json`의 기준 파일과 해시를 확인한다. 2026-10-31호와 2026-11-07호의 정보 구조, 카드, 목차와 읽기 동작을 참고한다. 이전 호의 사실, 숫자, 영상 또는 발행 상태를 새 자료로 복사하지 않는다.

표지와 `main.content`, 네 묶음 목차, 상단 요약, 순번과 본문을 구분한 TOP 10 및 필요한 카드·출처를 유지한다. 각 자료의 원문, 확인일, 게시일과 선정 이유를 확인한다. 미확인 값은 명시하고 자료가 없는 종류는 조사 범위와 한계를 남긴다. 영상과 그림은 출처·대체 텍스트·확인 범위를 구분한다. 각 아이디어와 AI 제작 계획은 개별 Markdown 전체를 접힌 `pre/code.language-markdown`에 담고 동일 내용을 복사할 수 있어야 한다.

작성자는 공통 HTML과 스타일, 스크립트의 기준 사본을 고정한다. 병렬 작성자는 승인된 패킷으로 자기 섹션의 후보 파일만 만들고 공통 파일을 수정하지 않는다. 조정자는 `workflows/assemble-report-sections.mjs`로 공통 셸, 스타일·스크립트 해시, 패킷과 섹션 해시, DOM ID를 검증한 다음 단일 결과를 조립한다. 필요한 섹션이 없거나 충돌·변조가 있으면 중단하고 다시 작성한다. 실제 의미·한국어·원문 및 독립 화면 검수는 이 기계 검사를 통과했다고 면제되지 않는다.

320·390·768·1440px의 실제 화면에서 이전 호와 같은 폭의 카드, 펼친 상세, 필터의 select·button 계산 스타일과 조작, 문장 줄바꿈, 최소 글자 크기, 포커스, 복사, 접기, 미디어 표시·영상 대체 링크와 인쇄를 확인한다. 원문 링크만 나열했는지와 실제 표시된 미디어를 구분한다. [미디어 계획과 실제 화면 검수](QUALITY-PIPELINE.md#미디어-계획과-실제-화면-검수)의 섹션별 조사·배치·이유를 SQLite 및 검수 증거와 대조한다. 미디어 또는 자료를 구하지 못하면 부적절한 자료로 수량을 채우지 않고 확인한 범위와 사유를 기록한다.

`gitRevision`이 있는 기준은 working tree가 아니라 `git show <gitRevision>:<path>`의 실제 바이트로 SHA256을 확인한다. 기준별 capabilities가 지원 범위를 표시한다. Oct31은 개별 Markdown 전체 복사 기준이고, 고정 Nov7 a9e84e4는 셸·목차 참고이며 전체 원문 복사가 구현된 예시가 아니다. JSON의 targetContract는 새 결과의 필수 조건이다. 날짜는 가능한 `.cover-meta time[datetime]`을 쓰고, 과거 `.issue-cover > p` 대안은 실제 날짜 텍스트와 발행일을 대조한다.

공통 셸과 상태 목록은 `references/report-format-reference.json`의 `coreUi`와 루트 `DESIGN.md`를 따른다. 가장 최근 실제 검수본의 컴포넌트 형식을 우선하고, 고정된 부실 과거본을 폼·미디어 완성 예시로 복제하지 않는다. 공유 버튼은 정적 셸에도 포함하고 긴 본문 중간에서도 찾을 수 있어야 한다. 새 디자인 기준은 UI 증거의 `designContractSha256`으로 결속하며 존재하는 버튼과 실제 동작을 각각 확인한다.

다음 호의 우선 고정 예시는 `4a4b675891efa60044cdf03dfd81e6cae41bb2f7`의 2026-11-07호다. JSON의 해당 SHA256과 git 객체를 대조하고 개선된 카드·공유·미디어·전체 Markdown 복사·독자용 문장 구조를 참고한다. 이전 a9e84e4는 실패 비교용으로만 둔다. 공통 디자인·셀렉터·동작을 착수 전에 고정해 제작 막바지의 전역 수정과 전체 UI 재검수를 줄인다.


## 섹션별 구조화 템플릿과 SQLite 캐시

원본은 `.agents/skills/weekly-game-report/references/section-templates.json`이다. 22개 섹션의 그룹·작업 범위·중첩 소유·필수 원고·미디어·실습·검수 기준과 빈 컴포넌트를 제공한다. 두 호의 실제 참조 해시를 대조하고, 공통 디자인과 스타일은 실행 당시 해시로 고정한다. 템플릿 예시의 플레이스홀더는 작성 설명이며 공개 결과물이 아니다. 이전 본문의 사실·영상·그림·날짜를 새 호에 자동 복사하지 않는다.

```sh
python3 workflows/report-template-store.py import
python3 workflows/report-template-store.py check
python3 workflows/report-template-store.py list
python3 workflows/report-template-store.py section --id reading
python3 workflows/report-template-store.py section --id reading --run 실제-run-id
```

시작 시 import/check를 한 번 수행하고 실제 카탈로그 경로·SHA256을 context에 기록한다. Git의 카탈로그가 단일 원본이고 SQLite `template_versions`/`template_sections`는 hash별 불변 조회 캐시다. 원문·기존 연구·승인 이력을 템플릿마다 복제하지 않는다. 변경되면 새 버전으로 적재하고 기존 버전은 보존한다. 다른 PC에서는 카탈로그로 캐시를 재구축할 수 있다.

조사 담당에는 해당 섹션의 fields·media·practice, 작성 담당에는 해당 템플릿과 원장의 승인 패킷만 전달한다. `section --run`은 기존 packet 게이트를 직접 호출하므로 stale/미승인 자료를 승인으로 우회하지 못한다. 템플릿 전용 조회는 승인과 독립 검수가 아니다. `game-ai-tools`와 하위 `agent-skills`는 같은 작업 범위를 유지한다. 공유 shell·CSS·JS는 감독자 단일 소유, 섹션 fragment만 병렬 작성한다.

읽을거리·게임의 영상은 링크 목록만으로 미디어 배치 완료로 표시하지 않는다. 해당 호의 선정 자료에 맞는 이미지·미리보기·플레이어를 배치하고 임베드 불가·권리·접근 문제는 원장에 남긴다. 두 호의 수량 차이는 검수 후보이며 최소 수량을 억지로 채우는 기준이 아니다. 생성 그림은 의미가 있는 곳에 실제 생성·출처·한국어 검수를 거쳐 추가한다. 공유·읽기·복사·다운로드·필터·인쇄와 4폭 화면 검수는 기존 coreUi 계약대로 유지한다.
