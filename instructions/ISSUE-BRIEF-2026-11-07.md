# 2026-11-07 주간 리포트 · 사용자 지정 추가 자료

- 발행 대상: **2026-11-07 토요일**, Asia/Seoul. 사용자 요청일: 2026-11-06.
- 이 문서는 해당 호의 필수 입력이다. 기존 주간 리포트의 전체 조사·디자인·한국어 검수·독립 검수·배포·두 채널 전송 절차와 함께 적용한다.
- 이 호에만 적용한다. 이후 호에서 아래 10개를 매주 고정 추천하거나 새 소식으로 재사용하지 않는다.
- 아래는 발행 전 준비 메모다. 모집·비용·버전·지원 엔진 등 변할 수 있는 조건은 발행 시 원문에서 재확인하고 실제 확인일을 남긴다. 접근 실패는 해당 항목을 지우지 말고 원문 링크와 미확인 범위를 표시한다.

## 포함할 항목과 배치

1. **취업·교육·입시 → 부트캠프**: [RookissAI KDC](https://kdc.rookiss.ai/)를 국비지원 학습 기회로 소개한다. K-디지털 기초역량훈련과 후속 실전 게임 개발, 정부지원·자부담·수료/초대 조건을 구분한다. 모집·기간·온라인 여부·지원 대상·고교생 조건·비용·추가 도구비·출시 지원 범위를 확인한다.
2. **AI 도구와 기술 → 제작 기반 기술 특집**: 아래 저장소 **10개 전부**를 사용자가 요청한 학습·도입 후보로 포함한다. 최신 변화가 확인되지 않으면 기존 기반 도구로 분류한다. 숫자 10은 사용자 지정 목록의 개수이며 GitHub Trending 순위나 성능 순위가 아니다.

권장 특집 제목: **AI 코딩 에이전트와 함께 활용할 게임 제작 기반 기술 10선**. 상용 게임 수준의 결과나 성능을 보장하는 제목·카피는 사용하지 않는다. 각 도구는 AI 모델/에이전트 내장 여부와 AI가 연동 코드를 돕는 활용 제안을 구분한다.

| ID | 저장소 | 제작 작업 |
|---|---|---|
| jolt-physics | [Jolt Physics](https://github.com/jrouwe/JoltPhysics) | 강체·충돌·물리 상호작용 |
| terrain3d | [Terrain3D](https://github.com/TokisanGames/Terrain3D) | Godot 대규모 지형 |
| material-maker | [Material Maker](https://github.com/RodZill4/material-maker) | 노드 기반 재질·텍스처 |
| effekseer | [Effekseer](https://github.com/effekseer/Effekseer) | 파티클·시각 효과 |
| godot-voxel | [Voxel Tools](https://github.com/Zylann/godot_voxel) | 복셀 지형·월드 |
| recast-navigation | [Recast Navigation](https://github.com/recastnavigation/recastnavigation) | 내비게이션 메시·경로 탐색 |
| ozz-animation | [ozz-animation](https://github.com/guillaumeblanc/ozz-animation) | 스켈레탈 애니메이션·혼합 |
| the-forge | [The Forge](https://github.com/ConfettiFX/The-Forge) | 그래픽·렌더링 기반 프레임워크 |
| meshoptimizer | [meshoptimizer](https://github.com/zeux/meshoptimizer) | 메시 단순화·압축·최적화 |
| fastnoise2 | [FastNoise2](https://github.com/Auburn/FastNoise2) | 절차적 노이즈·지형·텍스처 |

## 설명·시각화·실습 기준

- 항목마다 **왜 골랐는지 → 핵심 기능 → 내 프로젝트에 적용할 방법 → 도입 부담·주의 → 공식 원문** 순서로 설명한다. 핵심 선정 이유와 조건을 하이라이트한다.
- README와 LICENSE, 지원 엔진·언어·버전 및 가능하면 릴리스/변경 원문을 확인한다. 코드 라이선스와 예제·외부 코드·미디어 조건을 합치지 않는다.
- Jolt의 Horizon Forbidden West·Death Stranding 2 사용 사례는 제작자 README 근거와 확인 범위를 표시한다. 유명 작품에서 사용됐다는 사실을 학생 프로젝트의 동일 성능·완성도 보장으로 해석하지 않는다.
- **월드·물리 / 재질·효과 / 이동·애니메이션 / 렌더링·최적화**로 묶어 역할 지도를 만든다. 엔진 플러그인, 네이티브 모듈·라이브러리, 외부 제작/전처리 도구, 자체 엔진 프레임워크의 도입 경로를 비교한다.
- 비교표에는 용도·엔진/언어·라이선스·도입 부담·작은 실습을 넣는다. 모바일에서는 설명 공간이 좁아지지 않게 자세한 조건을 항목별 펼침에 배치한다.
- **목표 장면·엔진 선택 → 제작·전처리 도구 → 런타임 연결 → 플레이·성능 확인** 흐름도를 제공한다. 열 가지를 모두 함께 설치해야 하는 구조로 그리지 않는다.
- 공식 미리보기·영상이 확인되면 출처와 함께 연결한다. 생성 그림은 개념 설명으로 표시하고 실제 구현·벤치마크로 제시하지 않는다.
- 같은 조건의 직접 측정이 없으면 속도·FPS·품질·생산성의 수치 차트나 순위를 만들지 않는다. 지원 기능·도입 경로·작업 범주 비교를 우선한다.
- 엔진·버전·목표 작업·완료 기준을 바꿔 넣는 **복사 가능한 AI 실습 프롬프트**를 제공한다. 공식 API/예제·버전·라이선스 확인, 복사본의 최소 테스트와 실제 실행 여부 구분을 포함한다. 라이브러리를 대신 선택·통합하는 AI의 제안을 검증 결과로 쓰지 않는다.

## 발행 전 독립 점검

- 루키스 1건과 저장소 10개, 총 11개 항목의 본문 위치·원문·선정 이유·조건·한계를 하나씩 대조한다.
- 루키스는 careerCoverage.bootcamps에, 저장소는 openSourceToolSearch와 호별 도구 조사 자료에 출처를 연결한다. 관련 있다고 GitHub Trending 관측 순위나 신규 출시로 중복 집계하지 않는다.
- 상단 요약과 전송용 요약에 이 특집의 핵심과 루키스의 중요한 신청 조건을 실제 확인 범위 안에서 반영한다. 기존 전송기 길이·검수·배포·중복 방지 검증을 지킨다.
- 작성자와 다른 검수자가 전체 한국어·명칭·날짜·숫자·라이선스·미확인 표현을 대조한 뒤 최종 파일 해시를 확정한다. 지침을 읽은 것만으로 실제 조사·검수 완료를 주장하지 않는다.

## 2026-11-06 공식 원문 준비 조사

ego-browser로 공식 원문을 조사한 준비 메모다. 내일 발행 시 변동 조건을 재확인한다.


### 루키스AI · KDC와 후속 실전 게임 개발을 구분

- **선정 이유:** 에이전트 설정·MCP·도구·권한을 배우고 게임 제작으로 연결하는 학습 경로를 비교할 수 있다. 독자가 게임마이스터고 학생이므로 카드 발급·수강 자격을 먼저 보여 준다.
- **현재 상태:** 공식 랜딩은 **11월 12일 오픈 예정·사전예약**을 안내한다. 오픈 문구에는 연도가 없으며 2026-11-06의 현행 캠페인으로 확인했다. 마감·잔여 좌석은 미확인이다. 선착순 1,000명 안내를 현재 1,000석 남음으로 해석하지 않는다.
- **과정 구조:** 국민내일배움카드 기반 **K-디지털 기초역량훈련(KDC) 두 과정**을 모두 수료·인증한 뒤 초대코드로 후속 실전 AI 게임 개발에 참여한다는 운영기관 안내다. 장기 집중형 KDT 부트캠프나 KDC 단계 자체의 게임 개발 완성 과정을 뜻하지 않는다.
- **일반수강 대안:** 운영기관 FAQ는 내일배움카드 발급이 어려운 경우에도 국비 지원 없이 지정 두 과정을 정가로 일반수강할 수 있고, 수료·인증 후 초대코드로 후속 과정에 참여할 수 있다고 안내한다. 일반 사전예약 탭과 실제 두 과정 가격·수강 조건을 확인한다. 학생의 국비 지원 제외를 모든 수강 경로의 불가로 표현하지 않으며, 미성년자 일반수강·계정·결제 권한은 여전히 미확인으로 남긴다.
- **방식·수료:** 운영기관은 100% 온라인, 진도율/출석 80% 이상을 안내한다. 전체 수강 가능 기간과 후속 과정의 일정·별도 비용은 확인되지 않았다.

| 확인 항목 | 원문에서 확인한 내용 | 본문에서 남길 조건·한계 |
|---|---|---|
| 지원·자부담 | 배너 680,000원 → 68,000원, FAQ 약 10% 자부담 | 배너 금액이 개별 과정인지 두 과정 합계인지 확정하지 못했다. 회차별·개인별 적용 금액은 고용24/운영기관 재확인. 전액 무료·누구나 같은 금액·수료 시 환급으로 표현하지 않는다. |
| 고교생 | 고용24 공식 카드 안내는 고1·고2를 지원 제외 대상으로 명시 | 고3도 다른 제외 조건과 개인별 발급 심사를 확인한다. 사업자 FAQ의 고3 가능 안내만으로 모든 학생에게 지원된다고 쓰지 않는다. |
| 미성년자·추가 비용 | 중학생·미성년자 일반수강, AI 계정·API 결제 권한과 비용 포함 여부 미확인 | 신청 전 확인할 질문으로 제공하며 비용을 임의 합산하지 않는다. |
| KDC 한도 | 운영기관은 KDC 크레딧과 잔액에 따른 두 과정 수강 조건을 설명 | 정부의 지정 회차 상세를 이번 검색에서 찾지 못했다. 일반 카드 안내의 다른 부담률을 이 과정에 대입하지 않는다. |
| 강의 분량 | 11136: 상단 23차시와 커리큘럼 22개·10시간44분. 11132: 33차시·19시간11분과 소개 본문 78수업·17시간20분 병존 | 페이지 표기가 일치하지 않아 확정 총시간·차시로 인용하지 말고 발행 시 재확인한다. |
| 출시 지원 | 작품 검토·선정·별도 협의 조건 | 퍼블리싱·출시·수익·취업을 보장하는 지원으로 표현하지 않는다. 운영기관의 AI 제작 사례도 전체 제작 과정 독립 검증과 구분한다. |

두 지정 과정은 **11136: 앱과 웹개발 입문을 위한 에이전트 올인원(클로드코드-하네스)**, **11132: 클로드코드 모작을 통한 에이전트 개발(언리얼-웹 풀스택-MCP-보안)**이다. 11132는 운영기관이 C# 기초 문법과 언리얼 에디터 사용 경험을 선행 조건으로 안내하며, 게임 개발 강의 자체보다 에이전트 개발을 다룬다고 명시한다. 모든 초보자가 즉시 게임을 완성하는 과정으로 소개하지 않는다.

**공식 원문:** [랜딩·FAQ](https://kdc.rookiss.ai/), [과정 11136](https://rookiss.ai/ncs/main_view.html?course_id=11136), [과정 11132](https://rookiss.ai/ncs/main_view.html?course_id=11132), [고용24 카드 지원자격](https://www.work24.go.kr/hr/h/a/1100/selectIssuGudn.do#tab2).

고용24의 운영기관 검색에서 조회된 다른 5개 과정의 가격·일정을 위 KDC 두 과정에 옮기지 않는다. 신청·로그인·결제·영상 전체 시청·게임 실행은 수행하지 않았다.

**학생이 물어볼 질문:** “저는 [학년/연령]이고 [카드 보유·크레딧 상태]입니다. 두 지정 과정의 실제 본인부담액·수강기간·후속 과정 비용, 필요한 AI 계정과 도구 요금, 지원 자격을 확인해 주세요.”

### 기반 기술 1 · Jolt Physics

- **설명:** 강체와 충돌을 중심으로 게임 속 물체의 움직임을 구현하는 C++ 물리 라이브러리예요.
- **선정 이유:** 떨어지는 상자·충돌·관절처럼 눈으로 확인할 수 있는 작은 물리 실험부터 시작하기 좋아요.
- **적용 경로:** C++17 프로젝트에 HelloWorld/CMake 예제를 기준으로 직접 연결하거나, README가 연결한 Godot·Unreal·다른 언어 바인딩의 지원 버전을 따로 확인해요.
- **주 라이선스:** 주 라이선스 MIT. 배포 시 저작권·허락 고지를 유지하며 제3자·별도 표시 자료의 조건도 확인해요.
- **작은 실습 제안:** AI에게 선택한 릴리스의 HelloWorld에서 바닥과 상자 10개를 만드는 최소 예제를 설명하게 하고, 질량·마찰·반발 중 하나씩 바꾸는 실험표를 요청해요. 실제 실행 결과와 예상 결과는 따로 기록해요.
- **조건·한계:** Horizon Forbidden West와 Death Stranding 2: On the Beach 사용은 프로젝트 공식 README가 명시한 사례예요. 해당 게임의 소스·통합 방식은 독립 검증하지 않았어요.
- **조건·한계:** 시뮬레이션 결정성은 공식 문서의 제한을 따르며 모든 플랫폼·빌드에서 결과가 같다고 보장하지 않아요.
- **조건·한계:** 컴파일러·C++17·엔진 바인딩과 대상 플랫폼 조건을 먼저 맞춰야 해요.
- **확인한 릴리스:** [5.6.0](https://github.com/jrouwe/JoltPhysics/releases/tag/v5.6.0) · 한국 날짜 2026-07-12. 내일 최신 여부 재확인.
- **원문:** [저장소](https://github.com/jrouwe/JoltPhysics), [확인한 README](https://github.com/jrouwe/JoltPhysics/blob/6224410b74f86be81d6532b2886bd2255f2a4527/README.md), [라이선스](https://github.com/jrouwe/JoltPhysics/blob/6224410b74f86be81d6532b2886bd2255f2a4527/LICENSE). 소스 revision `6224410b74f86be81d6532b2886bd2255f2a4527`.
  - [공식 README의 래그돌 시연 링크](https://www.youtube.com/watch?v=pwyCW0yNKMA) · 원문 연결 확인, 전체 시청/개별 재사용 권리 전수 검증 미실시.

### 기반 기술 2 · Terrain3D

- **설명:** Godot 4에서 높이맵 지형을 편집하고 재질·식생을 배치하는 지형 제작 애드온이에요.
- **선정 이유:** 지형 조형·텍스처 페인팅·식생 배치를 하나의 작은 장면에서 함께 연습할 수 있어요.
- **적용 경로:** 사용 중인 Godot 버전에 맞는 AssetLib 항목 또는 릴리스 ZIP을 고르고 addons/terrain_3d와 데모를 설치하는 공식 경로가 있어요. v1.1.0 릴리스는 Godot 4.5–4.8+를 지원한다고 안내해요.
- **주 라이선스:** 주 라이선스 MIT. 배포 시 저작권·허락 고지를 유지하며 제3자·별도 표시 자료의 조건도 확인해요.
- **작은 실습 제안:** 작은 지형에 경사·길·두 재질·식생 몇 개만 만든 뒤, 캐릭터 충돌과 LOD 변화·조명을 확인하는 체크리스트를 AI에게 요청해요.
- **조건·한계:** 높이맵 지형 편집과 복셀 기반 동굴·파괴 지형은 다른 방식이에요. Terrain3D의 구멍 기능을 임의의 입체 복셀 편집으로 설명하지 않아요.
- **조건·한계:** 플랫폼·렌더러 일부는 실험적이거나 미지원이며 릴리스별 조건을 확인해야 해요.
- **조건·한계:** 기존 프로젝트 업그레이드에는 데이터 변환 경로가 있으므로 사본에서 먼저 확인해요.
- **확인한 릴리스:** [1.1.0](https://github.com/TokisanGames/Terrain3D/releases/tag/v1.1.0-stable) · 한국 날짜 2026-10-30. 내일 최신 여부 재확인.
- **원문:** [저장소](https://github.com/TokisanGames/Terrain3D), [확인한 README](https://github.com/TokisanGames/Terrain3D/blob/852b6c9742bcfebab30d06857c547e2d8daa2f60/README.md), [라이선스](https://github.com/TokisanGames/Terrain3D/blob/852b6c9742bcfebab30d06857c547e2d8daa2f60/LICENSE.txt). 소스 revision `852b6c9742bcfebab30d06857c547e2d8daa2f60`.
  - [공식 README의 Terrain3D 이미지](https://raw.githubusercontent.com/TokisanGames/Terrain3D/852b6c9742bcfebab30d06857c547e2d8daa2f60/doc/docs/images/terrain3d.jpg) · 원문 연결 확인, 전체 시청/개별 재사용 권리 전수 검증 미실시.
  - [제작자 채널](https://www.youtube.com/@TokisanGames) · 원문 연결 확인, 전체 시청/개별 재사용 권리 전수 검증 미실시.

### 기반 기술 3 · Material Maker

- **설명:** 노드를 연결해 텍스처·브러시를 만들고 3D 모델에 페인팅하는 Godot 기반 저작 도구예요.
- **선정 이유:** 같은 재질의 색·거칠기·무늬를 조금씩 바꾸며 결과를 비교하는 제작 과제에 적합해요.
- **적용 경로:** Material Maker를 별도 저작 도구로 사용하고 결과 텍스처·재질을 목표 엔진의 가져오기 조건에 맞춰 확인해요. Godot로 만든 도구라는 사실이 모든 엔진에 자동 연결된다는 뜻은 아니에요.
- **주 라이선스:** 별도 표시가 없는 저장소 파일은 MIT. 입력·외부 자산의 권리와 별도 고지는 따로 확인해요.
- **작은 실습 제안:** AI에게 이끼 낀 돌 재질의 노드 구성 초안을 설명하게 하고, 타일 이음새·색·거칠기를 비교할 세 가지 변형과 목표 엔진에서의 확인 항목을 정해요.
- **조건·한계:** README는 별도 표시가 없는 저장소 파일에 MIT가 적용된다고 안내해요. 입력 이미지·외부 자산의 권리는 별도로 확인해요.
- **조건·한계:** master 자동 빌드는 위험을 감수하는 개발 빌드로 안내되므로 안정 릴리스와 구분해요.
- **조건·한계:** 1.8 릴리스의 내부 Godot 4.7.2 사용은 저작 도구의 구현 정보이며 내 게임 엔진의 필수 버전을 뜻하지 않아요.
- **확인한 릴리스:** [1.8](https://github.com/RodZill4/material-maker/releases/tag/1.8) · 한국 날짜 2026-10-25. 내일 최신 여부 재확인.
- **원문:** [저장소](https://github.com/RodZill4/material-maker), [확인한 README](https://github.com/RodZill4/material-maker/blob/7d6daae3c74c09720afe4138ce09699ab3591ce1/README.md), [라이선스](https://github.com/RodZill4/material-maker/blob/7d6daae3c74c09720afe4138ce09699ab3591ce1/LICENSE.md). 소스 revision `7d6daae3c74c09720afe4138ce09699ab3591ce1`.
  - [공식 README의 편집 화면](https://raw.githubusercontent.com/RodZill4/material-maker/7d6daae3c74c09720afe4138ce09699ab3591ce1/material_maker/doc/images/screenshot.png) · 원문 연결 확인, 전체 시청/개별 재사용 권리 전수 검증 미실시.

### 기반 기술 4 · Effekseer

- **설명:** 폭발·마법 같은 파티클 효과를 편집하고 게임에서 재생할 수 있게 만드는 이펙트 도구예요.
- **선정 이유:** 효과의 모양뿐 아니라 재생 시간·타이밍·게임 화면 가독성을 함께 연습할 수 있어요.
- **적용 경로:** 에디터에서 만든 효과를 대상 엔진용 런타임·플러그인으로 재생하거나 2D 애니메이션으로 내보내는 경로를 선택해요. 에디터와 플러그인의 지원 버전을 맞춰야 해요.
- **주 라이선스:** 주 코드 MIT. 도구·DirectX·Vulkan 런타임 별도 라이선스 파일에 제3자 조건이 함께 있어 배포 구성에 맞춰 확인해야 해요.
- **작은 실습 제안:** 0.5초짜리 피격 효과 하나를 만들고 색·입자 수·발광·잔상 중 한 항목만 바꿔 시야 방해와 타격 시점을 비교하는 실습을 AI와 계획해요. 수치는 편집 제안이에요.
- **조건·한계:** README는 master를 개발 브랜치로 명시하며 제품에 사용하지 말라고 안내해요.
- **조건·한계:** 주 코드 MIT와 별도로 LICENSE_TOOL·LICENSE_RUNTIME_DIRECTX·LICENSE_RUNTIME_VULKAN에 제3자 고지가 있어요. DirectX Tool Kit의 Ms-PL, glslang의 여러 BSD 계열 고지 등을 확인했으며 전체 의존성 전수 감사는 하지 않았어요.
- **조건·한계:** GitHub 릴리스 시각은 한국 시간 2026.10.30, 공식 웹 뉴스는 2026.10.31로 표기가 달라 두 출처의 배포 시각·공지 날짜를 그대로 구분해요.
- **조건·한계:** README의 Godot 연결은 ForGodot3 저장소를 가리키므로 현재 사용하는 Godot 버전과 플러그인 호환을 재확인해야 해요.
- **확인한 릴리스:** [1.80.8](https://github.com/effekseer/Effekseer/releases/tag/1808) · 한국 날짜 2026-10-30. 내일 최신 여부 재확인.
- **원문:** [저장소](https://github.com/effekseer/Effekseer), [확인한 README](https://github.com/effekseer/Effekseer/blob/b5700082b49bc5f919610880dafddc90211a9a4e/README.md), [라이선스](https://github.com/effekseer/Effekseer/blob/b5700082b49bc5f919610880dafddc90211a9a4e/LICENSE). 소스 revision `b5700082b49bc5f919610880dafddc90211a9a4e`.
  - [구성별 추가 라이선스](https://github.com/effekseer/Effekseer/blob/b5700082b49bc5f919610880dafddc90211a9a4e/LICENSE_TOOL)
  - [구성별 추가 라이선스](https://github.com/effekseer/Effekseer/blob/b5700082b49bc5f919610880dafddc90211a9a4e/LICENSE_RUNTIME_DIRECTX)
  - [구성별 추가 라이선스](https://github.com/effekseer/Effekseer/blob/b5700082b49bc5f919610880dafddc90211a9a4e/LICENSE_RUNTIME_VULKAN)
  - [공식 README의 시연 영상](https://www.youtube.com/watch?v=WwNX9TO7guA) · 원문 연결 확인, 전체 시청/개별 재사용 권리 전수 검증 미실시.
  - [공식 README 이미지](https://raw.githubusercontent.com/effekseer/Effekseer/b5700082b49bc5f919610880dafddc90211a9a4e/docs/Images/EpicMegaGrants_Effekseer.png) · 원문 연결 확인, 전체 시청/개별 재사용 권리 전수 검증 미실시.

### 기반 기술 5 · Voxel Tools for Godot

- **설명:** Godot에서 땅을 파거나 동굴·터널을 만드는 입체 복셀 지형을 다루는 C++ 모듈·확장이에요.
- **선정 이유:** 플레이 중 지형을 바꾸고 바뀐 지형의 충돌·저장을 확인하는 실습에 적합해요.
- **적용 경로:** Module판은 Voxel Tools가 포함된 커스텀 Godot와 맞는 export template을 사용해요. GDExtension판은 공식 문서상 Godot 4.4.1+의 네이티브 애드온이며 일반 export template을 사용해요.
- **주 라이선스:** 주 라이선스 MIT. 배포 시 저작권·허락 고지를 유지하며 제3자·별도 표시 자료의 조건도 확인해요.
- **작은 실습 제안:** 작은 복셀 지형에서 구멍 하나를 파고, 청크 경계·충돌·저장 후 재로드를 확인할 최소 프로젝트 계획을 AI에게 요청해요. 먼저 Module과 GDExtension 중 현재 환경에 맞는 방식을 결정해요.
- **조건·한계:** GDExtension판은 더 최근 경로로 테스트가 적고 Module판과 차이가 있어요. 공식 문서상 FastNoise2는 GDExtension판에 포함되지 않아요.
- **조건·한계:** Module판에서 기본 Godot export template을 그대로 쓰면 모듈이 없어 장면이 열리지 않을 수 있어요.
- **조건·한계:** 모든 플랫폼·옵션의 미리 빌드된 배포본이 제공되는 것은 아니며 일부는 직접 빌드해야 해요.
- **조건·한계:** 공식 문서는 릴리스를 개발 스냅샷으로 설명해요. 1.7 태그의 커스텀 Godot는 4.7.2이며 설치판·확장판 차이를 확인해야 해요.
- **확인한 릴리스:** [1.7 (Godot 4.7.2 custom module build)](https://github.com/Zylann/godot_voxel/releases/tag/v1.7) · 한국 날짜 2026-08-21. 내일 최신 여부 재확인.
- **원문:** [저장소](https://github.com/Zylann/godot_voxel), [확인한 README](https://github.com/Zylann/godot_voxel/blob/5a360508da76bb4ff665ab50024a31a3f4f30424/README.md), [라이선스](https://github.com/Zylann/godot_voxel/blob/5a360508da76bb4ff665ab50024a31a3f4f30424/LICENSE.md). 소스 revision `5a360508da76bb4ff665ab50024a31a3f4f30424`.
  - [공식 README의 블록형 지형](https://raw.githubusercontent.com/Zylann/godot_voxel/5a360508da76bb4ff665ab50024a31a3f4f30424/doc/source/images/blocky_screenshot.webp) · 원문 연결 확인, 전체 시청/개별 재사용 권리 전수 검증 미실시.
  - [공식 README의 매끄러운 지형](https://raw.githubusercontent.com/Zylann/godot_voxel/5a360508da76bb4ff665ab50024a31a3f4f30424/doc/source/images/smooth_screenshot.webp) · 원문 연결 확인, 전체 시청/개별 재사용 권리 전수 검증 미실시.

### 기반 기술 6 · Recast Navigation

- **선정 이유:** 좁은 문·경사·장애물이 있는 맵에서 NPC의 통과 영역과 실패 이유를 설명하는 학습에 적합해요.
- **핵심 기능:** 삼각형 지형에서 걸어 다닐 수 있는 내비게이션 메시를 생성해요.
- **핵심 기능:** Detour는 런타임 경로 탐색·메시 질의를, DetourCrowd는 이동·충돌 회피·군중 시뮬레이션을 담당해요.
- **핵심 기능:** 타일 기반 구성과 DetourTileCache를 이용한 큰 월드의 내비게이션 데이터 처리 경로가 있어요.
- **적용 경로:** C++ 라이브러리를 자체 엔진이나 네이티브 모듈에 연결하는 방식이에요. 생성 단계와 런타임 탐색 단계를 나눠 설계해야 해요. README는 Unity·Unreal·Godot 등에서 사용하는 기반 기술이라고 설명하지만 각 엔진의 기존 내비게이션을 자동 교체하는 공용 플러그인은 아니에요.
- **라이선스 범위:** Zlib. 상업적 사용·수정·재배포를 허용하며 원저자 오인 금지, 수정 소스 표시, 소스 배포 시 고지 보존 조건을 확인했어요.
- **작은 실습 제안:** AI에게 방 두 개와 좁은 문이 있는 예제를 만들게 요청하고, 캐릭터 반지름만 바꾸면서 통과 가능 영역·경로·실패 사유를 표시해 보세요.
- **조건·한계:** 에이전트 높이·반지름·경사·셀 크기와 지형에 맞는 베이크 설정이 필요해요.
- **조건·한계:** 동적 장애물·대규모 군중·타일 갱신 비용은 실제 목표 환경에서 확인해야 해요.
- **조건·한계:** 여기서 AI 내비게이션은 게임 캐릭터의 길 찾기 기능이며 LLM 게임 제작 에이전트가 내장됐다는 뜻은 아니에요.
- **GitHub에서 확인한 릴리스:** [v1.6.0](https://github.com/recastnavigation/recastnavigation/releases/tag/v1.6.0) · 한국 날짜 2023-05-22. 내일 최신 여부 재확인.
- **원문:** [요청한 저장소](https://github.com/recastnavigation/recastnavigation), [확인한 README](https://raw.githubusercontent.com/recastnavigation/recastnavigation/9f4ce64458dfae86e1239c525ddc219c4e9e06f1/README.md), [라이선스](https://raw.githubusercontent.com/recastnavigation/recastnavigation/9f4ce64458dfae86e1239c525ddc219c4e9e06f1/License.txt). 확인 revision `9f4ce64458dfae86e1239c525ddc219c4e9e06f1`.
  - [공식 문서와 예제](https://recastnav.com/) · 원문 연결 확인, 전체 시청·빌드·개별 재사용 권리 전수 검증 미실시.
  - [공식 RecastDemo 이미지](https://raw.githubusercontent.com/recastnavigation/recastnavigation/9f4ce64458dfae86e1239c525ddc219c4e9e06f1/Docs/Images/screenshot.png) · 원문 연결 확인, 전체 시청·빌드·개별 재사용 권리 전수 검증 미실시.

### 기반 기술 7 · ozz-animation

- **선정 이유:** 두 동작의 전환과 루프 경계를 보며 애니메이션 데이터·런타임 연결을 공부할 수 있어요.
- **핵심 기능:** 스켈레탈 애니메이션 데이터를 로딩·샘플링·블렌딩하는 런타임을 제공해요.
- **핵심 기능:** glTF·FBX 등 주요 DCC 형식을 최적화된 ozz 런타임 구조로 바꾸는 도구와 오프라인 라이브러리가 있어요.
- **핵심 기능:** 렌더러·게임 엔진에 종속되지 않는 저수준 C++ 구현이에요.
- **적용 경로:** 애니메이션 원본을 오프라인 변환한 뒤 엔진의 C++ 런타임에서 읽고 샘플링하며, 결과를 자체 스켈레톤·렌더러에 전달해요. 현재 README의 런타임 요구는 C++17이며 WebAssembly·Linux·macOS·Windows, x86/x64·ARM 시험 범위를 안내해요.
- **라이선스 범위:** MIT. 배포본의 해당 코드·상당 부분에 저작권 및 허가 고지를 유지해요. 샘플·변환 도구의 외부 의존성 조건은 별도로 확인해야 해요.
- **작은 실습 제안:** AI에게 동일 스켈레톤의 대기·걷기 두 클립을 변환·블렌딩하는 최소 예제와 검사표를 요청하고, 발 미끄러짐과 루프 경계를 직접 비교해 보세요.
- **조건·한계:** 엔진 애니메이션 편집기·캐릭터 컨트롤러를 통째로 제공하는 제품은 아니에요.
- **조건·한계:** 뼈 구조·좌표계·압축/보간 설정과 엔진 데이터 연결을 설계해야 해요.
- **조건·한계:** 샘플·툴·테스트는 GLFW·tinygltf·FBX SDK 등의 외부 구성 요소를 사용하므로 런타임과 빌드 도구 요구 사항을 구분해요.
- **GitHub에서 확인한 릴리스:** [0.17.0](https://github.com/guillaumeblanc/ozz-animation/releases/tag/0.17.0) · 한국 날짜 2026-08-02. 내일 최신 여부 재확인.
- **원문:** [요청한 저장소](https://github.com/guillaumeblanc/ozz-animation), [확인한 README](https://raw.githubusercontent.com/guillaumeblanc/ozz-animation/744eb9d99f606eda849acb0b1204f7a3dc20bca1/README.md), [라이선스](https://raw.githubusercontent.com/guillaumeblanc/ozz-animation/744eb9d99f606eda849acb0b1204f7a3dc20bca1/LICENSE.md). 확인 revision `744eb9d99f606eda849acb0b1204f7a3dc20bca1`.
  - [README가 연결한 공식 문서·샘플 사이트](https://guillaumeblanc.github.io/ozz-animation/) · 원문 연결 확인, 전체 시청·빌드·개별 재사용 권리 전수 검증 미실시.

### 기반 기술 8 · The Forge

- **선정 이유:** 렌더링·자원 로딩·수명 관리가 어떻게 연결되는지 살펴볼 고급 기반 기술 자료예요. 일반 엔진 사용보다 통합 부담이 커요.
- **핵심 기능:** 크로스 플랫폼 제품 개발에 사용하는 그래픽·OS·유틸리티 기반 프레임워크예요.
- **핵심 기능:** 비동기 리소스 로더·셰이더 도구·입력/파일 시스템과 ozz 기반 애니메이션 같은 구성 요소를 설명해요.
- **핵심 기능:** 현재 공개 저장소 README는 PC/DirectX 12 런타임만 포함한다고 명시해요.
- **적용 경로:** 자체 엔진이나 그래픽 응용프로그램의 하부 구조로 통합하는 방식이에요. 기존 엔진의 장면 편집기 플러그인처럼 바로 설치하는 도구가 아니며 현재 공개 코드의 대상은 Windows PC/DirectX 12예요.
- **라이선스 범위:** 현재 Codeberg 공개 PC/DirectX 12 코드에는 Apache 2.0을 안내해요. 다른 플랫폼은 상용 라이선스로 별도 제공한다고 명시하므로 과거 GitHub의 PC·모바일 공개 범위를 현재 전체에 일반화하면 안 돼요. 포함 외부 라이브러리·별도 미들웨어 조건도 확인해야 해요.
- **작은 실습 제안:** AI에게 공개 PC 코드의 가장 작은 Transformation 예제에서 모델 하나를 로딩·표시하는 경로를 설명하게 하고, 프레임 시간·자원 해제·빌드 요구 사항을 확인해 보세요.
- **조건·한계:** GitHub README는 1.64부터 Codeberg로 개발을 이어 간다고 안내해요. 최신 조사에서는 이동된 공식 원문을 함께 봐야 해요.
- **조건·한계:** 전체 제품의 지원 플랫폼 목록과 공개 저장소에 실제 포함된 플랫폼을 구분해야 해요.
- **조건·한계:** README는 Scene·Resource Streaming 일부가 제공되지 않고 Physics·Networking·Sound도 포함하지 않는다고 설명해요.
- **조건·한계:** 홍보되는 고급 미들웨어·모든 콘솔 코드가 공개 저장소에 포함된다고 가정하지 않아요.
- **GitHub에서 확인한 릴리스:** [v1.63](https://github.com/ConfettiFX/The-Forge/releases/tag/v1.63) · 한국 날짜 2025-03-21. 내일 최신 여부 재확인.
- **원문:** [요청한 저장소](https://github.com/ConfettiFX/The-Forge), [확인한 README](https://raw.githubusercontent.com/ConfettiFX/The-Forge/cd5046893faba2dc7869243873bf01f02a6f0df9/README.md), [라이선스](https://raw.githubusercontent.com/ConfettiFX/The-Forge/cd5046893faba2dc7869243873bf01f02a6f0df9/LICENSE). 확인 revision `cd5046893faba2dc7869243873bf01f02a6f0df9`.
- **현재 공식 원문:** [이전된 저장소](https://codeberg.org/The-Forge/The-Forge), [현재 README](https://codeberg.org/The-Forge/The-Forge/src/branch/master/README.md), [현재 LICENSE](https://codeberg.org/The-Forge/The-Forge/src/branch/master/LICENSE.txt). 확인 revision `5abcdd969d0d883e9bf91f6926a8ea0935a0b3bc`. README에 Release 1.64, August 12th, 2026으로 안내; 이는 README 날짜 표기이며 시각·시간대는 미표시. **과거 GitHub의 PC·모바일 공개 범위를 현재 전체에 적용하지 않는다.** 현재 공개 저장소는 PC/DirectX 12이며 별도 플랫폼·미들웨어 조건을 구분한다.
  - [현재 공식 저장소의 유닛테스트별 설명·스크린샷](https://codeberg.org/The-Forge/The-Forge) · 원문 연결 확인, 전체 시청·빌드·개별 재사용 권리 전수 검증 미실시.
  - [과거 GitHub 공식 구성도; 현재 공개 플랫폼 범위는 별도 확인](https://github.com/ConfettiFX/The-Forge-Media/raw/master/Screenshots/TheForgeOverview.png) · 원문 연결 확인, 전체 시청·빌드·개별 재사용 권리 전수 검증 미실시.

### 기반 기술 9 · meshoptimizer

- **선정 이유:** 받아 온 3D 소품을 프로젝트 예산에 맞추면서 용량·형태·실제 프레임 시간을 나눠 비교하는 연습에 적합해요.
- **핵심 기능:** 인덱스/정점 캐시·오버드로·정점 페치 순서를 최적화하고 메시 단순화·양자화·압축 기능을 제공해요.
- **핵심 기능:** C/C++ API와 일부 JavaScript API가 있으며 다른 언어는 FFI 등으로 연결할 수 있어요.
- **핵심 기능:** 함께 제공되는 gltfpack은 glTF 자산을 처리하는 명령줄 도구예요.
- **적용 경로:** 모델을 배포하기 전 자산 파이프라인에서 gltfpack으로 처리하거나 엔진의 C/C++ 코드에 라이브러리를 연결해요. 압축 glTF를 사용하면 로더의 EXT/KHR_meshopt_compression 지원도 확인해야 해요.
- **라이선스 범위:** MIT. 저작권·허가 고지를 보존하며 README는 사용자 문서나 크레딧에 meshoptimizer 출처를 표시하는 예시도 제공해요.
- **작은 실습 제안:** 소품 GLB 하나의 원본과 최적화본을 같은 장면·카메라·기기에서 비교해 폴리곤 수·파일 용량·실루엣·UV·프레임 시간을 기록하는 작업을 AI에 요청해 보세요.
- **조건·한계:** 단순화·양자화와 데이터 압축은 품질/정밀도 특성이 같지 않으므로 옵션별 결과를 비교해요.
- **조건·한계:** 파일 크기 감소가 모든 기기의 FPS 향상을 보장하지 않아요. README도 실제 목표 GPU에서 측정해야 한다고 설명해요.
- **조건·한계:** 실험적 API는 버전 간 시그니처·동작이 바뀔 수 있으므로 릴리스 노트를 확인해요.
- **GitHub에서 확인한 릴리스:** [v1.3](https://github.com/zeux/meshoptimizer/releases/tag/v1.3) · 한국 날짜 2026-09-26. 내일 최신 여부 재확인.
- **원문:** [요청한 저장소](https://github.com/zeux/meshoptimizer), [확인한 README](https://raw.githubusercontent.com/zeux/meshoptimizer/f0a684f11ead064e176775c9b796f82a55910e92/README.md), [라이선스](https://raw.githubusercontent.com/zeux/meshoptimizer/f0a684f11ead064e176775c9b796f82a55910e92/LICENSE.md). 확인 revision `f0a684f11ead064e176775c9b796f82a55910e92`.
  - [공식 gltfpack 문서](https://github.com/zeux/meshoptimizer/blob/f0a684f11ead064e176775c9b796f82a55910e92/gltf/README.md) · 원문 연결 확인, 전체 시청·빌드·개별 재사용 권리 전수 검증 미실시.
  - [공식 README의 메시 단순화/LOD 설명](https://github.com/zeux/meshoptimizer) · 원문 연결 확인, 전체 시청·빌드·개별 재사용 권리 전수 검증 미실시.

### 기반 기술 10 · FastNoise2

- **선정 이유:** 같은 시드에서 변수 하나만 바꿔 절차적 지형·텍스처 데이터가 어떻게 달라지는지 관찰할 수 있어요.
- **핵심 기능:** SIMD를 활용하는 C++17 노이즈 생성 라이브러리로 2D·3D·4D와 2D 타일링을 지원해요.
- **핵심 기능:** Perlin·Simplex·Cellular, 프랙털·블렌드·도메인 워핑을 노드로 조합해요.
- **핵심 기능:** Node Editor에서 만든 그래프를 문자열로 직렬화해 런타임 라이브러리에 불러올 수 있어요.
- **적용 경로:** 높이맵·밀도장·텍스처용 수치 데이터를 생성하는 단계에 연결해요. C++ 라이브러리를 직접 통합하거나 README가 연결한 별도 바인딩을 검토해요. 지형 메시·충돌·LOD·스트리밍은 사용하는 엔진에서 추가 구현해야 해요.
- **라이선스 범위:** MIT. 해당 코드·상당 부분을 배포할 때 저작권·허가 고지를 보존해요. FastSIMD와 별도 언어/엔진 바인딩은 각 저장소의 조건도 확인해야 해요.
- **작은 실습 제안:** 같은 시드에서 주파수·워핑 강도만 달리한 높이맵 두 개를 만들도록 AI에 요청하고, 청크 경계 연결·범위·생성 시간을 비교해 보세요.
- **조건·한계:** README는 Windows에서 MSVC의 SIMD 생성 문제 때문에 ClangCL을 권장하므로 선택 버전과 툴체인을 확인해요.
- **조건·한계:** 본문 비교 벤치마크는 저자가 공개한 특정 CPU/컴파일러 조건이며 우리 프로젝트 실측값이 아니에요.
- **조건·한계:** 2026.11.06 한국 시간의 최근 커밋은 C API 헤더의 stdbool.h 추가로, 새로운 노이즈 모델이나 성능 향상 릴리스라고 소개하지 않아요.
- **GitHub에서 확인한 릴리스:** [v1.1.1](https://github.com/Auburn/FastNoise2/releases/tag/v1.1.1) · 한국 날짜 2026-02-25. 내일 최신 여부 재확인.
- **원문:** [요청한 저장소](https://github.com/Auburn/FastNoise2), [확인한 README](https://raw.githubusercontent.com/Auburn/FastNoise2/c35d6041ce7efc05bc84e26d762f6a38d2dcc71e/README.md), [라이선스](https://raw.githubusercontent.com/Auburn/FastNoise2/c35d6041ce7efc05bc84e26d762f6a38d2dcc71e/LICENSE). 확인 revision `c35d6041ce7efc05bc84e26d762f6a38d2dcc71e`.
  - [공식 Web Node Editor](https://auburn.github.io/FastNoise2/) · 원문 연결 확인, 전체 시청·빌드·개별 재사용 권리 전수 검증 미실시.
  - [README의 노드 지형 미리보기](https://github.com/user-attachments/assets/acda59bd-1245-40dd-8f0e-06fa8a17c60d) · 원문 연결 확인, 전체 시청·빌드·개별 재사용 권리 전수 검증 미실시.
  - [저자 성능 추적 페이지; 직접 재현하지 않음](https://auburn.github.io/fastnoise2benchmarking/) · 원문 연결 확인, 전체 시청·빌드·개별 재사용 권리 전수 검증 미실시.


### 작은 실습에 공통으로 제공할 AI 프롬프트 초안

다음은 편집 제안이며 코드 실행 결과가 아니다. 실제 리포트에서는 복사 버튼·선택 가능한 원문·실패 대안을 연결한다.

```text
[사용 엔진·버전], [플랫폼·장비], [내가 만들 장면]에서 [선택한 저장소 하나]를 검토하고 싶어.
공식 [README·라이선스·선택 릴리스 링크]를 먼저 확인하고 내 엔진의 기존 기능으로 해결할 수 있는지도 비교해 줘.
해결할 기능 하나, 필요한 입력/출력과 의존성·통합 경로, 라이선스/제3자 고지, 아직 확인하지 못한 조건을 나눠 줘.
설치·빌드가 필요하면 사본에서 어떤 파일을 바꾸고 어떤 최소 테스트로 확인할지 먼저 계획해 줘.
[한 번에 바꿀 변수]만 다른 두 예제와 [관찰할 결과/완료 조건]을 담은 기록표를 만들어 줘.
실제 실행·측정하지 못한 것은 예상 절차로 표시하고 속도·FPS·품질·상용급 완성을 단정하지 마.
이어서 [오류 로그·실제 캡처·측정 조건]을 보고 원인 후보 하나와 다시 확인할 테스트를 제안해 줘.
```

### 최종 포함 체크

- [ ] 루키스 KDC와 후속 과정: 모집 상태·자부담·학생 자격·미확인·출시 지원 조건
- [ ] Jolt Physics
- [ ] Terrain3D
- [ ] Material Maker
- [ ] Effekseer
- [ ] Voxel Tools for Godot
- [ ] Recast Navigation
- [ ] ozz-animation
- [ ] The Forge: 현재 공식 원문과 공개 범위
- [ ] meshoptimizer
- [ ] FastNoise2: 최근 커밋과 릴리스·성능 주장을 구분
- [ ] 역할 지도·도입 경로 비교·흐름도·공식 미디어·실습 프롬프트·핵심 하이라이트
- [ ] 기존 전체 주간 조사와 독립 한국어·내용·화면 검수, 최종 파일 해시·배포 대조·정상 봇 전송

이 체크리스트는 실제 작업 후에만 완료 표시한다. 현재는 발행 준비 조사·예약 연결 단계이며, 2026-11-07호의 작성·공개 배포·Discord 전송이 끝났다는 기록이 아니다.
