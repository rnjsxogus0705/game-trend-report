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
  control-border: "#C6D0DF"
  overlay: "#14243B88"
  floating-shadow: "#14243B1F"
  discord-surface: "#EEF0FF"
  discord-text: "#404EED"
  kakao-surface: "#FEE500"
  weak-blue: "#EDF2FC"
  note: "#F0F3F8"
  print-ink: "#000000"
  emphasis-ink: "#193E96"
  active-ink: "#1C439E"
  disclosure-ink: "#25436B"
  table-ink: "#394A60"
  caption-ink: "#43556C"
  cover-line: "#40516B"
  warning-ink: "#704708"
  scroll-thumb: "#A7B4C8"
  filter-border: "#A8B8D0"
  chapter-line: "#AEBCCD"
  secondary-control-border: "#B7C3D5"
  cover-copy: "#CFDAEB"
  illustrative-track: "#D7E1F2"
  selection: "#D9E4FF"
  active-surface: "#E1E9FA"
  emphasis-surface: "#E2EBFF"
  error-track: "#E4EBF6"
  selected-surface: "#E5EDFC"
  dark-background: "#101722"
  dark-paper: "#192434"
  dark-surface: "#253247"
  dark-disclosure: "#202D3F"
  dark-nested-note: "#2B3B51"
  dark-text: "#EBF0F8"
  dark-secondary: "#C4CFDF"
  dark-link: "#A9C5FF"
  dark-border: "#586B84"
  navigation-hover: "#E8ECF2"
  concept-surface: "#F8FAFF"
  warning-surface: "#FFF0CA"
  warning-note: "#FFF3D5"
typography:
  display:
    fontFamily: Pretendard
    fontSize: 52px
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: -0.035em
  heading:
    fontFamily: Pretendard
    fontSize: 32px
    fontWeight: 700
    lineHeight: 1.45
    letterSpacing: -0.025em
  body:
    fontFamily: Pretendard
    fontSize: 18px
    fontWeight: 400
    lineHeight: 1.85
    letterSpacing: 0em
  subheading:
    fontFamily: Pretendard
    fontSize: 23px
    fontWeight: 700
    lineHeight: 1.5
  subheading-mobile:
    fontFamily: Pretendard
    fontSize: 21px
    fontWeight: 700
    lineHeight: 1.5
  small-heading:
    fontFamily: Pretendard
    fontSize: 20px
    fontWeight: 700
    lineHeight: 1.55
  compact-body:
    fontFamily: Pretendard
    fontSize: 17px
    fontWeight: 400
    lineHeight: 1.85
  note:
    fontFamily: Pretendard
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.85
  primary-control:
    fontFamily: Pretendard
    fontSize: 16px
    fontWeight: 600
    lineHeight: 1.85
  share-control:
    fontFamily: Pretendard
    fontSize: 15px
    fontWeight: 700
    lineHeight: normal
  control:
    fontFamily: Pretendard
    fontSize: 15px
    fontWeight: 600
    lineHeight: 1.5
  control-small:
    fontFamily: Pretendard
    fontSize: 13px
    fontWeight: 600
    lineHeight: 1.5
  metadata-small:
    fontFamily: Pretendard
    fontSize: 12px
    fontWeight: 400
    lineHeight: 1.65
  caption:
    fontFamily: Pretendard
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.75
    letterSpacing: 0em
  legacy-tool-heading:
    fontFamily: Pretendard
    fontSize: 19px
  disclosure-icon:
    fontFamily: Pretendard
    fontSize: 22px
  list-rank:
    fontFamily: Pretendard
    fontSize: 24px
  illustrative-value:
    fontFamily: Pretendard
    fontSize: 25px
  heading-mobile:
    fontFamily: Pretendard
    fontSize: 26px
  report-subtitle:
    fontFamily: Pretendard
    fontSize: 28px
  top-list-heading:
    fontFamily: Pretendard
    fontSize: 29px
  display-mobile:
    fontFamily: Pretendard
    fontSize: 40px
  display-medium:
    fontFamily: Pretendard
    fontSize: 46px
spacing:
  xs: 8px
  sm: 16px
  md: 24px
  lg: 32px
  xl: 48px
  section: 64px
