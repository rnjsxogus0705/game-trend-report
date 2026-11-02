# Game Trend Report

게임마이스터고 학생을 위한 게임·AI·취업 리서치 아카이브.

주간 동향과 심층 분석을 통합합니다. 현재 Mac 예약은 매주 토요일 08:00(Asia/Seoul)에 제작을 시작하고 검수·배포 후 두 Discord 채널로 전송합니다. Windows의 별도 구성은 07:00 준비·08:00 전송이며 현재 전송 채널 한 곳만 지원합니다. 매월 1일 별도 발행은 하지 않습니다.

이 저장소의 main 브랜치 루트를 GitHub Pages로 배포합니다. 새 HTML 리포트와 index.html을 main에 푸시하면 사이트가 갱신됩니다. 조사·리포트 작성은 별도로 설정된 Codex 정기 작업이 수행합니다.

공개 리포트, 디자인 자산, 제작 지침과 운영 스크립트를 보관합니다. 인증 토큰·Windows 사용자별 봇 인증 파일·비공개 검수/전송 기록은 포함하지 않습니다.

## 최신 주간 품질 기준 재현

현재 구성 참고본은 [2026-10-31 주간호](reports/weekly-2026-10-31.html)이며, 다음 호의 기사·가격·순위·게임 데이터를 복사할 템플릿은 아닙니다. 다른 PC에서도 최신 지침을 동기화하고 [품질 검수 6단계와 예약 전문](instructions/READING-AND-SCHEDULER.md), [출력 계약의 qualityReview](instructions/REPORT-OUTPUT-CONTRACT.md)를 따릅니다.

7영역의 실습 프롬프트(현재 참고본 12개), 최근 해외 AI 제작 사례의30일/90일 기준과 AI 범위 구분, 전체 제목·도입문 및 본문 독립 한국어 검수, 생성 그림·공식 미디어·도표, 4범주·상단 요약·하이라이트·최소 글자·반응형/복사 검사를 함께 적용합니다. 2026-11-07 이후에는 적용 지침 커밋, 서로 다른 편집자·검수자, 9개 기준별 실제 근거·한계와 미해결 문제를 content-review에 남겨야 발행·전송 검증을 통과합니다. 자동 검사는 형식과 파일 일치를 확인하므로 실제 원문 조사·문맥 검수·화면 검사를 대신하지 않습니다.

새 PC는 스킬 설치뿐 아니라 image_gen 사용 가능 여부도 확인합니다. 한국어 생성 그림은 실제로 열어 읽고 오류를 보정합니다. 사용할 수 없으면 정확한 HTML 설명과 누락 범위를 기록하며, 별도 유료 API를 자동 결제하는 방식으로 대체하지 않습니다. Codex 예약은 저장소에 포함되지 않으므로 아래 초기 설정 후 최신 전문으로 다시 등록합니다. 이번 점검은 기존 예약을 새로 만들거나 메시지를 전송하지 않습니다.

## 주간 리포트 하네스

저장소에서 `$weekly-game-report 이번 주 리포트를 생성하고 검수해 줘`로 호출합니다. [프로젝트 스킬](.agents/skills/weekly-game-report/SKILL.md)과 [명세](.agents/skills/weekly-game-report/references/harness-spec.json)가 조사·작성·독립 검수·화면 검사·배포 준비의 순서를 고정합니다. 실제 품질 기준은 기존 instructions를 재사용합니다.

작성자와 다른 네이티브 검수자가 전체 한국어·내용·최종 파일을 검토하고, 수정은 최대2회입니다. 지침·파일·upstream hash가 바뀌면 하위 검수는 다시 수행합니다. 저장소에서 `node workflows/check-report-harness.mjs --run 실제-run-id`로 준비 묶음을 검사합니다. `_workspace/`의 실행 기록과 검수 영수증은 Git에 넣지 않습니다.

새 PC에서는 프로젝트 스킬과 검사기가 clone으로 함께 내려옵니다. Codex에서 실제 저장소를 열고 스킬 인식을 확인하세요. Windows는 저장소 `site/`에서 실행합니다. OS별 예약 전문은 [최신 예약 지침](instructions/READING-AND-SCHEDULER.md)을 사용합니다. 실제 리포트 작성·배포·전송은 하네스 설치와 별개입니다. 자동 부분 재개 엔진과 별도 모델 서버는 포함하지 않습니다.

## 다른 컴퓨터에서 처음 설정하기

