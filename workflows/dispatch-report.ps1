param([string]$IssueDate,[switch]$CheckOnly)
$ErrorActionPreference='Stop'
$nowKst=[TimeZoneInfo]::ConvertTimeBySystemTimeZoneId([DateTime]::UtcNow,'Korea Standard Time')
if (!$IssueDate) {$IssueDate=$nowKst.ToString('yyyy-MM-dd')}
if ($IssueDate -notmatch '^\d{4}-\d{2}-\d{2}$') {throw 'Invalid report date.'}
if (!$CheckOnly -and ($IssueDate -ne $nowKst.ToString('yyyy-MM-dd') -or $nowKst.DayOfWeek -ne 'Saturday' -or $nowKst.Hour -lt 8)) {throw 'Scheduled delivery is only for today on Saturday after 08:00 KST.'}
$reportPath=Join-Path $PSScriptRoot ('reports\weekly-'+$IssueDate+'.html')
if (!(Test-Path -LiteralPath $reportPath)) {throw 'The current issue is not prepared; no earlier issue will be substituted.'}
if (!$CheckOnly -and (Test-Path -LiteralPath ($reportPath+'.sent.json'))) {Write-Output 'This issue was already delivered; no duplicate sent.';return}
node (Join-Path $PSScriptRoot 'validate-issue.mjs') $reportPath
if ($LASTEXITCODE -ne 0) {throw 'Current issue failed content, presentation or language verification; no message sent.'}
$hash=(Get-FileHash -LiteralPath $reportPath -Algorithm SHA256).Hash
$review=Get-Content -LiteralPath ($reportPath+'.language-review.json') -Raw | ConvertFrom-Json
$publication=Get-Content -LiteralPath ($reportPath+'.published.json') -Raw | ConvertFrom-Json
if ($review.sha256 -ne $hash -or $publication.sha256 -ne $hash -or ($review.pipeline -join ',') -ne 'humanizer,grammar-checker,style-guide') {throw 'Current issue does not match its editorial review and deployment receipts.'}
foreach ($check in @('numbersDatesNames','causalDirection','negation','directQuotes','claimsAndUncertainty','register')) {if ($review.meaningChecks.$check -ne $true) {throw "Editorial check is missing: $check"}}
$expectedUrl='https://rnjsxogus0705.github.io/game-trend-report/reports/weekly-'+$IssueDate+'.html'
if ($publication.url -ne $expectedUrl) {throw 'Unexpected publication URL.'}
$remote=Invoke-WebRequest -Uri ($expectedUrl+'?verified='+$hash.Substring(0,12)) -UseBasicParsing -TimeoutSec 30
$local=[IO.File]::ReadAllText($reportPath)
if ($remote.StatusCode -ne 200 -or $remote.Content.Replace("`r`n","`n") -ne $local.Replace("`r`n","`n")) {throw 'The public report does not match the current reviewed issue.'}
$summary=[IO.File]::ReadAllText($reportPath+'.summary.txt').Trim()
if ($summary.Length -lt 10 -or $summary.Length -gt 1200) {throw 'Expected a substantive short delivery summary.'}
$vercel=Get-Content -LiteralPath ($reportPath+'.vercel-published.json') -Raw | ConvertFrom-Json
if ($vercel.sha256 -ne $hash -or $vercel.state -ne 'READY' -or $vercel.reportUrl -notmatch '^https://[a-z0-9.-]+\.vercel\.app/reports/weekly-') {throw 'Vercel publication receipt is invalid.'}
$mirror=Invoke-WebRequest -Uri ($vercel.reportUrl+'?verified='+$hash.Substring(0,12)) -UseBasicParsing -TimeoutSec 30
if ($mirror.StatusCode -ne 200 -or $mirror.Content.Replace("`r`n","`n") -ne $local.Replace("`r`n","`n")) {throw 'Vercel report content has not been verified.'}
$summary=$summary+"`nVercel에서도 보기: "+$vercel.reportUrl
& (Join-Path $PSScriptRoot 'send-report.ps1') -HtmlPath $reportPath -Summary $summary -ReportUrl $expectedUrl -CheckOnly:$CheckOnly
if ($CheckOnly) {Write-Output 'Ready: reviewed HTML, live publication, destination bot and delivery summary verified. No message sent.'}
