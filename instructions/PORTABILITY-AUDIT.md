# 새 PC 재현 점검표

기준: 2026-10-31 저장소 버전. 2026-11-02의 최신 채널 조사·PC 이전 보완은 아래에 별도 기록했다. 이 문서는 지침·자산·예약 문구·검증기의 연결을 기록하며 예약 실행 시에는 최신 `README.md`, `WORKFLOW.md`, `READING-AND-SCHEDULER.md`, 작성·출력·한국어 기준과 실제 검증 코드를 우선한다. 저장소의 `site/instructions/`에서 직접 읽는다.

| 요구사항 | 지침과 자산 | 07시 예약에서 할 일 | 검증 경로 |
|---|---|---|---|
| 편집형 디자인 | `DESIGN.md`, `assets/report/weekly-editorial.css`, 로컬 Pretendard | 커버·단일 h1·마지막 CSS와 반응형 화면을 새 호에 적용 | `validate-issue.mjs` → `validate-weekly-presentation.mjs`, 실제 화면 검사 |
| 네 범주와 목차 | `READING-AND-SCHEDULER.md`, `reading-experience.js` | 본문·데스크톱·모바일 목차의 범주와 순서를 맞춤 | 구조 검사와 목차 이동·현재 위치 직접 검사 |
| 한눈에 보기 | 위 지침의 `issue-summary` | 해당 호의 실제 근거로 세 요약과 다섯 주제 링크 작성 | 구조 검사와 근거·링크 직접 검토 |
| 강조·접근성 | 위 지침의 `mark`, `mark.caution`, `assets/report/icons/` | 의미 있는 핵심에 강조를 쓰고 주의 조건이 있을 때 구분. 색 외 텍스트·접근 가능한 이름 유지 | 구조 검사와 대비·키보드·인쇄 직접 검사 |
| AI 실습 프롬프트 | `READING-AND-SCHEDULER.md`, `REPORT-OUTPUT-CONTRACT.md` | 프로토타입·데이터 검사·확률 실습과 관련 제작 장마다 입력·결과·확인 기준이 있는 복사 가능한 요청을 작성 | 미래 호의7영역/복사대상/입력·결과·직접확인·후속질문 구조 검사와 실제 복사·실패 대안·모바일 확인 |
| 최근 해외 AI 제작 사례 | 위 지침의 해외 제작 자료 기준 | 최근 30일 우선, 부족 시 90일까지 조사하고 선정 근거·AI 범위·사람의 역할·출처를 기록 | 제작자 원문·날짜·관심도 관측·영상과 링크 직접 확인 |
| 게임 취업·진로 다섯 범주 | `REPORT-OUTPUT-CONTRACT.md`, 프로젝트 스킬 운영 계약 | 스타트업·소규모 게임사 채용, 취업 행사, 부트캠프, 대학 입시, 진로 뉴스를 각각 조사하고 모집 상태·대상·원문·확인일과 한계를 기록 | `careerCoverage`와 두 독립 검수 기록, 화면의 다섯 범주 및 `validate-issue.mjs`·`check-report-harness.mjs`로 기록 결속 확인. 실제 원문은 독립 검수자가 대조 |
| 한국어 최종 검수 | `KOREAN-EDITORIAL-POLICY.md`, 고정 버전 스킬 지침 | 전체 독자용 문구와 호별 Markdown을 교정하고 독립 검수자·범위·수정·최종 파일 해시 기록 | `validate-issue.mjs` → `validate-language-review.mjs`의 형식·범위·해시 검사와 실제 문맥 검토 |

2026-11-07 이후 발행 호에 새 화면과 한국어 게이트를 적용한다. 검증기는 구조와 기록의 일치 여부를 검사하며, 사실의 진위나 문장의 자연스러움을 자동으로 보장하지 않는다. 스킬을 설치하거나 모델에 지침만 읽힌 것으로 실제 교정·독립 검수를 대체하지 않는다.

새 PC는 README의 순서대로 저장소를 클론하고 manifest 파일을 배치한 뒤 환경변수·DPAPI·기존 배포 대상·한국어 스킬·브라우저·Codex 예약을 따로 준비한다. 예약은 Git으로 동기화되지 않는다. 동기화 허용 목록이나 실행기 자체가 변경된 기존 PC는 로컬 동기화 스크립트도 검토 후 한 번 갱신해야 한다.