아래 1~10단계는 **Windows 운영 폴더와 PowerShell 설정**입니다. 다른 Mac은 [새 Mac 설정](#새-mac에서-처음-설정하기)을 따르세요. 저장소를 클론하는 것만으로 조사 도구·배포·봇 인증·예약 작업이 설치되지는 않습니다. 같은 계정 또는 해당 저장소·프로젝트·서버에 권한이 있는 계정으로 설정하세요. Windows 전송 스크립트는 현재 Discord 채널 한 곳만 지원합니다.

### 1. 필요한 프로그램과 접근 권한

- Git, GitHub CLI(`gh`), Node.js 18 이상(지원 중인 LTS 권장), PowerShell. 명령 예시는 PowerShell에서 실행합니다.
- Codex 데스크톱 앱과 AI 조사·작성에 사용할 로그인/이용 권한. 이 저장소에는 별도 자동 리포트 생성 모델 서버가 없습니다.
- ego lite와 `ego-browser` CLI. 브라우저 로그인과 CLI 등록은 새 컴퓨터에서 다시 준비합니다.
- GitHub 저장소 main에 푸시할 권한, Vercel의 기존 프로젝트를 배포할 권한, 지정 Discord 서버·채널에 봇을 설치하고 메시지를 보낼 권한.

```powershell
git --version
gh --version
node --version
$PSVersionTable.PSVersion
ego-browser skill
```

ego-browser 안내가 `[ego-browser:skill] end of guide`로 끝나는지 확인하세요. 명령이 없으면 ego lite 설치·온보딩 후 새 터미널을 열고 PATH를 확인합니다. 컴퓨터마다 설치된 ego-browser/SKILL.md의 실제 경로가 다를 수 있습니다.

### 2. 클론과 로컬 작업 폴더 만들기

다음은 **새 컴퓨터의 빈 폴더에서 최초 한 번만** 실행합니다. 기존 운영 파일을 덮어쓰는 복구 명령으로 사용하지 마세요.

```powershell
$reportRoot = 'C:\내문서\GameTrendReport'
if (Test-Path -LiteralPath $reportRoot) { throw '이미 존재하는 작업 폴더입니다. 기존 내용을 먼저 확인하세요.' }
New-Item -ItemType Directory -Path $reportRoot -Force | Out-Null
git clone https://github.com/rnjsxogus0705/game-trend-report.git "$reportRoot\site"
if ($LASTEXITCODE -ne 0) { throw '클론 실패' }
foreach ($folder in @('reports','private','redesign','research')) {
  New-Item -ItemType Directory -Path (Join-Path $reportRoot $folder) -Force | Out-Null
}
# 공개 지침을 manifest에 지정된 로컬 위치로 처음 배치합니다.
$reportManifest = Get-Content "$reportRoot\site\instructions\sync-manifest.json" -Raw | ConvertFrom-Json
foreach ($item in $reportManifest.files) {
  $target = Join-Path $reportRoot $item.local
  New-Item -ItemType Directory -Path (Split-Path $target) -Force | Out-Null
  Copy-Item -LiteralPath (Join-Path "$reportRoot\site" $item.repo) -Destination $target
}
Copy-Item "$reportRoot\site\workflows\sync-instructions.ps1" "$reportRoot\sync-instructions.ps1"
```

폴더 역할:

| 경로 | 용도 | Git 포함 |
|---|---|---|
| `site/` | 이 저장소의 체크아웃·공개 HTML·정적 자산·지침 원본 | 예 |
| `reports/` | 작성 중인 HTML·호별 자료·검수·배포·전송 기록 | 공개할 산출물만 build-site가 site/reports로 복사 |
| `private/` | 봇 DPAPI 인증·배포 대상 설정·동기화 상태 | 아니요 |
| `research/` | 호별 조사 원장 | 기본 비공개 |
| `redesign/` | 적용 디자인 지침·참고 문서 | 원본은 site/instructions에서 관리 |

**상위 GameTrendReport 폴더에서 git init/add를 하지 마세요.** Git 루트는 site/입니다. 발행된 과거 HTML은 site/reports/에 이미 있으며, 검수·전송 영수증은 비공개이므로 다른 컴퓨터로 자동 복원되지 않습니다.

### 3. 환경변수 등록

이름과 역할은 아래와 같습니다. 운영 스크립트는 GitHub·Git 작성자 변수를 Windows **사용자 환경변수**, 없으면 시스템 환경변수에서 읽습니다. Vercel 토큰도 사용자/시스템 환경변수를 읽습니다.

| 변수 | 필요 여부 | 설명 |
|---|---|---|
| `GH_TOKEN` | 이 구성의 인증에 필요 | 기존 저장소를 읽고 main에 푸시할 수 있는 GitHub 토큰. 계정/조직의 승인·정책도 충족해야 함 |
| `GH_HOST` | 선택 | 기본 github.com. 이 저장소는 github.com 고정 주소 사용 |
| `GIT_AUTHOR_NAME` | 필요 | 커밋 작성자 표시 이름 |
| `GIT_AUTHOR_EMAIL` | 필요 | GitHub에 등록한 주소 또는 GitHub 제공 noreply 주소 |
| `GIT_COMMITTER_NAME` | 필요 | 커밋 실행자 표시 이름. 보통 AUTHOR와 동일 |
| `GIT_COMMITTER_EMAIL` | 필요 | 커밋 실행자 주소. 보통 AUTHOR와 동일 |
| `VERCEL_TOKEN` | Vercel 배포에 필요 | 아래 기존 팀·프로젝트를 조회하고 배포할 수 있는 토큰 |
| `KAKAO_JAVASCRIPT_KEY` | 현재 불필요 | 현재 카카오톡 버튼은 기기 공유·복사 방식. 이 변수만 등록해도 공식 SDK 공유로 바뀌지는 않음 |

봇 토큰은 환경변수가 아니라 다음 단계의 **Windows DPAPI 파일**에서 읽습니다. DISCORD_TOKEN, DISCORD_WEBHOOK_URL, VERCEL_PROJECT_ID, VERCEL_ORG_ID 환경변수를 추가해도 현재 스크립트의 대상은 자동 변경되지 않습니다. Codex 로그인은 앱에서 관리하므로 이 구성을 위해 OPENAI_API_KEY를 추가할 필요는 없습니다. 별도 도구가 요구하는 API 키는 해당 도구에서 따로 관리합니다.

일반 설정 예시(본인 이름·이메일로 바꾸세요):

```powershell
[Environment]::SetEnvironmentVariable('GIT_AUTHOR_NAME', '본인 GitHub 표시 이름', 'User')
[Environment]::SetEnvironmentVariable('GIT_AUTHOR_EMAIL', '본인 GitHub 이메일', 'User')
[Environment]::SetEnvironmentVariable('GIT_COMMITTER_NAME', '본인 GitHub 표시 이름', 'User')
[Environment]::SetEnvironmentVariable('GIT_COMMITTER_EMAIL', '본인 GitHub 이메일', 'User')
[Environment]::SetEnvironmentVariable('GH_HOST', 'github.com', 'User')
```

토큰은 채팅·문서·커밋·명령 기록에 평문으로 붙이지 말고 Windows의 **사용자 환경변수 편집 창**에 등록하세요. 사용자 환경변수는 비밀 금고가 아니므로 기기 계정 접근도 관리해야 합니다. 등록 후 Codex와 터미널을 다시 열거나 아래 도우미를 실행합니다. 값 전체를 출력하는 환경변수 목록 명령은 공유하지 마세요.

```powershell
. 'C:\내문서\GameTrendReport\github-env.ps1'
gh auth status
git -C 'C:\내문서\GameTrendReport\site' remote -v
# 토큰 값은 출력하지 않고 읽기 연결만 확인합니다. 푸시 권한은 별도로 필요합니다.
gh api repos/rnjsxogus0705/game-trend-report --jq '.full_name'
```

### 4. Vercel 배포 대상 설정

`C:\내문서\GameTrendReport\private\vercel-project.json`을 UTF-8로 만듭니다. 아래 값은 비밀 토큰이 아니라 현재 운영 대상 식별자입니다.

```json
{
  "projectId": "prj_blA2P6zvGDGFRsO1Z5UutTDoV0D0",
  "teamId": "team_qdKIBdJZ9y3jIUzzMVrPk5gp",
  "name": "game-trend-report"
}
```

Vercel 프로젝트는 rnjsxogus0705/game-trend-report GitHub 저장소의 main과 연결되어 있어야 합니다. 루트는 정적 사이트, framework 없음, install/build 명령 없음으로 구성한 기존 프로젝트입니다. Vercel의 GitHub 연결에도 저장소 접근 권한이 필요합니다. 토큰만으로 다른 사람의 프로젝트 권한을 얻지는 못합니다.

GitHub Pages는 기존 저장소 Settings → Pages에서 main / 루트 배포가 활성화되어 있어야 합니다. 현재 공개 주소는 [Pages](https://rnjsxogus0705.github.io/game-trend-report/)와 [Vercel](https://game-trend-report.vercel.app/)입니다. 다른 계정으로 fork한 저장소에 그대로 실행하면 아래 고정 대상 검사가 실패하거나 원래 대상을 가리키므로 먼저 설정과 스크립트를 함께 변경해야 합니다.

### 5. Discord 봇 인증을 새 컴퓨터에서 만들기

현재 대상은 Game Trend Report 봇 `1565897943184310342`, 서버 `1488793489800957966`, 채널 `1565894418156879942`입니다. 기존 봇을 관리할 권한이 있는 사람이 개발자 포털에서 토큰을 준비하세요. 이 설정을 위해 기존 토큰을 무조건 재발급할 필요는 없습니다. 재발급하면 다른 컴퓨터의 기존 토큰도 무효가 됩니다.

봇이 해당 서버에 설치되어 있고 채널 보기·메시지 전송 권한이 있어야 합니다. 일반 전송은 링크 방식이며, HTML 파일 첨부 모드를 쓸 경우 첨부 권한도 필요합니다. 사용자 계정 토큰이나 웹훅으로 대체하지 않습니다.

**실제 예약 작업을 실행할 Windows 사용자로** 다음을 실행해 토큰을 암호화합니다. 입력은 가려지고 평문 토큰을 출력하지 않습니다.

```powershell
$botSecret = Read-Host 'Discord bot token' -AsSecureString
$botSecret | ConvertFrom-SecureString | Set-Content -LiteralPath 'C:\내문서\GameTrendReport\private\bot-token.dpapi' -Encoding utf8
$botSecret = $null
& 'C:\내문서\GameTrendReport\send-report.ps1' `
  -HtmlPath 'C:\내문서\GameTrendReport\reports\weekly-YYYY-MM-DD.html' `
  -Summary '연결 검사' -CheckOnly
```

CheckOnly는 봇·채널 연결만 확인하고 메시지를 보내지 않습니다. 이 검사에서는 예시 HTML이 실제로 없어도 됩니다. 실제 전송에는 검수·배포된 HTML이 필요합니다. DPAPI 파일은 원래 컴퓨터·사용자에 묶이므로 다른 PC의 파일을 복사해서 사용하지 말고 위 절차로 다시 만드세요.

### 6. 한국어 스킬과 디자인 자료 준비

[DaleSeo/korean-skills](https://github.com/DaleSeo/korean-skills)에서 humanizer, grammar-checker, style-guide와 각 references를 새 컴퓨터의 Codex 스킬 폴더에 설치합니다. 설치 후 아래 세 SKILL.md가 읽히는지 확인하세요. 기존 PC의 사용자 이름이 아니라 새 PC의 사용자 홈을 사용합니다.

```powershell
Test-Path "$env:USERPROFILE\.codex\skills\humanizer\SKILL.md"
Test-Path "$env:USERPROFILE\.codex\skills\grammar-checker\SKILL.md"
Test-Path "$env:USERPROFILE\.codex\skills\style-guide\SKILL.md"
```

기존 지침에 남은 `C:/Users/TAEHYEON/.codex/skills/` 표기는 새 PC의 실제 설치 위치로 해석합니다. 스킬 이름만 적거나 검사 기록 JSON을 자동 생성하는 것으로 교정을 대신하지 않습니다.

추가 한국어 문맥 검수에는 [k-skill](https://github.com/NomaDamas/k-skill)의 `korean-humanizer`와 `korean-spell-check` 두 가지만 설치합니다. 다음 예시는 소스 커밋 `cf462ca81af7f83691e7c4b7c4fe0ceb0331fefa`를 고정합니다. 기존 설치를 덮어쓰지 않으며, 전체 스킬을 자동 갱신하지 않습니다.

```powershell
$kSkillRevision = 'cf462ca81af7f83691e7c4b7c4fe0ceb0331fefa'
$kSkillRoot = Join-Path $env:USERPROFILE '.codex\skills'
$kSkillNames = @('korean-humanizer', 'korean-spell-check')
foreach ($name in $kSkillNames) {
  if (Test-Path -LiteralPath (Join-Path $kSkillRoot $name)) { throw "이미 설치됨: $name. 기존 버전과 변경을 먼저 확인하세요." }
}
$kSkillClone = Join-Path $env:TEMP ('k-skill-' + [guid]::NewGuid().ToString('N'))
git clone --no-checkout https://github.com/NomaDamas/k-skill.git $kSkillClone
if ($LASTEXITCODE -ne 0) { throw 'k-skill 소스를 받지 못했습니다.' }
git -C $kSkillClone checkout --detach $kSkillRevision
if ($LASTEXITCODE -ne 0) { throw '고정 커밋을 확인하지 못했습니다.' }
New-Item -ItemType Directory -Force -Path $kSkillRoot | Out-Null
foreach ($name in $kSkillNames) {
  Copy-Item -LiteralPath (Join-Path $kSkillClone $name) -Destination (Join-Path $kSkillRoot $name) -Recurse
  if (!(Test-Path -LiteralPath (Join-Path $kSkillRoot "$name\SKILL.md"))) { throw "설치 확인 실패: $name" }
}
$env:KSKILL_ANALYTICS_DISABLED = '1'
npx -y @nomadamas/k-skill@0.10.4 instruct korean-humanizer
npx -y @nomadamas/k-skill@0.10.4 instruct korean-spell-check
```

스킬 파일은 CLI 안내 스텁이므로 출력된 실제 지침 전체를 읽고, Codex를 다시 열어 설치된 스킬을 인식시킵니다. 외부 웹 맞춤법 검사는 사용자가 요청한 소량 검사에 한하며 정기 작업에서 대량 호출하지 않습니다. 수행하지 않았으면 `externalVerified=false`를 기록하고 모델·수동으로 검토합니다. 새 검수 기준은 2026-11-07 이후 발행 호에 적용하며 [한국어 편집 기준](instructions/KOREAN-EDITORIAL-POLICY.md)에 기록 형식이 있습니다.

다음은 `.language-review.json`의 **추가 필드 구조 예시**입니다. 실제 발행 때는 해당 호의 모든 section ID와 `agent-skills`, 모든 호별 Markdown 파일과 실제 최종 SHA-256을 기입해야 합니다. 아래 값은 설명용이며 검수 영수증으로 사용할 수 없습니다. 기존 `pipeline`, `sha256`, `meaningChecks` 등도 유지합니다.

```json
{
  "naturalnessReview": {
    "editor": "수정 실행 주체",
    "reviewer": "독립 검수 실행 주체",
    "coverage": ["body", "headings", "tables", "captions", "collapsed", "copy", "downloads", "terms"],
    "sectionIdsReviewed": ["issue-summary", "top10", "agent-skills"],
    "changes": [{"path": "weekly-YYYY-MM-DD.html", "before": "기존 문구", "after": "수정 문구", "reason": "문맥을 명확하게 정리"}],
    "fileHashes": {"weekly-YYYY-MM-DD.html": "실제 최종 SHA-256", "weekly-YYYY-MM-DD-ideas.md": "실제 최종 SHA-256"},
    "externalVerified": false,
    "externalScope": "",
    "method": "모델 문맥 검수와 독립 최종 검수"
  }
}
```

화면 디자인에는 [Impeccable](https://github.com/pbakaus/impeccable) 4.8.0을 사용합니다. 아래 예시는 이번에 확인한 소스 커밋을 고정해 새 PC에 설치하며, 기존 설치가 있으면 덮어쓰지 않습니다. Codex를 다시 열어 스킬을 인식시킵니다. 실행기가 처음 사용할 엔진을 받으려면 네트워크가 필요할 수 있습니다.

```powershell
$impeccableRevision = 'b7a89176e4e87422b40f98adabceb051dbb5448b'
$impeccableTarget = Join-Path $env:USERPROFILE '.codex\skills\impeccable'
if (Test-Path -LiteralPath $impeccableTarget) { throw 'Impeccable이 이미 설치되어 있습니다. 기존 버전을 확인하세요.' }
$impeccableClone = Join-Path $env:TEMP ('impeccable-' + [guid]::NewGuid().ToString('N'))
git clone --no-checkout https://github.com/pbakaus/impeccable.git $impeccableClone
if ($LASTEXITCODE -ne 0) { throw 'Impeccable 소스를 받지 못했습니다.' }
git -C $impeccableClone checkout --detach $impeccableRevision
if ($LASTEXITCODE -ne 0) { throw '고정 커밋을 확인하지 못했습니다.' }
New-Item -ItemType Directory -Force -Path (Split-Path $impeccableTarget) | Out-Null
Copy-Item -LiteralPath (Join-Path $impeccableClone '.agents\skills\impeccable') -Destination $impeccableTarget -Recurse
if (!(Test-Path -LiteralPath (Join-Path $impeccableTarget 'SKILL.md'))) { throw '스킬 설치를 확인하지 못했습니다.' }
```

화면 작업 시 설치된 `SKILL.md`와 해당 참조 문서를 읽습니다. 실행기 오류 시 프로젝트의 `instructions/DESIGN.md`와 `instructions/READING-AND-SCHEDULER.md`를 직접 읽고 계속 검토합니다. 기존 설치를 갱신할 때는 버전과 로컬 변경을 먼저 확인하세요.

폰트·CSS·Chart.js·HLS.js는 저장소에 들어 있어 리포트를 보거나 발행하는 데 npm install이 필요하지 않습니다. [디자인 자료 전체 안내](instructions/DESIGN-REFERENCE-GUIDE.md)에서 Pretendard 9종 웹폰트·9종 OTF, toss.md, Google DESIGN.md 0.4.0 규격과 라이선스를 확인합니다. 선택적인 디자인 형식 검사는 이 안내에 따라 실행합니다.

### 7. 첫 리포트 작성과 배포

Codex에 이 폴더를 열고 다음을 요청합니다. 이 요청은 사람이 리포트를 작성하도록 지시하는 예시이며 저장소 안에 독립적인 AI 생성 실행기가 있는 것은 아닙니다.

> 최신 instructions/README.md, WORKFLOW.md, REPORT-GUIDE.md, REPORT-OUTPUT-CONTRACT.md, READING-AND-SCHEDULER.md, KOREAN-EDITORIAL-POLICY.md, DESIGN.md와 DESIGN-REFERENCE-GUIDE.md를 읽고 해당 주 실제 조사로 리포트를 작성해 줘. ego-browser로 원문을 확인하고 한국어 3단계 교정, 콘텐츠 검수, 반응형·링크·공유·복사·다운로드 검사를 해 줘. 아직 Discord에는 보내지 마.

작성 결과는 `reports/weekly-YYYY-MM-DD.html`과 호별 필요한 JS·JSON·마크다운, 조사 원장, 검수 기록, `.summary.txt`입니다. 필수 `.content-review.json`·`.language-review.json` 구조와 해시는 Output 지침·validate-issue.mjs를 따릅니다. 과거 영수증을 복사하거나 수행하지 않은 검사를 true로 만들지 않습니다. 공개 리포트가 있다는 이유만으로 원본 검수 영수증까지 복원된 것은 아닙니다.

```powershell
& 'C:\내문서\GameTrendReport\sync-instructions.ps1'
node 'C:\내문서\GameTrendReport\validate-issue.mjs' 'C:\내문서\GameTrendReport\reports\weekly-YYYY-MM-DD.html'
& 'C:\내문서\GameTrendReport\publish-report.ps1' -HtmlPath 'C:\내문서\GameTrendReport\reports\weekly-YYYY-MM-DD.html'
```

YYYY-MM-DD는 실제 발행일로 바꿉니다. publish-report는 검수 → 원격 최신화 → 사이트 생성 → 커밋·푸시 → Pages 본문 확인 → Vercel 배포·본문 확인까지 수행합니다. 두 사이트의 배포 영수증이 생긴 뒤에만 전송 단계로 갑니다. 오류를 무시하고 다음 단계로 진행하지 마세요.

### 8. 전송 검사와 실제 전송

```powershell
# 공개 본문·검수·배포 상태·봇 연결만 검사하며 전송하지 않습니다.
& 'C:\내문서\GameTrendReport\dispatch-report.ps1' -IssueDate 'YYYY-MM-DD' -CheckOnly
# 실제 정기 전송: 한국 시간 토요일 당일, 오전 8시 이후에만 허용됩니다.
& 'C:\내문서\GameTrendReport\dispatch-report.ps1'
```

같은 호에 `.sent.json`이 있으면 중복 전송하지 않습니다. 전송 기록은 컴퓨터끼리 자동 공유되지 않으므로 **정기 전송 담당 PC는 한 대만** 정하세요. 다른 PC에서 수정판을 수동 재전송할 때는 기존 Discord 메시지부터 확인하고 명시적 요청이 있을 때만 고유 Edition을 지정합니다. 기록을 지워 중복 방지를 우회하지 않습니다.

### 9. 새 PC의 Codex 예약 설정

앱의 기존 예약은 Git 클론으로 옮겨지지 않습니다. 새 컴퓨터에서 Codex에 다음 세 예약을 등록하도록 요청합니다. 모두 Asia/Seoul 기준이며 실제 실행 사용자·작업 폴더는 위 설정과 같아야 합니다.

| 예약 | 실행 내용 |
|---|---|
| 매시간 15분 | sync-instructions.ps1 실행. 변경 없으면 조용히 종료, 충돌·실패는 알림 |
| 매주 토요일 07:00 | 지침 동기화·재독 → 최근 7일 조사 → 작성·교정·검수 → 두 사이트 배포 → 요약 저장. 전송하지 않음 |
| 매주 토요일 08:00 | 지침 동기화 → dispatch-report.ps1 → 당일 검수·배포 확인 → 두 링크 전송 |

각 예약에 복사할 전체 실행 문구와 UI·출력 검수 기준은 [읽기 경험과 예약 작업 재현 지침](instructions/READING-AND-SCHEDULER.md)에 있습니다. 재현 항목과 검증 범위는 [새 PC 재현 점검표](instructions/PORTABILITY-AUDIT.md)에서 확인합니다.

담당 PC를 옮기면 이전 PC의 조사·전송 예약을 중지하고 새 PC만 활성화하세요. 같은 날 교체한다면 이전 PC의 비공개 전송 기록을 안전하게 인계하고 각 채널의 실제 메시지를 확인하세요. 기록은 Git으로 복원되지 않으므로 이미 보낸 호를 임의로 재전송하거나 영수증을 조작해 검증을 우회하지 않습니다. 이 예약은 클라우드 실행이 아니므로 PC와 Codex가 실행 중이어야 합니다. 로그인·수면 상태·네트워크로 실제 실행 시각이 달라질 수 있습니다. 예약 문구에는 이 README와 instructions/WORKFLOW.md를 먼저 읽고 실패 시 과거 호로 대체하지 않는 조건도 넣습니다.

### 10. 문제 해결과 다른 배포 대상으로 옮기기

| 증상 | 확인할 내용 |
|---|---|
| gh 인증/푸시 실패 | GH_TOKEN의 계정·기존 저장소 권한·조직 승인, Windows 사용자 환경변수와 gh auth status |
| Git 작성자 오류 | AUTHOR·COMMITTER 4개 변수, Git 이메일 설정 |
| DPAPI 복호화 실패 | 새 PC·실행 Windows 사용자로 봇 토큰을 다시 암호화했는지 |
| Unexpected bot/target | 현재 스크립트는 원래 봇·서버·Vercel 프로젝트만 허용하는지 |
| Vercel 401/403 | VERCEL_TOKEN의 기존 팀·프로젝트 권한·만료, GitHub 연결 권한 |
| 공개 본문 불일치 | 배포 완료·캐시 반영 여부, 올바른 파일·커밋·도메인인지 |
| 검수/영수증 없음 | 실제 조사·교정·검수 수행 후 해당 호의 기록을 새로 작성했는지 |
| 동기화 충돌 | 로컬 변경을 먼저 보존·검토해 instructions/ 또는 workflows/에 반영하고 커밋·푸시. 강제 초기화하지 않음 |

현재 GitHub 계정/저장소, Pages 주소, Discord ID, Vercel ID는 스크립트에 고정되어 있습니다. 다른 대상으로 fork하려면 publish-report.ps1·send-report.ps1·dispatch-report.ps1·deploy-vercel.mjs의 허용 대상/주소, private/vercel-project.json, Git 원격, 실제 서비스 설정을 함께 바꿔 검증해야 합니다. 다른 경로를 쓰려면 deploy-vercel.mjs·vercel-api.mjs의 고정 경로와 예약 문구도 함께 수정합니다. **현재는 환경변수만으로 임의 계정·운영체제·경로에 이식하는 구조가 아닙니다.** 변경은 workflows/ 원본에 커밋하고 sync-instructions의 허용 목록·상태와 일치시킵니다.

설정이 완료되면 최신 지침 적용 커밋, 실제 양쪽 공개 본문, 봇·채널 확인 결과, 첫 전송 기록을 확인하세요. 토큰·private/·검수 및 전송 영수증은 Git에 올리지 않습니다.

## 리포트 지침을 수정하려면
[작성·출력·교정 지침](instructions/README.md)과 [작업 흐름](instructions/WORKFLOW.md)을 참고하세요. 실행 스크립트는 [workflows/](workflows/)에 있습니다. main에 커밋·푸시하면 실행 중인 로컬 Codex가 매시간 및 토요일 작업 직전에 최신 커밋을 확인해 적용합니다. 로컬 수정 충돌은 덮어쓰지 않습니다. 이미 설치한 PC에서 동기화 허용 목록 자체가 바뀐 경우에는 최신 체크아웃의 `workflows/sync-instructions.ps1`을 검토한 다음 로컬 `sync-instructions.ps1`에 한 번 복사해야 합니다. 이전 스크립트는 새 목록을 허용하지 않으므로 교체 전 동기화가 중단됩니다. 이 절차로 로컬 변경 파일을 덮어쓰지 않도록 먼저 비교하세요. 비밀키와 환경별 인증은 이 저장소에 포함하지 않습니다.

## 화면 변경 검증

저장소 루트에서 실행합니다. 브라우저 상호작용 검사를 제외한 검사는 Node.js만 사용하고, 읽기 상호작용 검사는 설치·연결된 ego-browser가 필요합니다.

```sh
node --test workflows/test-build-site.mjs workflows/test-language-review.mjs workflows/test-weekly-presentation.mjs workflows/test-portable-issue.mjs workflows/test-learning-sections.mjs workflows/test-report-harness.mjs
node workflows/test-weekly-editorial.mjs
node workflows/test-public-assets.mjs
node workflows/test-tool-visuals.mjs
node workflows/test-reading-experience.mjs
node workflows/build-site.mjs
```

사이트 생성기는 저장소 안에서는 현재 `reports/`로 메인을 다시 만들고, Windows 운영 폴더에 동기화한 사본은 기존 `reports/`에서 `site/reports/`로 복사합니다. 두 환경 모두 과거 발행물을 보존합니다. 전체 발행 검수는 별도의 실제 조사·교정 영수증과 `validate-issue.mjs`를 계속 사용합니다.

## 새 Mac에서 처음 설정하기

1. Git·GitHub CLI·Node.js 18 이상·Codex 데스크톱 앱을 준비합니다. 접근 권한이 있는 계정으로 아래처럼 이 저장소를 클론하고 최신 main을 확인한 뒤, **클론한 저장소 폴더 자체**를 Codex 프로젝트로 엽니다. 프로젝트의 `.agents/skills/weekly-game-report/`와 `workflows/check-report-harness.mjs`, 채널 목록과 공개 원장은 Git으로 함께 내려옵니다. 전역 harness 생성기와 Python은 주간 실행에 필요하지 않습니다.

   ```sh
   git clone https://github.com/rnjsxogus0705/game-trend-report.git
   cd game-trend-report
   ```

2. 새 Mac에 ego lite/`ego-browser`, humanizer·grammar-checker·style-guide, k-skill의 지정 두 스킬과 Impeccable을 준비합니다. `ego-browser skill`의 전체 안내와 실제 설치된 각 SKILL.md를 읽을 수 있는지, image_gen을 사용할 수 있는지 확인합니다. 설치·검수 기준은 [한국어 편집 기준](instructions/KOREAN-EDITORIAL-POLICY.md)과 [디자인 자료 안내](instructions/DESIGN-REFERENCE-GUIDE.md)를 따릅니다.
3. 기존 GitHub 저장소에 접근할 수 있도록 이 Mac의 `gh` 인증과 Git 작성자를 설정합니다. `GH_TOKEN`을 쓴다면 예약 실행 환경에서 값을 읽을 수 있게 로컬에 준비합니다. 저장소 루트의 Git에서 제외된 `.env`에 기존 봇 토큰을 `DISCORD_BOT_TOKEN`으로 등록하고 파일 접근 권한을 제한합니다. 기존 `.env`는 덮어쓰지 말고 확인합니다. 토큰과 인증 값은 채팅·Git·예약 프롬프트·검수 기록에 넣거나 출력하지 않습니다. 이미 설정된 `DISCORD_BOT_TOKEN` 환경변수는 `.env`보다 먼저 사용됩니다.
4. 저장소 루트에서 파일 접근 권한과 Git 제외 상태를 확인하고 지정 봇과 두 서버·채널 연결을 검사합니다. 마지막 명령은 메시지를 보내지 않습니다. 실패하면 인증이나 권한을 해결한 뒤 계속합니다.

   ```sh
   chmod 600 .env
   git check-ignore .env
   node workflows/discord-delivery.mjs --check
   ```

5. 이전 담당 PC의 예약을 중지하고, 새 Mac의 Codex 앱에서 이 저장소 프로젝트를 대상으로 [macOS 예약 전문](instructions/READING-AND-SCHEDULER.md#macos-새-pc의-토요일-08시-단일-예약)을 로컬 실행·매주 토요일 08:00·Asia/Seoul로 별도 등록합니다. 08시는 제작 시작 시각이며 실제 두 채널 전송은 독립 검수와 배포 확인 후입니다. 예약 객체와 로컬 인증은 Git으로 복원되지 않습니다.

같은 발행일에 담당 PC를 바꾼다면 이전 PC의 비공개 전송 기록을 안전하게 인계하고 두 채널의 실제 메시지를 확인합니다. 이미 보낸 호는 임의로 재전송하지 않으며, 기록 삭제·조작이나 검증 우회로 중복 방지를 무력화하지 않습니다.

## 이 Mac의 두 Discord 채널 전송
로컬 `.env`의 `DISCORD_BOT_TOKEN`에 기존 Game Trend Report 봇 토큰을 보관합니다. 파일은 Git에서 제외하며 빈 항목만으로 인증이 구성되었다고 표시하지 않습니다. 토큰 재발급은 기존 Windows 인증에도 영향을 주므로 임의로 하지 않습니다.

`node workflows/discord-delivery.mjs --check`는 지정 봇(ID1565897943184310342)과 두 서버/채널 접근만 검사하고 메시지를 보내지 않습니다. 실제 검수·공개 배포가 끝난 호는 `node workflows/discord-delivery.mjs --send YYYY-MM-DD`로 요약과 Pages/Vercel 링크를 보냅니다. 서버1488793489800957966의 채널1565894418156879942와 서버1346955649132527707의 채널1566098427052298342만 대상으로 고정합니다. 채널별 private/delivery 영수증으로 중복을 막고 전송 결과가 불확실한 pending 기록은 자동 재전송하지 않습니다.

이 Mac의 등록 예약은 토요일08:00에 제작을 시작하며 검수·배포가 끝난 뒤 전송합니다. 기존 Windows의07시 준비/08시 전송 구성과 동시에 활성화하지 않습니다. OS별 실제 실행과 인증이 다르므로 Node 경로에서 Windows PowerShell을 실행한 것으로 기록하지 않습니다.

## 취업·진로 조사와 다른 PC에서의 재현

매주 스타트업·소규모 게임사 채용, 취업 행사, 게임 제작 부트캠프, 대학 입시, 진로 뉴스를 빠짐없이 조사합니다. 모집이 없거나 원문을 확인하지 못한 범주도 검색 범위와 확인일·한계를 남깁니다. [출력 계약](instructions/REPORT-OUTPUT-CONTRACT.md)의 다섯 범주와 [프로젝트 스킬 명세](.agents/skills/weekly-game-report/references/harness-spec.json)의 조사→작성→독립 검수→준비 게이트가 연결됩니다. 조사 기록 누락·오래된 확인일·출처 미결속·본문 검수 기록 불일치·범주별 독립 검수 누락은 준비/발행 검사에서 차단합니다.

새 PC는 최신 main을 받아 저장소에서 스킬을 실행합니다. 프로젝트의 `.agents/skills/weekly-game-report`, `workflows/check-report-harness.mjs`와 지침은 Git으로 함께 내려오며 전역 harness 생성기/Python은 매주 실행에 필요하지 않습니다. Windows 운영 root의 24개 동기화 목록과 site 저장소 내부 파일의 역할을 혼동하지 마세요. Windows의 07시 준비/08시 전송 전문과 macOS의 08시 단일 예약 전문은 [예약 재현 지침](instructions/READING-AND-SCHEDULER.md)에 각각 있습니다. 예약 객체·토큰·스킬 도구 설치는 Git만으로 복원되지 않으므로 해당 PC에 준비하고 기존 전송 PC와 동시에 활성화하지 않습니다.

AI 게임 제작 오픈소스도 매주 조사합니다. pixelfx·Sprite Fusion의 코드 기반 픽셀 VFX처럼 대형 서비스나 Trending 밖의 실제 제작 도구를 [출력 계약의 탐색 기준과 초기 추적 예시](instructions/REPORT-OUTPUT-CONTRACT.md)에 포함했습니다. 스킬·하네스·OS별 예약 전문이 research.openSourceToolSearch로 연결되며, 새 PC도 최신 main과 예약 전문을 사용합니다. 소개만을 위해 외부 스킬을 자동 설치하거나 코드를 실행하지 않습니다.

공개 자산·데이터셋도 별도로 조사합니다. Scenario 3D Collection은 초기 관찰 예시이며 매주 수치와 이용 조건을 검증 없이 재사용하지 않습니다. `research.openSourceToolSearch.publicAssets`의 조사 범위·확인일·출처·상태·한계와 두 독립 검수의 `publicAssetsReviewed`를 준비 게이트에서 확인합니다. 코드·가중치·자산 배포, 예제 수와 출력 파일 수, 누락 메타데이터, 형식·엔진 경로, 항목별 라이선스와 별도 컬렉션 조건을 구분합니다. 유용한 대표 자료는 선정 이유·공식 미디어·실습과 함께 리포트 및 전송 요약에 반영합니다.

## AI 게임 제작 채널과 다음 호 중복 확인

[주시 목록](instructions/AI-SOLO-CREATOR-WATCHLIST.json)은 저장소 `instructions/`에서 직접 읽는 현재 19개 채널과 개별 참고 영상 3편의 기준입니다. Windows에서는 `site/instructions/` 경로입니다. 세 영상의 채널 전체를 자동 주시 목록에 넣거나 매주 모든 영상을 반복 추천하지 않습니다. 목록 밖의 최신 제작 영상도 한국어와 영어로 검색하고, 존재하는 유효한 이전 호 원장 전체의 `videos`·`channels`·`referenceVideos`에 담긴 videoId와 비교해 재소개 사유를 기록합니다.

매호 `assets/report/research/ai-solo-creators-YYYY-MM-DD.json` 공개 원장에 해당 호의 `reportDate`와 선정 `videos`를 남겨 issue-index의 공개 파일과 최종 해시 검수에 포함합니다. Git에 이 원장이 함께 전달되어야 다음 PC와 다음 호에서 이전 영상을 비교할 수 있습니다. 실제 조사 기록·개별 참고 영상·선정 영상·독립 검수 필드와 실패 기준은 [하네스 운영 계약](.agents/skills/weekly-game-report/references/operating-contract.md)과 [출력 계약](instructions/REPORT-OUTPUT-CONTRACT.md)을 따릅니다. 자동 형식 검사는 실제 원문 조사와 독립 검수를 대신하지 않습니다.
