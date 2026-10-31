---
version: alpha
name: 게임 트렌드 리포트
description: Toss-inspired Korean research reading experience with Pretendard and evidence-led visualizations.
colors:
  primary: "#3182F6"
  action: "#1B64DA"
  ink: "#191F28"
  secondary: "#4E5968"
  muted: "#6B7684"
  paper: "#FFFFFF"
  background: "#F9FAFB"
  surface: "#F2F4F6"
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
    fontSize: 28px
    fontWeight: 700
    lineHeight: 1.35
    letterSpacing: -0.02em
  body:
    fontFamily: Pretendard
    fontSize: 17px
    fontWeight: 400
    lineHeight: 1.8
    letterSpacing: -0.005em
  caption:
    fontFamily: Pretendard
    fontSize: 13px
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
첨부된 toss.md에서 시각 언어만 가져온 게임 제작·학습 리서치 리포트다. 토스의 제품, 로고, 금융 화면을 복제하지 않는다. 중요한 판단을 먼저 보여주고 근거와 실행안을 이어 읽도록 설계한다. UI와 새 본문은 자연스러운 해요체를 사용한다.

## Colors
흰색과 차가운 회색 위에 파란색 한 계열만 강조한다. 원본 대표 파랑 #3182F6을 유지하되 작은 링크와 버튼의 흰 글자는 명도 대비를 위해 #1B64DA를 사용한다. 원색을 의미 없는 배지나 장식에 반복하지 않는다. CSS는 역할 변수로 색을 참조한다.

## Typography
사용자가 제공한 Pretendard 1.3.9의 웹 배포본을 같은 디렉터리에서 가져와 self-host한다. 100~900의 9개 굵기를 등록하고 주로 400·500·600·700을 사용한다. 긴 보고서의 문단은 17px/1.8로 원본 모바일 UI 본문보다 넓혀 읽기 편하게 한다. 표는 tabular-nums, 큰 요약 숫자는 proportional-nums다.

## Layout
4px 간격 체계, 넓은 구분 여백, 데스크톱 목차와 본문 두 영역, 모바일 단일 컬럼을 사용한다. 화면이 좁아지면 목차를 접을 수 있게 한다. 표는 자체 영역에서 스크롤한다. 내용 길이를 줄이기 위해 중요한 근거를 숨기지 않는다.

## Elevation & Depth
기본 화면은 평면이다. 흐린 그림자는 떠 있는 탐색 요소에만 쓰고, 카드 전체에 과장된 그림자나 inner shadow를 쓰지 않는다. 1px 회색 헤어라인으로 영역을 구분한다.

## Shapes
16·24·32px 라운드를 사용한다. 전면 그라디언트, 노이즈, 네온, 컬러 left-rail 장식을 쓰지 않는다. 아이콘은 24px 격자와 currentColor를 사용한다.

## Components
요약, 근거 카드, 차트, 규칙 구조도, 표, 실행 체크리스트로 구성한다. Chart.js는 고정 버전을 로컬에서 제공한다. 모든 차트에는 수치표와 설명을 함께 제공한다. 실측·문헌 수치와 가상 실험을 눈에 띄게 구분한다. 모든 인터랙션은 키보드로 조작할 수 있고 44px 이상의 터치 영역을 갖는다. 200ms 이내 전환과 reduced-motion을 지원한다.

## Do's and Don'ts
- 핵심 루프의 관찰과 흥행 원인 가설을 구분한다.
- 현재 채용 상태·마감·학생 지원 조건을 검증 수준과 함께 보여준다.
- 신뢰할 수 있는 실측 시계열이 없으면 시장 성장 그래프를 만들지 않는다.
- 모델 이름·숫자·효과를 장식용 지표로 만들지 않는다.
- 48시간 프로토타입은 범위를 정한 학습 실험이며 직무별 다른 증거도 허용한다.
- 발행된 리포트와 구별되는 /preview/ 미리보기로 제공한다.