운영 스크립트는 현재 Windows의 `C:\내문서\GameTrendReport`와 기존 서비스 대상·권한에 맞춰져 있다. 실제 Windows에서 새 PC 초기 설정, 예약 실행, 공개 배포와 전송은 이번 문서 점검으로 검증하지 않았다. 정기 전송 담당 PC는 한 대만 활성화하고 실제 전송 테스트는 별도 승인된 작업에서만 수행한다.

## 이번 점검에서 보완한 연결

- 구버전 `redesign/index.html`·공용 `report.js` 사용 지시를 제거하고 실제 저장소 참고 경로와 호 전용 UI/차트 JS를 명시했다. 도구·미디어의 고정 ID·표 구조·미실측 문구를 새 조사에 맞게 점검하도록 했다.
- 새 화면 검증기를 동기화 목록과 허용 목록에 함께 등록했다. 디자인·네 범주·상단 요약·강조 누락을 발행 시 차단하고 08시 전송 직전에도 검사한다.
- Windows PowerShell이 만든 UTF-8 BOM 검수 기록을 읽고, repo 내부와 `reports/` + `site/reports/` 배치를 모두 처리하도록 했다.
- 추가 Markdown은 명시적으로 링크한 파일만 게시하고 미연결 작업 문서는 오류로 중단한다.
- 임시 새 PC 폴더에 실제 manifest대로 지침·모듈을 복사해 2026-11-07 가상 호의 전체 검사를 실행했다. 디자인 누락·독립 검수자 누락은 실패하는 것도 확인했다. 이 테스트의 기록은 가상 fixture이며 실제 리포트 영수증이 아니다. 실제 Windows 예약·인증·메시지 전송은 수행하지 않았다.

- 미리보기는 원본 `reports/` 파일 URL이 아니라 build-site 후 `site/`를 루트로 한 로컬 HTTP에서 수행하도록 순서를 명시했다. 원본을 고치면 사본도 다시 생성한다.

## 최종 품질 점검 보완

- 07시 예약 전문에 ego-browser 원문 조사, 실습 DOM 계약과 6단계 검수, 지적 수정 후 재검수, qualityReview 기록을 명시했다. 기존 단일 본문 순서와 특정 PC 사용자 스킬 경로 지시를 정리했다.
- 기존 manifest24개와 동기화 허용 목록에 있는 문서·validate-issue.mjs·화면/언어 검사기를 재사용한다. 새 모듈이나 비공개 설정 파일을 추가하지 않았다. WORKFLOW와 이 점검표는 site/instructions에서 직접 읽는다.
- 임시 새 PC 배치에서 다음 호 검증이 독립 검수자·9개 기준별 근거·한계·미해결 문제를 검사하는 것을 확인한다. 가상 fixture로 품질 기록 누락, 동일 편집/검수자, 미해결 문제, 누락된 근거·한계, 중복 기준이 거부되는지 테스트한다.
- 최신 해외 사례는 전체 AI 제작 주장과98% 커밋 공동작성 같은 보조 비교를 분리한다. 전체 시청·실제 제작·흥행을 확인하지 않았다면 주장하지 않는다. 품질 검수 기록은 사실의 진위를 자동 보증하지 않는다.
- 초기 테스트는 README의 Node 검사를 저장소에서 실행한다. test-learning-sections는 기존2026-10-31호 참고본 검사용이며 다음 호의 실제 조사·브라우저 검수를 대신하지 않는다. 실제 Windows 초기 배치·예약 실행·인증·발행·전송은 해당 PC에서 따로 확인해야 한다.

## 프로젝트 하네스 연결

`.agents/skills/weekly-game-report`의 생성된 SKILL·JSON 명세·운영 계약과 `site/workflows/check-report-harness.mjs`를 Git으로 배포한다. 전역 harness 스킬과 Python 생성기는 구축 시에만 사용했고 매주 실행의 필수 의존성이 아니다. 새 PC 실행은 기존 Node·Codex·ego-browser·이미지/한국어 스킬을 사용한다. 생성기는 macOS에서 실행·검증했으며 Windows에서 재생성할 필요가 없다. 실행 기록은 `_workspace`에 보존하되 공개하지 않는다. 새 하네스 준비 게이트와 기존 validate-issue 및 08시 dispatch를 모두 통과해야 인계·전송할 수 있다. 실제 새 주간호의 무인 생성·Windows 예약 실행·배포/전송은 구축 검사와 구분해 확인한다.