rounded:
  flat: 0px
  inline-emphasis: 3px
  small-badge: 4px
  xs: 6px
  sm: 8px
  md: 10px
  lg: 12px
  xl: 16px
components:
  button-primary:
    backgroundColor: "{colors.action}"
    textColor: "{colors.paper}"
    typography: "{typography.primary-control}"
    rounded: "{rounded.sm}"
    height: 56px
    padding: 14px 24px
  copy-button:
    backgroundColor: "{colors.weak-blue}"
    textColor: "{colors.action}"
    typography: "{typography.control}"
    rounded: "{rounded.sm}"
    padding: 10px 16px
  floating-share:
    typography: "{typography.share-control}"
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: 13px 20px
  report-card:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: 0px
    padding: 28px 0px
  secondary-copy:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.secondary}"
    typography: "{typography.body}"
  metadata:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.muted}"
    typography: "{typography.caption}"
  research-note:
    backgroundColor: "{colors.note}"
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
이 루트 파일이 시각 설계의 단일 기준이다. `assets/report/DESIGN.md`는 과거 발행 URL을 보존하기 위한 자동 생성 호환 사본이며 직접 수정하지 않는다. 루트 문서를 수정하면 `node workflows/build-site.mjs`로 동일 바이트를 생성한 뒤 디자인 검사를 실행한다. 하네스는 두 파일의 해시가 다르면 배포를 차단한다. Impeccable은 이 파일과 PRODUCT.md를 실제 읽고 Read 모드로 작업한다. 게임마이스터고 학생이 요약에서 작업을 고르고, 도구·사례의 근거와 입력·출력·조건을 읽은 뒤 작은 실습으로 옮기는 한국어 편집형 리포트다. UI와 본문은 자연스러운 해요체를 사용한다.

구체적인 기준 화면은 `reports/weekly-2026-10-31.html`의 차분한 남색 커버, 흰 본문, Pretendard, 4개 목차 묶음, 3+7 우선순위, 설명 곁의 공식 미디어와 자세히 보기다. 과거 사실·선정 자료·날짜를 복사하는 기준이 아니다. 새 호의 필터·카드·복사·미디어는 같은 글꼴·간격·색상·포커스 체계에 맞춰 완성한다. 브라우저 기본 컨트롤이나 링크만 둔 미디어를 완성된 디자인으로 판단하지 않는다.

