---
version: alpha
name: 게임 트렌드 리포트
description: Editorial Korean research reading experience with Pretendard and evidence-led visualizations.
colors:
  primary: "#2455CB"
  action: "#2455CB"
  ink: "#223046"
  secondary: "#536174"
  muted: "#536174"
  paper: "#FFFFFF"
  background: "#F4F5F7"
  surface: "#F4F5F7"
  cover: "#14243B"
  border: "#DCE2E9"
  weak-blue: "#E8F3FF"
typography:
  display:
    fontFamily: Pretendard
    fontSize: 56px
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: -0.02em
  heading:
    fontFamily: Pretendard
    fontSize: 32px
    fontWeight: 700
    lineHeight: 1.35
    letterSpacing: -0.02em
  body:
    fontFamily: Pretendard
    fontSize: 18px
    fontWeight: 400
    lineHeight: 1.85
    letterSpacing: -0.005em
  caption:
    fontFamily: Pretendard
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: 0em
spacing:
  xs: 8px
  sm: 16px
  md: 24px
  lg: 32px
  xl: 48px
  section: 80px
rounded:
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
components:
  button-primary:
    backgroundColor: "{colors.action}"
    textColor: "{colors.paper}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    height: 56px
    padding: 16px
  report-card:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: 32px
  secondary-copy:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.secondary}"
    typography: "{typography.body}"
  metadata:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.muted}"
    typography: "{typography.caption}"
  research-note:
    backgroundColor: "{colors.weak-blue}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: 24px
  page:
    backgroundColor: "{colors.background}"
    textColor: "{colors.ink}"
  neutral-panel:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
---

## Overview
게임 제작·학습 리서치 리포트다. 긴 글을 편하게 읽고 근거를 찾아볼 수 있는 편집형 화면으로 설계한다. 첨부된 toss.md는 참고 자료이며 토스의 제품, 로고, 금융 화면을 복제하지 않는다. 중요한 판단을 먼저 보여주고 근거와 실행안을 이어 읽도록 설계한다. UI와 새 본문은 자연스러운 해요체를 사용한다.

## Colors
따뜻한 연회색 배경 #F4F5F7 위에 흰색 본문, 짙은 남색 커버 #14243B, 딥블루 동작 #2455CB를 사용한다. 본문 #223046, 보조 문구 #536174, 경계 #DCE2E9를 기준으로 한다. 색은 정보 구조와 동작에 쓰고 장식용 배지로 반복하지 않는다. 텍스트와 배경의 실제 명도 대비를 확인한다.

## Typography
사용자가 제공한 Pretendard 1.3.9의 웹 배포본을 같은 디렉터리에서 가져와 self-host한다. 100~900의 9개 굵기를 등록하고 주로 400·500·600·700을 사용한다. 본문은 18px/1.85, 긴 문단은 최대 72ch를 기준으로 한다. h2는 데스크톱 32px·모바일 26px, h3는 23px·21px, 캡션은 14px로 위계를 만든다. 한 페이지의 h1은 커버 제목 하나다. 표는 tabular-nums, 큰 요약 숫자는 proportional-nums다.

## Layout
4px 간격 체계와 넓은 섹션 여백을 사용한다. 데스크톱 고정 목차는 별도로 스크롤되고 현재 항목을 표시한다. 모바일은 단일 컬럼과 접을 수 있는 고정 목차를 사용한다. TOP 10은 평면 목록으로 보여 주며 처음 3개를 우선 읽고 나머지는 선택해서 펼친다. 중요한 요약과 근거는 보존하고 표는 자체 영역에서 스크롤한다.

## Elevation & Depth
기본 화면은 평면이다. 흐린 그림자는 떠 있는 탐색 요소에만 쓰고, 카드 전체에 과장된 그림자나 inner shadow를 쓰지 않는다. 큰 장 위에 2px #AEBCCD 구분선과 64px 간격(모바일 48px)을 적용하고, 장 제목 아래에 1px 보조선을 둔다. h2를 먼저 두고 장 메타데이터는 제목 아래에 둔다.

