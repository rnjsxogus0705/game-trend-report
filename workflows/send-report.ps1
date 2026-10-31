param([Parameter(Mandatory=$true)][string]$HtmlPath,[Parameter(Mandatory=$true)][string]$Summary,[string]$ReportUrl,[switch]$CheckOnly,[ValidatePattern('^[a-z0-9-]{1,40}$')][string]$Edition)
$ErrorActionPreference='Stop'
$deliveryReceiptPath=$HtmlPath+$(if($Edition){'.'+$Edition}else{''})+'.sent.json'
if (!$CheckOnly -and (Test-Path -LiteralPath $deliveryReceiptPath)) { throw 'This report edition already has a delivery receipt; inspect it before sending again.' }
$credentialPath=Join-Path $PSScriptRoot 'private\bot-token.dpapi'
if (!(Test-Path -LiteralPath $credentialPath)) { throw 'Bot credential is not configured yet.' }
$secureToken=(Get-Content -LiteralPath $credentialPath -Raw).Trim() | ConvertTo-SecureString
$botToken=[System.Net.NetworkCredential]::new('', $secureToken).Password
Add-Type -AssemblyName System.Net.Http
$client=[System.Net.Http.HttpClient]::new()
$client.DefaultRequestHeaders.Authorization=[System.Net.Http.Headers.AuthenticationHeaderValue]::new('Bot',$botToken)
$client.Timeout=[TimeSpan]::FromSeconds(60)
try {
  $identityResponse=$client.GetAsync('https://discord.com/api/v10/users/@me').GetAwaiter().GetResult()
  if (!$identityResponse.IsSuccessStatusCode) { throw "Bot authentication failed: $([int]$identityResponse.StatusCode)" }
  $identity=$identityResponse.Content.ReadAsStringAsync().GetAwaiter().GetResult() | ConvertFrom-Json
  if ($identity.id -ne '1565897943184310342' -or !$identity.bot) { throw 'Unexpected bot identity.' }
  $channelResponse=$client.GetAsync('https://discord.com/api/v10/channels/1565894418156879942').GetAwaiter().GetResult()
  if (!$channelResponse.IsSuccessStatusCode) { throw "Channel access failed: $([int]$channelResponse.StatusCode)" }
  $channel=$channelResponse.Content.ReadAsStringAsync().GetAwaiter().GetResult() | ConvertFrom-Json
  if ($channel.guild_id -ne '1488793489800957966') { throw 'Unexpected destination server.' }
  if ($CheckOnly) { Write-Output "Verified bot: $($identity.username); channel: $($channel.name)"; return }
  $reportFile=Get-Item -LiteralPath $HtmlPath
  if ($reportFile.Extension -ne '.html' -or $reportFile.Length -gt 8000000) { throw 'Expected an HTML file below 8 MB.' }
  if ($ReportUrl) {
    if ($ReportUrl -notmatch '^https://rnjsxogus0705\.github\.io/game-trend-report/(reports/[a-z0-9-]+\.html)?$') {throw 'Unexpected report URL.'}
    $Summary=$Summary+"`n"+$ReportUrl
  }
  if ($Summary.Length -gt 1900) { throw 'Summary and link must be below 1900 characters.' }
  $multipart=[System.Net.Http.MultipartFormDataContent]::new()
  $payload=@{content=$Summary;allowed_mentions=@{parse=@()};attachments=@(@{id=0;filename=$reportFile.Name})} | ConvertTo-Json -Depth 5 -Compress
  $multipart.Add([System.Net.Http.StringContent]::new($payload,[Text.Encoding]::UTF8,'application/json'),'payload_json')
  $fileContent=[System.Net.Http.ByteArrayContent]::new([IO.File]::ReadAllBytes($reportFile.FullName))
  $fileContent.Headers.ContentType=[System.Net.Http.Headers.MediaTypeHeaderValue]::new('text/html')
  $multipart.Add($fileContent,'files[0]',$reportFile.Name)
  if ($ReportUrl) {
    $linkPayload=@{content=$Summary;allowed_mentions=@{parse=@()}} | ConvertTo-Json -Depth 4 -Compress
    $requestContent=[System.Net.Http.StringContent]::new($linkPayload,[Text.Encoding]::UTF8,'application/json')
  } else { $requestContent=$multipart }
  $response=$client.PostAsync('https://discord.com/api/v10/channels/1565894418156879942/messages',$requestContent).GetAwaiter().GetResult()
  if (!$response.IsSuccessStatusCode) { throw "Delivery failed: $([int]$response.StatusCode). Check channel permissions or rate limits before retrying." }
  $message=$response.Content.ReadAsStringAsync().GetAwaiter().GetResult() | ConvertFrom-Json
  if ((!$ReportUrl -and $message.attachments.Count -ne 1) -or ($ReportUrl -and !$message.content.Contains($ReportUrl)) -or $message.author.id -ne '1565897943184310342' -or $message.channel_id -ne '1565894418156879942') { throw 'Discord response did not confirm the expected bot, destination and report.' }
  $receipt=@{message_id=$message.id;channel_id=$message.channel_id;author_id=$message.author.id;filename=$reportFile.Name;report_url=$ReportUrl;sent_at=$message.timestamp;report_sha256=(Get-FileHash -LiteralPath $reportFile.FullName -Algorithm SHA256).Hash}
  $receipt | ConvertTo-Json | Set-Content -LiteralPath $deliveryReceiptPath -Encoding utf8
  Write-Output "Delivered: https://discord.com/channels/1488793489800957966/1565894418156879942/$($message.id)"
} finally { $client.Dispose(); $botToken=$null }
