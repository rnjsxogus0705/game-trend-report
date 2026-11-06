# 제작·배포·전송 워크플로우

## Windows 지침 갱신
1. 다른 환경에서 instructions/와 workflows/를 편집하고 main에 커밋·푸시합니다.
2. 이 PC의 `sync-instructions.ps1`이 원격 main을 fetch하고 fast-forward로 갱신합니다. 매시간 확인하고, 토요일 제작·전송 시작 직전에도 확인합니다.
3. 허용된 파일만 로컬에 복사하고 적용 커밋·파일 해시·시각을 비공개 상태 파일에 기록합니다. 양쪽에서 수정한 파일은 덮어쓰지 않고 충돌을 알립니다. 강제 초기화나 강제 푸시는 하지 않습니다.
4. 동기화 후 변경된 지침을 다시 읽고 작업합니다. 지침 변경이 기존 호를 자동 재작성하거나 재전송하지는 않습니다. 새 호부터 적용하며 과거 호 변경은 별도 작업으로 처리합니다.

## Windows 토요일 07:00 한국 시간: 조사·작성·배포
동기화 → 최신 지침 읽기 → 최근 7일 원문 조사와 최근 해외 AI 제작 사례 조사 → 출처·주장·출시 상태 기록 → HTML·호별 자료와 섹션별 실습 프롬프트 작성 → 한국어 교정 → 독립 내용·제목·문맥 검수 → 지적 수정과 해당 부분 재검수 → build-site.mjs로 로컬 site/reports에 복사 → site를 루트로 한 HTTP 미리보기에서 실제 화면·링크·복사·다운로드 검사 → validate-issue.mjs → publish-report.ps1 → Pages와 Vercel 본문 일치 확인 → 요약 저장. 이 단계에서는 전송하지 않습니다.

## Windows 토요일 08:00 한국 시간: 전송
동기화 → dispatch-report.ps1에서 당일 호 validate-issue.mjs 실행 → 검수·배포 기록 확인 → 두 공개 사이트 본문 비교 → Game Trend Report 봇으로 두 링크 전송 → 응답 확인·중복 방지 기록. 실패하거나 미완성인 호를 이전 호로 대체하지 않습니다.

