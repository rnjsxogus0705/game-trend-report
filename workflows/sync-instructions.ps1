param()
$ErrorActionPreference='Stop'
. (Join-Path $PSScriptRoot 'github-env.ps1')
$repo=Join-Path $PSScriptRoot 'site'
git -C $repo fetch origin main --quiet
if ($LASTEXITCODE -ne 0) {throw 'Cannot fetch instruction updates.'}
git -C $repo merge --ff-only origin/main --quiet
if ($LASTEXITCODE -ne 0) {throw 'Local branch diverged or has conflicting changes; nothing will be overwritten.'}
$manifest=Get-Content (Join-Path $repo 'instructions/sync-manifest.json') -Raw|ConvertFrom-Json
$stateFile=Join-Path $PSScriptRoot 'private/instruction-sync.json'
$state=@{}
if (Test-Path $stateFile) { $old=Get-Content $stateFile -Raw|ConvertFrom-Json; foreach($p in $old.hashes.PSObject.Properties){$state[$p.Name]=$p.Value} }
$allowed=@{'instructions/REPORT-GUIDE.md'='REPORT-GUIDE.md';'instructions/REPORT-OUTPUT-CONTRACT.md'='REPORT-OUTPUT-CONTRACT.md';'instructions/READING-AND-SCHEDULER.md'='READING-AND-SCHEDULER.md';'instructions/KOREAN-EDITORIAL-POLICY.md'='KOREAN-EDITORIAL-POLICY.md';'instructions/CONTENT-AUDIT-2026-10-31.md'='CONTENT-AUDIT-2026-10-31.md';'instructions/DESIGN.md'='redesign/DESIGN.md'}
foreach($n in @('build-site.mjs','validate-issue.mjs','validate-weekly-presentation.mjs','validate-language-review.mjs','publish-report.ps1','dispatch-report.ps1','send-report.ps1','deploy-vercel.mjs','vercel-api.mjs','github-env.ps1')){$allowed['workflows/'+$n]=$n}
foreach($n in @('toss.md','google-design-md/README.md','google-design-md/LICENSE','google-design-md/spec.md','google-design-md/spec-config.yaml','google-design-md/upstream-package.json')){$allowed['instructions/references/'+$n]='redesign/references/'+$n}
foreach($n in @('DESIGN-REFERENCE-GUIDE.md','DESIGN-ASSETS.json')){$allowed['instructions/'+$n]='redesign/references/'+$n}
$pending=@()
foreach($m in $manifest.files){
 if (!$allowed.ContainsKey([string]$m.repo) -or $allowed[[string]$m.repo] -ne $m.local){throw 'Manifest contains a non-allowlisted path.'}
 $source=Join-Path $repo $m.repo; $target=Join-Path $PSScriptRoot $m.local
 $remoteHash=(Get-FileHash $source -Algorithm SHA256).Hash
 $localHash=if(Test-Path $target){(Get-FileHash $target -Algorithm SHA256).Hash}else{''}
 if($localHash -and $localHash -ne $remoteHash -and (!$state.ContainsKey($m.local) -or $state[$m.local] -ne $localHash)){throw "Local edits detected: $($m.local). Commit them under instructions/ or workflows/ first; automatic overwrite stopped."}
 $pending+=@{source=$source;target=$target;hash=$remoteHash;key=$m.local;changed=($localHash -ne $remoteHash)}
}
$count=0
foreach($p in $pending){if($p.changed){Copy-Item -LiteralPath $p.source -Destination $p.target -Force;$count++};$state[$p.key]=$p.hash}
$revision=(git -C $repo rev-parse HEAD).Trim()
@{revision=$revision;checkedAt=[DateTime]::UtcNow.ToString('o');hashes=$state}|ConvertTo-Json -Depth 5|Set-Content -LiteralPath $stateFile -Encoding utf8
Write-Output "Instructions synchronized: $revision; updated files: $count"