Google [design.md 명세](https://github.com/google-labs-code/design.md/blob/1ed38aa9dd4451b9039f9aeb9ed1d2579edafddf/docs/spec.md)와 [철학](https://github.com/google-labs-code/design.md/blob/1ed38aa9dd4451b9039f9aeb9ed1d2579edafddf/PHILOSOPHY.md)의 구체적인 맥락 설명, 토큰과 의도의 연결, 컴포넌트·상태 정의를 적용한다. 형식은 alpha이며 참조 저장소는 Apache-2.0이다. Google 샘플의 색상·폰트를 복사하지 않았고 Google CLI lint나 Google의 품질 승인을 받은 것으로 표현하지 않는다. 아래 값과 현재 CSS가 다르면 실제 파일·계산 스타일·기준 화면을 대조해 원인을 해결한다.

## Colors
따뜻한 연회색 배경 #F4F5F7 위에 흰색 본문, 짙은 남색 커버 #14243B, 딥블루 동작 #2455CB를 사용한다. 본문 #223046, 보조 문구 #536174, 경계 #DCE2E9를 기준으로 한다. 색은 정보 구조와 동작에 쓰고 장식용 배지로 반복하지 않는다. 토큰의 보조 톤은 기존 주간 CSS에서 실제 쓰는 커버 문구·경계·선택·펼침·강조·주의·예제 트랙 역할에 대응한다. 메신저 버튼의 기존 색과 인쇄 검정도 구분하며 새 임의 점수나 장식 팔레트를 만들지 않는다. 텍스트와 배경의 실제 명도 대비를 확인한다.

## Typography
사용자가 제공한 Pretendard 1.3.9의 웹 배포본을 같은 디렉터리에서 가져와 self-host한다. 100~900의 9개 굵기를 등록하고 주로 400·500·600·700을 사용한다. 본문은 18px/1.85, 긴 문단은 최대 72ch를 기준으로 한다. h2는 데스크톱 32px·모바일 26px, h3는 23px·21px, 캡션은 14px로 위계를 만든다. 한 페이지의 h1은 커버 제목 하나다. 표는 tabular-nums, 큰 요약 숫자는 proportional-nums다.

## Layout
4px 간격 체계와 넓은 섹션 여백을 사용한다. 데스크톱 고정 목차는 별도로 스크롤되고 현재 항목을 표시한다. 모바일은 단일 컬럼과 접을 수 있는 고정 목차를 사용한다. TOP 10은 평면 목록으로 보여 주며 처음 3개를 우선 읽고 나머지는 선택해서 펼친다. 중요한 요약과 근거는 보존하고 표는 자체 영역에서 스크롤한다.

## Elevation & Depth
기본 화면은 평면이다. 흐린 그림자는 떠 있는 탐색 요소에만 쓰고, 카드 전체에 과장된 그림자나 inner shadow를 쓰지 않는다. 큰 장 위에 2px #AEBCCD 구분선과 64px 간격(모바일 48px)을 적용하고, 장 제목 아래에 1px 보조선을 둔다. h2를 먼저 두고 장 메타데이터는 제목 아래에 둔다.

## Shapes
3·4px는 강조·작은 배지, 6·8px는 조작과 작은 패널, 10·12·16px는 미디어·모달에 쓴다. 평면 본문 카드는 0px이다. 필요한 패널에 일관된 라운드를 사용하고 둥근 카드를 여러 겹 중첩하지 않는다. 전면 그라디언트, 노이즈, 네온, 컬러 left-rail 장식을 쓰지 않는다. 아이콘은 24px 격자와 currentColor를 사용한다.

## Components
요약, 근거 카드, 차트, 규칙 구조도, 표, 실행 체크리스트로 구성한다. Chart.js는 고정 버전을 로컬에서 제공한다. 모든 차트에는 수치표와 설명을 함께 제공한다. 실측·문헌 수치와 가상 실험을 눈에 띄게 구분한다. 모든 인터랙션은 키보드로 조작할 수 있고 44px 이상의 터치 영역을 갖는다. 200ms 이내 전환과 reduced-motion을 지원한다.

다음 목록은 매호 빠뜨리지 않을 공통 형식 계약이다. 세부 선택자와 정적 검사는 `.agents/skills/weekly-game-report/references/report-format-reference.json` 및 `workflows/validate-weekly-presentation.mjs`에 연결한다.

| 요소 | 실제 구조·역할 | 상태와 검수 |
|---|---|---|
| 커버·메타 | `.issue-cover`, 유일한 h1, 발행일 | 이번 호 날짜·범위 일치, 그림으로 제목을 대신하지 않음 |
| 공유·인쇄 | 정적 `#report-share`, `#print-button`, 신규 호용 `share-v2.js` | 공유는 최소 44px 터치 영역이며 중간 스크롤에도 보임. 모달 열기·닫기·Escape·포커스 복귀, 링크 복사·기기 미지원·취소 대안. 인쇄에는 숨김 |
| 목차·진행률 | `#side-nav`, `#mobile-links`, `#read-bar`, `#read-percent` | 네 범주·모든 본문 링크, 모바일 접기, 현재 위치와 펼침 후 진행률 |
| 상단 요약·TOP10 | `#issue-summary`, `#top10`, `.top-ten-item` | 핵심 세 판단·다섯 바로가기, 처음 3개와 펼칠 7개·용어 풀이. 확인된 관련 미리보기는 해당 제목 가까이 기본 표시하고 없으면 원문 링크 제공 |
| 읽기 조작 | `.reading-controls`, `.reading-detail`, `.detail-body` | 전체·도구 범위를 구분해 조작하고 선택적 배경만 접음. 모호하거나 비어 있는 상세는 금지. 검색·앵커의 닫힌 부모 자동 펼침, 인쇄 후 원래 상태 복원 |
| 도구 선택·상세 | `.tool-filter`, `.tool-feature`, `.tool-facts` | 선택값·후보 수·카드·표 행 일치/초기화, 기본·hover·focus. 입력·출력·조건 옆의 실제 공식 미디어 |
| 표·프롬프트 | `.table-scroll`, `.practice-prompt pre` | 넓은 표 자체 스크롤·읽을 수 있는 셀, 한글 단어를 낱글자씩 쪼개지 않음 |
| 복사·다운로드 | `.idea-card > button[data-copy-workflow]`, 개별/합본 Markdown 링크 | 기본 회색 버튼으로 남기지 않음. 전체 원문과 파일 바이트 일치·복사 성공/실패 안내·복사 버튼 최소 48px 터치 영역 |
| 공식·생성 미디어 | `.official-media`, `.youtube-preview`, `.chapter-concept` | 이미지 자리 예약·로딩 실패 원문 대안·클릭 후 단일 플레이어. 공식 화면/생성 개념/실행 결과 구분·출처·권리·한계 |
| 섹션 요약 그림 | `.report-infographic`, `.infographic-summary` | 제목과 2~3개 한국어 핵심을 이미지와 HTML로 함께 표시. 개념·가상 수치는 캡션으로 짧게 구분하며 미승인 시안의 내용은 복사하지 않음 |
| 테마·아이콘 | `report-theme.js`, `report-theme.css`, 인라인 SVG | 시스템·라이트·다크를 한 버튼으로 전환하고 저장. 현재 모드 이름·키보드·대비·시스템 변경을 확인하며 파일 미리보기에서도 아이콘이 보임 |
| 출처·하단 안내 | `section#sources`, `main.content > footer.footer` | 지정 자료·공개 원장·원문, 검증 범위, 제작·한국어 기준·적용 DESIGN·폰트와 공유 자산 라이선스·아카이브 링크. 공유 버튼이 하단 링크를 가리지 않음 |

## Do's and Don'ts
- 핵심 루프의 관찰과 흥행 원인 가설을 구분한다.
- 현재 채용 상태·마감·학생 지원 조건을 검증 수준과 함께 보여준다.
- 신뢰할 수 있는 실측 시계열이 없으면 시장 성장 그래프를 만들지 않는다.
- 모델 이름·숫자·효과를 장식용 지표로 만들지 않는다.
- 48시간 프로토타입은 범위를 정한 학습 실험이며 직무별 다른 증거도 허용한다.
- 주간 호는 `body.weekly-editorial`을 사용하고 다른 호에 스타일이 누출되지 않는지 확인한다.
- 공통 CSS 다음 `weekly-editorial.css`, `section-infographic.css`, `report-theme.css`, `report-search.css` 순으로 불러오고 기존 목차·접기·미디어·공유·도구 기능을 보존한다. 기존 공개 호가 참조하는 공통 스크립트는 덮어쓰지 않는다.

## Issue summary and emphasis
커버 다음, TOP 10 앞의 `.issue-summary#issue-summary`에 ‘이번 호 한눈에 보기’ h2와 해당 호의 핵심 판단·도구 선택·이번 주 할 일, 주제별 바로가기를 넣는다. 핵심 `mark`는 #E2EBFF 배경과 #193E96 글자, 주의 `mark.caution`은 #FFF0CA 배경과 #704708 글자 및 점선 밑줄을 사용한다. 색 외에도 문구로 뜻을 표현하고 부정·불확실성을 보존하며 강조를 남발하지 않는다.

공유·복사·다운로드·인쇄·닫기 등의 조작은 로컬 Lucide 아이콘과 접근 가능한 버튼 이름을 사용한다. 공유 장식은 image_gen으로 생성한 자산을 쓰며 출처·프롬프트를 기록한다. 실제 제품 화면은 공식 원본을 우선하고 차트·수치는 확인된 데이터와 코드/SVG로 만든다.

필터의 select·button과 펼친 상세 카드도 기존 주간 화면의 글꼴·간격·색상·포커스 체계와 어울리도록 설계한다. 브라우저 기본 스타일과 구분되는지 실제 계산 스타일과 화면에서 확인한다. 관련성과 표시 조건을 확인한 공식 제품 이미지·시연은 TOP 10 또는 도구별 제목과 핵심 설명 가까이, 접힘 밖에 배치한다. 표시할 수 없는 경우 공식 원문 링크를 제공하고 부적절한 이미지로 채우지 않는다. 섹션을 설명하는 생성 개념 그림은 공식 화면과 명확히 구분한다. 미디어 출처·권리·대안과 생성 및 검수 이력은 [품질 절차](instructions/QUALITY-PIPELINE.md#미디어-계획과-실제-화면-검수)를 따른다.

## Report categories
주간 화면은 핵심 요약, AI 도구와 기술, 게임 분석과 제작, 취업과 참고 자료 순서로 본문과 목차를 같은 네 범주로 나눈다. 본문 `.part-heading`은 범주를 명확히 구분하고 왼쪽 목차는 현재 범주를 열어 표시한다. 모바일도 같은 범주와 링크를 제공한다. 구체적인 ID와 배치 계약은 `instructions/READING-AND-SCHEDULER.md`를 따른다.

## 최소 글자 크기
웹 화면의 텍스트는 최소 11px 이상으로 한다. 본문은 기존 17~18px, 캡션과 출처는 가급적 12~14px 이상을 유지하며 최소값에 맞춰 전체를 줄이지 않는다. 차트 축과 범례도 11px 미만으로 내리지 않는다. 인쇄 표는 최소 11pt로 제공한다. 원본 스크린샷·생성 이미지 속 글자는 CSS 글자 크기로 보장할 수 없으므로 같은 핵심 정보를 HTML 설명과 캡션으로 제공하고 원문 확대 경로를 유지한다.

2~3열의 짧은 요약 표는 화면·카드 폭에 맞추고 공통 최소 너비 때문에 불필요한 가로 스크롤이 생기지 않게 한다. 4열 이상 비교표는 정보량에 맞는 자체 스크롤을 유지한다. 글자를 줄여 해결하지 않고 셀 줄바꿈과 열 너비를 조정한다.


## 화면 테마
상단의 단일 버튼은 시스템 → 라이트 → 다크 순서로 전환하며 선택을 저장한다. 시스템 선택은 운영체제 설정 변경을 따르고 저장소를 사용할 수 없어도 조작 가능해야 한다. `report-theme.js`는 head에서 동기 실행해 초기 렌더 전에 테마를 적용하고 인쇄에서는 밝은 용지로 복원한다. 다크 모드는 짙은 배경과 밝은 본문·링크를 쓰며, 접힘 영역과 내부 정보 블록은 `dark-disclosure`와 `dark-nested-note`로 구분한다. 장식용 인라인 SVG는 보조 기술에서 숨기고 버튼 자체에 이름을 둔다. 독자 사진·공식 이미지 색은 바꾸지 않는다. 키보드 포커스, 테마별 대비와 320·390·768·1440px의 조작을 확인한다.

인쇄할 때 접힌 필수 내용과 출처를 표시하고 공유·테마·복사 조작과 본문 바로가기 버튼은 숨긴다. 브라우저 화면으로 돌아오면 원래 접힘 상태를 복원한다. 실제 PDF는 출력 파일의 페이지 분할과 누락을 확인하며, 표본 확인과 전체 페이지 검수는 구별한다.

## Verification and record
320·390·768·1440px에서 기본·펼침·선택·포커스·로딩 실패를 실제 확인하고 이전 호와 비교한다. 정적 파일이 있거나 토큰이 맞는 것만으로 UI를 승인하지 않는다. 공유·인쇄·목차·진행률·복사·다운로드·미디어·푸터는 최종 통합 화면에서 다시 조작한다.

SQLite에는 실제 읽은 이 DESIGN.md의 SHA256, 적용 컴포넌트, 실제 수행자·시각·관찰·실패·수정·재검수와 증거 해시를 남긴다. UI 증거의 designContractSha256은 현재 파일과 일치해야 한다. 같은 입력의 기존 증거를 재사용하면 새 촬영·새 원문 전수 조사로 표현하지 않는다. 실제 모바일 기기·스크린리더·전체 영상 시청·엔진 실습을 하지 않았으면 한계를 기록한다.