Windows에서는 저장소를 `site/`에 클론하고 프로젝트 스킬, 하네스 검사기와 `site/instructions/WORKFLOW.md` 등 저장소 지침을 그 위치에서 직접 읽는다. 별도 운영 root의 24개 manifest는 작성 지침과 PowerShell/Node 실행 모듈을 복사하는 목록이며, 저장소 안 `.agents/skills/weekly-game-report/`와 `site/workflows/check-report-harness.mjs`를 운영 root로 중복 복사하는 목록이 아니다. `context.instructionFiles`에는 실제 읽은 프로젝트 스킬과 운영 계약, 명세 및 출력 지침의 SHA-256을 결속한다. Windows 07시 준비·08시 전송 예약과 Mac 토요일 08시 제작 시작 예약은 각 환경에 맞게 `READING-AND-SCHEDULER.md`의 전문을 등록하며 동시에 켜지 않는다. Git 클론만으로 예약과 환경별 인증이 생성되지는 않는다.

새 PC fixture 검사는 가상의 조사·영수증으로 필수 범주와 근거 누락, 조사일·한계·독립 검수·지침 해시 불일치를 차단하는지 검증한다. 이 검사는 실제 Windows 초기 설정이나 예약 실행, 새 주간호의 원문 조사와 화면 검수를 대신하지 않는다.

## 전송 구현의 별도 한계

현재 Windows `send-report.ps1`은 첫 번째 Discord 채널 한 곳만 전송한다. 두 공개 사이트 링크를 한 메시지에 넣는 것과 두 Discord 채널에 전송하는 것은 다르다. Mac의 `workflows/discord-delivery.mjs`는 두 채널을 대상으로 하며 채널별 기록을 사용한다. 이번 진로 조사·검수 기준 보완은 Windows의 두 채널 전송을 구현하거나 실제 Windows 전송을 검증한 것이 아니다. 새 Windows 담당 PC에서 두 채널 전송이 필요하면 전송 구현과 중복 방지·실패 복구를 별도로 보완하고 검증해야 한다.

## 2026-11-02 채널 조사와 PC 이전 기준

- 현재 주시 목록의 18개 채널과 개별 참고 영상 3편은 Git 추적 파일 `instructions/AI-SOLO-CREATOR-WATCHLIST.json`에서 직접 읽는다. Windows 운영 root에서는 `site/instructions/` 경로이며 manifest에 중복 복사하지 않는다. 세 영상의 채널을 자동으로 주시하거나 모든 영상을 매주 반복 추천하지 않는다. 목록 밖 최신 영상을 한국어·영어로 검색하고 존재하는 유효한 이전 호 원장 전체의 `videos`·`channels`·`referenceVideos`에 담긴 videoId와 비교해 재소개 사유를 남긴다.
- 매호 `assets/report/research/ai-solo-creators-YYYY-MM-DD.json` 공개 원장의 `reportDate`와 `videos`를 issue-index 및 최종 해시에 포함한다. 공개 원장이 Git에 남아야 다른 PC의 다음 호에서도 비교할 수 있다. 채널 조사·참고 영상·선정 영상·독립 검수의 세부 필드는 최신 [운영 계약](../.agents/skills/weekly-game-report/references/operating-contract.md)과 [출력 계약](REPORT-OUTPUT-CONTRACT.md)이 기준이다. 형식 검사는 실제 원문 대조나 중복 판단을 대신하지 않는다.
- [새 Mac 설정 순서](../README.md#새-mac에서-처음-설정하기)에 클론·프로젝트 등록·도구·인증·연결 검사·예약 등록을 모았다. Mac은 토요일 08시에 제작을 시작하고 검수·배포 후 두 채널에 전송한다. Windows의 07시 준비·08시 전송 구현은 현재 한 채널만 지원한다. 실제 새 Mac/Windows의 예약 실행과 전송은 별도 확인이 필요하다.
- PC 변경 시 예약·토큰·비공개 전송 기록은 Git으로 복원되지 않는다. 이전 PC의 기록을 안전하게 인계하고 실제 채널 메시지를 확인한 뒤 진행한다. 같은 호를 임의로 다시 보내거나 영수증을 조작해 검증을 우회하지 않는다.
