# 주간 리포트 하네스 구축·평가 기록

기준일: 2026-10-31. 신규 구축. 저장소에 같은 목적의 프로젝트 스킬이 없었으며 기존 지침과 Node/PowerShell 발행 검사기를 확장하는 순차 pipeline을 선택했다. 기존9개 품질 기준과 실제 독립 한국어 검수가 필요하므로 작성자와 reviewer를 분리했다. custom agent 설정·고정 모델·서버·동적 fan-out·자동 부분 재개 엔진은 추가하지 않았다.

## 산출물과 운영
프로젝트 스킬 .agents/skills/weekly-game-report의 canonical SKILL·UI메타데이터·harness-spec.json, 운영 계약, 출처/라이선스, workflows/check-report-harness.mjs와 회귀 테스트를 생성했다. AGENTS.md에는 짧은 진입점만 두고 최신 품질 기준은 instructions를 재사용한다. 예약 전문은 site에서 스킬을 호출하고 준비 완료 후 기존 운영 reports→publish→08시dispatch에 인계한다. 이번 구축은 예약 객체를 변경하거나 새 리포트를 작성하지 않았다.

모든 단계는 필수다. optional worker 및 동적 item branch는 이 구조에 없으며, 선택적 미디어 실패의 대안/한계는 콘텐츠 규칙으로 처리한다. 독립 reviewer가 없거나 필수 자료·검증이 없으면 차단한다. 동일 실패 재시도1회·수정2회 상한은 native coordinator가 지키며, 이 버전에는 자동 상태 전이/부분 재개 엔진이 없다.

## 검증 근거
- 설치된 harness 스킬의 spec validator → dry-run → 실제 scaffold → project validator를 실행했다. canonical 파일과 명세가 일치한다.
- 두 번째 scaffold가 충돌로 거부되며 기존 스킬 파일 hash가 바뀌지 않는 것을 확인했다. 순환 dependency 명세도 거부됐다.
- Node 합성 fixture는 실제 리포트·검수 영수증이 아니다. 준비 성공, 필수 파일 누락, 파일/지침/upstream 변경, 자기 검수 기록, 미해결 blocker, 필수 명령/UI 증거 누락, 안전하지 않은run ID, 잘못된 날짜/미래 게시일/90일 범위 및 작은따옴표 로컬 이미지 누락의 차단을 검사했다.
- 기존 새 PC manifest 배치·출력·언어·구조·기존 학습 콘텐츠 검사와 합쳐42개 테스트가 통과했다. 기존 HTML·Markdown·링크 보존 검사도 통과했다.
- 최소 컨텍스트의 독립 subagent가 생성물을 읽고20개 호출 예시를 판정했다. 전체 새 주간호 요청10개와 단일 문구/표/전송/설정 등 비진입10개를 구분했다. 상세는 스킬 references/evaluation.json이다. 이는 명세 독해 검사이며 Codex 런타임 자동 활성화 측정이 아니다.
- 독립 코드/한국어 검수에서 발견한 명령·UI 근거, 지침 변경, 출처 신선도·날짜, 링크 누락을 보완하고 재검수 승인을 받았다.

## 확인하지 않은 범위
실제 리포트 한 호의 end-to-end 생성, 외부 원문 조사/게임 실행/새 이미지 생성, 실제 Windows 초기 설정·예약·인증·배포·전송을 이번 구축에서 실행하지 않았다. 무스킬 baseline, 비용·지연 성능, 자동 트리거 활성화율은 측정하지 않았다. 날짜·hash·기록 구조 검사는 사실의 진위나 문장 품질을 인증하지 않으며, 네이티브 검수자 식별자도 암호학적 신원 증명이 아니다. 실제 운영에서는 원문 확인·독립 위임·문맥과 UI 증거를 직접 확인해야 한다.