## macOS 토요일 08:00 한국 시간: 제작 시작
저장소를 Codex 프로젝트로 열고 최신 main·지침을 확인한 뒤 `$weekly-game-report`로 조사·작성·독립 검수와 배포를 진행한다. Pages와 Vercel의 최종 파일을 확인한 후 Node 전송기로 지정한 두 Discord 채널에 보낸다. 08시는 제작 시작 시각이다. 설정과 예약 전문은 [README의 새 Mac 설정](../README.md#새-mac에서-처음-설정하기)과 [macOS 예약 지침](READING-AND-SCHEDULER.md#macos-새-pc의-토요일-08시-단일-예약)을 따른다. Windows PowerShell 전송기는 현재 한 채널만 지원한다.

## 다른 컴퓨터에서 실행하려면
공개 소스만으로 봇 인증이 복원되지는 않습니다. Windows에서는 로컬 작업 폴더 아래 site/에 이 저장소를 체크아웃하고 workflows/의 파일을 작업 폴더에 배치합니다. GH_TOKEN·Git 작성자 설정·VERCEL_TOKEN과 배포 대상 설정, Windows 사용자별 봇 DPAPI 인증, 한국어 스킬, ego-browser, Node.js·PowerShell·gh CLI·예약 작업을 그 환경에서 별도로 준비해야 합니다. Mac의 준비 순서는 위 macOS 안내를 따릅니다. 비밀 값은 Git에 커밋하거나 채팅에 노출하지 않습니다.

현재 예약 실행과 동기화는 이 PC와 Codex가 켜져 있을 때 동작합니다. GitHub 푸시 웹훅이나 클라우드 실행은 구성하지 않았습니다. PC가 꺼져 있으면 다음 실제 실행 때 최신 main을 확인합니다. 예약 시각을 바꾸려면 지침 문구뿐 아니라 Codex 예약 설정도 변경해야 합니다.

## 스크립트 수정 범위
workflows/에 현재 실행 스크립트를 보관합니다. 환경별 private/ 설정은 공개하지 않습니다. sync-instructions.ps1 자체와 허용 경로 목록은 로컬 부트스트랩이며 목록을 늘리려면 이 PC에서도 검토·수정해야 합니다. 지침만의 변경은 리포트 내용 검수 완료를 뜻하지 않습니다.
## 게임 개발 Agent Skills 조사 누락 방지
07시 조사에서 게임 AI 도구와 별도로 Codex·Claude 게임 개발 스킬을 검색한다. 공식 엔진/업체와 커뮤니티 후보의 README·실제 SKILL.md·릴리스/커밋·라이선스를 확인하고 기존 관심 후보와 이번 주 변경을 구분한다. game-ai-tools 앞부분의 agent-skills와 작업별 선택 안내·비교표·직접 링크·호별 관측 JSON을 작성한다. 최근 생성/새 스킬/수정과 누적 별 수/주간 증가를 구분하고 변동 없는 주도 확인 범위를 남긴다. 한국어 교정 후 스킬 목차·원문·표 스크롤·이미지/영상·제작 도구 필터 비간섭을 검사하며 sections/coverage의 agent-skills 기록을 출력 계약 검사에서 확인한다. 이 항목 추가는 토요일 07시 조사 시작·08시 전송이나 두 공개 배포 링크·중복 전송 방지 규칙을 바꾸지 않는다.


## 읽기 경험과 새 PC 예약의 최신 기준
`READING-AND-SCHEDULER.md`를 함께 동기화하고 조사·작성 시작 전에 다시 읽는다. 최신 주간 링크, 누적 목록 검색·필터, 보조 정보 펼침, 동일 조건의 비교 자료, 접근성과 인쇄 검사를 포함한다. 새 PC의 세 예약에는 이 문서의 전체 문구를 사용한다. 이 지침 추가로 기존 필수 조사·검수·전송 조건은 생략하지 않는다. 이미 배치된 PC는 업데이트된 sync-instructions.ps1을 로컬에 한 번 적용해야 새 허용 목록이 인식된다.

## 2026-11-07 이후 자연스러움 최종 검수
`KOREAN-EDITORIAL-POLICY.md`의 k-skill 두 스킬 지침과 범위를 적용한다. 문맥을 실제로 검토하고 수정자와 독립된 최종 검수자가 HTML과 호별 Markdown의 모든 독자용 문구를 대조한다. 기존 3단계 교정 영수증과 별도로 자연스러움 검수 범위·변경 전후·사유·최종 파일별 해시를 남긴다. 정기 예약은 외부 공개 검사기를 배치 호출하지 않으며, 외부 검사가 없으면 `externalVerified=false`와 대체 방법을 기록한다.

## 발행·전송의 공통 최종 검사
2026-11-07 이후 호는 `validate-issue.mjs`가 `validate-weekly-presentation.mjs`와 `validate-language-review.mjs`를 호출한다. 07시 발행 전에 검사하고 08시 `dispatch-report.ps1`에서도 다시 검사한다. 요약·강조·분류가 빠졌거나 파일이 최종 검수 해시와 다르면 배포·전송을 진행하지 않는다. 동기화 후 이 WORKFLOW도 site/instructions에서 다시 읽는다. Markdown 첨부는 해당 호 HTML의 명시적 링크와 함께 게시하며, 미연결 문서는 조용히 누락시키지 않고 생성 단계에서 중단한다.

## 매주 품질을 일정하게 유지하는 실행 기준
READING-AND-SCHEDULER.md의 품질 검수 6단계와 실습 DOM 계약을 따른다. 원문 조사는 ego-browser를 사용한다. 이번 호에서 실제 읽은 지침 커밋과 서로 다른 편집자·최종 검수자, 9개 기준별 확인 근거·한계·미해결 문제를 .content-review.json의 qualityReview에 남긴다. 다음 호 검증기는 이 기록과 프롬프트 구조를 검사하며, 사람이 읽어 이해할 수 있는지는 실제 독립 문맥 검수로 확인한다. 예시 보고서를 날짜만 바꿔 발행하거나 08시 일정 때문에 필수 검수를 생략하지 않는다. 도구·출처 접근 실패는 가능한 대안을 검토한 뒤 정확한 누락 범위를 알리고, 필수 품질이 충족되지 않으면 발행·전송을 중단한다.

## 게임 취업·진로 조사
매주 대기업 외 스타트업·소규모 게임사 채용, 게임 취업 행사, 게임 관련 부트캠프와 대학 입시, 주요 진로 소식을 함께 조사한다. REPORT-OUTPUT-CONTRACT.md의 게임 취업·진로 정보 기준대로 공식 원문에서 모집 상태·지원 자격·기수/학년도·마감·비용·확인일을 점검하고 학생에게 필요한 이유와 다음 행동, 미확인 항목을 적는다. 찾지 못한 범주는 조사 범위와 한계를 남기며 예전 공고를 현재 모집으로 채우지 않는다.

## 주간 제작 하네스
전체 새 호 작성은 site/.agents/skills/weekly-game-report/SKILL.md의 $weekly-game-report를 진입점으로 사용한다. 명세가 preflight→research→compose→editorial-review→verify→handoff→final-review를 정한다. 기존 지침은 품질 기준이며 하네스는 역할·단계·필수 산출물·수정상한·hash 결속을 관리한다. 독립 검수와 최종 게이트가 통과한 ready 묶음을 운영 reports로 안전하게 인계한 뒤에만 기존publish/dispatch를 이어간다. 단계 실패·stale·입력부족이면 하위 단계는 실행하지 않는다. 기록은 _workspace에 비공개로 보존한다. 생성과 실제배포/전송의 완료상태를 섞지 않는다.

## 철회한 발행물
사용자 요청으로 monthly-2026-10.html은 공개 목록과 파일에서 제거했다. build-site.mjs의 withdrawnReports가 이 파일을 이전 PC 원본에서 다시 복원하지 않게 한다. 다른 과거 호는 기존 보존 규칙을 따른다.

## 취업·진로 다섯 범주 확인 게이트
스킬 명세 research→compose→editorial-review→verify→final-review가 다섯 진로 범주를 명시적으로 요구한다. 조사 원장의 careerCoverage와 내용 검수 영수증을 결속하고, 두 독립 검수 기록의 careerCategoriesReviewed와 최신 SKILL·operating-contract 해시까지 준비 게이트에서 확인한다. 모집이 없는 주도 조사 범위를 기록하며 범주를 삭제하지 않는다. Mac의 실제 08시 예약 전문과 Windows 재등록 전문은 READING-AND-SCHEDULER.md에서 함께 관리하고, 새 PC에서 최신 main을 동기화한 뒤 그 OS에 맞는 하나의 운영 방식을 선택한다.

## 코드 기반 게임 제작 오픈소스 조사
research 단계에서 REPORT-OUTPUT-CONTRACT.md의 오픈소스 탐색을 수행하고 openSourceToolSearch와 출처 원장을 결속한다. pixelfx·Sprite Fusion 유형의 작은 제작 도구도 탐색하며 그 주의 새 변경과 기존 참고를 구분한다. 후보의 공개 코드·라이선스 예외·엔진 경로·선정 이유·공식 미디어·실습을 작성하고 독립 검수한다. 준비 게이트는 이 탐색 기록·확인일·출처·미확인 사유 누락을 차단한다.

공개 자산·데이터셋도 Scenario 같은 초기 예시 밖에서 새 후보를 탐색한다. 코드/가중치 공개와 자산 배포, 예제/출력 수·누락 입력·형식·엔진 경로·라이선스 예외를 구분하고 `openSourceToolSearch.publicAssets`에 별도 조사 기록을 남긴다. 두 독립 검수의 `publicAssetsReviewed`가 있어야 준비 게이트를 통과한다. 선정한 대표 자료는 상단 요약·전송 요약과 출처에 연결하며 기존 검수·배포 대조·봇 전송 검증을 유지한다.

## AI 게임 제작 채널의 조사와 공개 원장
매주 저장소의 `instructions/AI-SOLO-CREATOR-WATCHLIST.json`에서 현재 주시 채널 19곳과 개별 참고 영상 3편을 확인한다. 개별 영상의 채널을 자동으로 주시하지 않고 매주 모든 영상을 반복 추천하지 않는다. 목록 밖에서도 한국어·영어로 최신 콘텐츠를 검색하고 존재하는 유효한 이전 호 공개 원장 전체의 `videos`·`channels`·`referenceVideos`에 담긴 videoId와 대조해 재소개 사유를 기록한다. 해당 호의 `assets/report/research/ai-solo-creators-YYYY-MM-DD.json`은 `reportDate`·`videos`를 담아 공개 파일 목록과 최종 해시 검수에 포함한다. `research.creatorContentSearch.referenceVideos`·`selectedVideos`와 독립 검수의 `referenceVideoIdsReviewed`를 운영 계약에 맞게 기록한다. 조사·선정·참고 영상과 독립 검수의 세부 필드 및 차단 기준은 [운영 계약](../.agents/skills/weekly-game-report/references/operating-contract.md)과 [출력 계약](REPORT-OUTPUT-CONTRACT.md)을 따른다.

PC 교체 시 예약은 한 PC만 활성화하고, 같은 발행일의 비공개 전송 기록을 안전하게 인계해 실제 채널 메시지와 대조한다. 이미 보낸 호는 임의로 재전송하거나 영수증을 조작하지 않는다. 예약·토큰·비공개 기록은 Git으로 복원되지 않는다.

## 발행일별 사용자 요청

해당 발행일의 `instructions/ISSUE-BRIEF-YYYY-MM-DD.md`가 있으면 기존 하네스의 issue-request 입력으로 읽고 context에 파일 경로·SHA256을 기록한다. 작성자는 지정 항목을 본문·출처와 연결하고 독립 검수자는 누락·조건·한계를 항목별로 대조한다. [2026-11-07호 추가 요청](ISSUE-BRIEF-2026-11-07.md)은 루키스 국비 과정과 게임 제작 저장소 10개다. 이 지정 목록은 해당 호에만 적용하며 새로운 상시 예약이나 고정 순위를 만들지 않는다.
