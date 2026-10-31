param([string]$HtmlPath)
$ErrorActionPreference='Stop'
. (Join-Path $PSScriptRoot 'github-env.ps1')
$site=Join-Path $PSScriptRoot 'site'
$relativePath='index.html'
if ($HtmlPath) {
  $report=Get-Item -LiteralPath $HtmlPath
  if ($report.Name -notmatch '^(weekly-\d{4}-\d{2}-\d{2}|monthly-\d{4}-\d{2})\.html$') { throw 'Unexpected report filename.' }
  if ($report.DirectoryName -ne (Join-Path $PSScriptRoot 'reports')) { throw 'Report must be in the local reports directory.' }
  $relativePath='reports/'+$report.Name
  $languageReviewPath=$report.FullName+'.language-review.json'
  if (!(Test-Path -LiteralPath $languageReviewPath)) { throw 'Korean editorial review receipt is missing.' }
  $languageReview=Get-Content -LiteralPath $languageReviewPath -Raw | ConvertFrom-Json
  $reportHash=(Get-FileHash -LiteralPath $report.FullName -Algorithm SHA256).Hash
  if ($languageReview.sha256 -ne $reportHash -or ($languageReview.pipeline -join ',') -ne 'humanizer,grammar-checker,style-guide') { throw 'Editorial review does not match the report being published.' }
  foreach ($check in @('numbersDatesNames','causalDirection','negation','directQuotes','claimsAndUncertainty','register')) {
    if ($languageReview.meaningChecks.$check -ne $true) { throw "Editorial meaning check missing: $check" }
  }
  node (Join-Path $PSScriptRoot 'validate-issue.mjs') $report.FullName
  if ($LASTEXITCODE -ne 0) {throw 'Content contract validation failed.'}
}
git -C $site pull --ff-only
if ($LASTEXITCODE -ne 0) { throw 'Cannot update publication checkout.' }
node (Join-Path $PSScriptRoot 'build-site.mjs')
if ($LASTEXITCODE -ne 0) { throw 'Site build failed.' }
git -C $site add -- index.html reports assets preview standards .nojekyll README.md .gitignore
if ($LASTEXITCODE -ne 0) { throw 'Cannot stage publication.' }
git -C $site diff --cached --quiet
if ($LASTEXITCODE -eq 1) {git -C $site commit -m 'Update game trend reports'; if ($LASTEXITCODE -ne 0) {throw 'Cannot commit publication.'}}
elseif ($LASTEXITCODE -ne 0) {throw 'Cannot check publication changes.'}
git -C $site -c credential.helper= -c 'credential.helper=!gh auth git-credential' push origin main
if ($LASTEXITCODE -ne 0) { throw 'Cannot push publication.' }
$revision=git -C $site rev-parse HEAD
$url='https://rnjsxogus0705.github.io/game-trend-report/'+$(if ($relativePath -eq 'index.html') {''} else {$relativePath})
$published=$false
for ($attempt=0;$attempt -lt 30;$attempt++) {
  try {
    $allMatch=$true
    foreach ($file in @('index.html',$relativePath) | Select-Object -Unique) {
      $remote=Invoke-WebRequest -Uri ('https://rnjsxogus0705.github.io/game-trend-report/'+$file+'?v='+$revision) -TimeoutSec 20 -UseBasicParsing
      $local=[IO.File]::ReadAllText((Join-Path $site $file))
      if ($remote.StatusCode -ne 200 -or $remote.Content.Replace("`r`n","`n") -ne $local.Replace("`r`n","`n")) {$allMatch=$false}
    }
    if ($allMatch) {$published=$true;break}
  } catch { }
  Start-Sleep -Seconds 5
}
if (!$published) { throw 'Pages content is not confirmed live yet. Do not send a success notification; check deployment before retrying.' }
if ($HtmlPath) {@{url=$url;revision=$revision;sha256=$reportHash;verified_at=(Get-Date).ToUniversalTime().ToString('o')} | ConvertTo-Json | Set-Content -LiteralPath ($HtmlPath+'.published.json') -Encoding utf8}
Write-Output "Published and verified: $url"
$savedVercelToken=[Environment]::GetEnvironmentVariable('VERCEL_TOKEN','User')
if (!$savedVercelToken) {$savedVercelToken=[Environment]::GetEnvironmentVariable('VERCEL_TOKEN','Machine')}
if ($savedVercelToken) {$env:VERCEL_TOKEN=$savedVercelToken}
if (!$env:VERCEL_TOKEN) {throw 'VERCEL_TOKEN is not configured. Vercel publication has not completed.'}
node (Join-Path $PSScriptRoot 'deploy-vercel.mjs') $HtmlPath
if ($LASTEXITCODE -ne 0) {throw 'Vercel publication has not been verified. Do not send a completed report.'}