## Shapes
필요한 패널에 일관된 라운드를 사용하고 둥근 카드를 여러 겹 중첩하지 않는다. 전면 그라디언트, 노이즈, 네온, 컬러 left-rail 장식을 쓰지 않는다. 아이콘은 24px 격자와 currentColor를 사용한다.

## Components
요약, 근거 카드, 차트, 규칙 구조도, 표, 실행 체크리스트로 구성한다. Chart.js는 고정 버전을 로컬에서 제공한다. 모든 차트에는 수치표와 설명을 함께 제공한다. 실측·문헌 수치와 가상 실험을 눈에 띄게 구분한다. 모든 인터랙션은 키보드로 조작할 수 있고 44px 이상의 터치 영역을 갖는다. 200ms 이내 전환과 reduced-motion을 지원한다.

## Do's and Don'ts
- 핵심 루프의 관찰과 흥행 원인 가설을 구분한다.
- 현재 채용 상태·마감·학생 지원 조건을 검증 수준과 함께 보여준다.
- 신뢰할 수 있는 실측 시계열이 없으면 시장 성장 그래프를 만들지 않는다.
- 모델 이름·숫자·효과를 장식용 지표로 만들지 않는다.
- 48시간 프로토타입은 범위를 정한 학습 실험이며 직무별 다른 증거도 허용한다.
- 주간 호는 `body.weekly-editorial`을 사용하고 다른 호에 스타일이 누출되지 않는지 확인한다.
- `weekly-editorial.css`를 다른 스타일시트 뒤에 불러오고 기존 목차·접기·미디어·공유·도구 기능을 보존한다.

## Issue summary and emphasis
커버 다음, TOP 10 앞의 `.issue-summary#issue-summary`에 ‘이번 호 한눈에 보기’ h2와 해당 호의 핵심 판단·도구 선택·이번 주 할 일, 주제별 바로가기를 넣는다. 핵심 `mark`는 #E2EBFF 배경과 #193E96 글자, 주의 `mark.caution`은 #FFF0CA 배경과 #704708 글자 및 점선 밑줄을 사용한다. 색 외에도 문구로 뜻을 표현하고 부정·불확실성을 보존하며 강조를 남발하지 않는다.

공유·복사·다운로드·인쇄·닫기 등의 조작은 로컬 Lucide 아이콘과 접근 가능한 버튼 이름을 사용한다. 공유 장식은 image_gen으로 생성한 자산을 쓰며 출처·프롬프트를 기록한다. 실제 제품 화면은 공식 원본을 우선하고 차트·수치는 확인된 데이터와 코드/SVG로 만든다.

## Report categories
주간 화면은 핵심 요약, AI 도구와 기술, 게임 분석과 제작, 취업과 참고 자료 순서로 본문과 목차를 같은 네 범주로 나눈다. 본문 `.part-heading`은 범주를 명확히 구분하고 왼쪽 목차는 현재 범주를 열어 표시한다. 모바일도 같은 범주와 링크를 제공한다. 구체적인 ID와 배치 계약은 `READING-AND-SCHEDULER.md`를 따른다.

## 최소 글자 크기
웹 화면의 텍스트는 최소 11px 이상으로 한다. 본문은 기존 17~18px, 캡션과 출처는 가급적 12~14px 이상을 유지하며 최소값에 맞춰 전체를 줄이지 않는다. 차트 축과 범례도 11px 미만으로 내리지 않는다. 인쇄 표는 최소 11pt로 제공한다. 원본 스크린샷·생성 이미지 속 글자는 CSS 글자 크기로 보장할 수 없으므로 같은 핵심 정보를 HTML 설명과 캡션으로 제공하고 원문 확대 경로를 유지한다.
