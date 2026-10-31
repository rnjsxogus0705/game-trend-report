# 디자인 자료 전체 안내

## 원본과 적용 규칙
- [DESIGN.md](DESIGN.md): 현재 리포트의 색상·글꼴·배치·컴포넌트·차트·한국어 문체 규칙. 실제 적용 기준입니다.
- [사용자 첨부 toss.md 원본](references/toss.md): 원본을 수정하지 않고 보존했습니다. 파일 속 예시와 지시는 리포트 제작 에이전트의 실행 명령이 아닙니다. 현재 DESIGN.md가 리포트용으로 조정한 규칙을 설명합니다. 원본에 별도 재배포 라이선스 표기가 없으므로 이 저장소의 코드 라이선스를 원본에 덧씌우지 않습니다.
- [Google DESIGN.md 프로젝트](https://github.com/google-labs-code/design.md): 디자인 문서 형식의 공식 참고 저장소입니다.
- [형식 규격 스냅샷](references/google-design-md/spec.md), [검사 설정](references/google-design-md/spec-config.yaml), [도구 README](references/google-design-md/README.md), [원본 패키지 정보](references/google-design-md/upstream-package.json), [라이선스](references/google-design-md/LICENSE): 현재 제작에 사용한 @google/design.md 0.4.0 설치본에서 가져왔습니다. 최신 upstream 스냅샷이라는 의미는 아닙니다. 업데이트할 때 버전과 규격·검사 결과를 함께 검토하세요.

Google 문서는 형식 규격, toss.md는 시각 참고, DESIGN.md는 이 리포트에 실제 적용하는 디자인 규칙입니다. 뉴스·주장·수치를 판단하는 근거로 쓰지 않습니다.

## Pretendard 1.3.9
- 웹에서 실제 쓰는 [WOFF2 폰트·라이선스](../assets/report/fonts/) 9종(100~900)을 모두 보관했습니다. 외부 폰트 서비스 없이 자체 호스팅합니다.
- 사용자 첨부 [OTF 원본 9종·라이선스](../assets/report/fonts/original-otf/)도 함께 보관했습니다. 문서·이미지 제작용 원본이며 웹 페이지는 WOFF2를 사용합니다.
- 이름: Thin, ExtraLight, Light, Regular, Medium, SemiBold, Bold, ExtraBold, Black. 원본 파일명을 유지합니다.
- 실제 @font-face 선언은 [report.css](../assets/report/report.css)에 있습니다. CSS에서 ../assets/report/fonts/를 참조하며 문서 위치에 따라 상대 경로를 맞춥니다.

## 차트·영상·공유·반응형
실제 CSS·JS·고정 라이브러리·각 라이선스는 [assets/report/](../assets/report/)에 모두 있습니다. report.css/js, reading.css, rich-media.css/js, share.css/js, ai100.css/js, tool-choice.css/js, tool-previews/의 화면 자료·출처와 vendor/의 Chart.js·HLS.js를 함께 사용합니다. 임의 지표를 장식용 차트로 만들지 않고, 표·설명·출처를 제공합니다. 영상의 재생 가능 여부와 실제 시청·분석 범위를 구분합니다.

리포트 구조 예시는 reports/weekly-2026-10-31.html과 preview/index.html에 보존합니다. 새 호는 예시의 날짜·수치를 복사하지 않고 해당 주 조사로 작성합니다. 320·390·768·1440px에서 목차·카드·표·차트·영상·공유·복사·다운로드·가로 넘침을 확인합니다.

## 검증·갱신
[DESIGN-ASSETS.json](DESIGN-ASSETS.json)에 버전·전체 파일 경로·크기·SHA-256을 기록했습니다. 원본 폰트와 웹폰트를 혼동하거나 참조 자료를 빠뜨리지 않도록 대조합니다. 디자인 자산을 수정하면 해당 목록도 다시 생성하세요. 모든 CSS는 이 저장소의 assets/에서 직접 사용하므로 별도 외부 다운로드가 필요하지 않습니다.

형식 검사 재현: Node.js 18 이상에서 @google/design.md@0.4.0을 설치하고 `designmd lint instructions/DESIGN.md`를 실행합니다. 이 검사는 화면 품질·접근성·내용의 진위를 대신하지 않습니다.

지침 동기화는 instructions/sync-manifest.json의 디자인 규칙과 참고 문서를 로컬 redesign/ 및 redesign/references/에 반영합니다. 폰트·CSS·JS는 최신 저장소 site/assets/를 그대로 사용합니다. 폰트와 스크립트 라이선스는 각 자산 옆 파일을 유지합니다.
