$env:Path=[Environment]::GetEnvironmentVariable('Path','Machine')+';'+[Environment]::GetEnvironmentVariable('Path','User')
foreach ($key in @('GH_TOKEN','GH_HOST','GIT_AUTHOR_NAME','GIT_AUTHOR_EMAIL','GIT_COMMITTER_NAME','GIT_COMMITTER_EMAIL')) {
  $value=[Environment]::GetEnvironmentVariable($key,'User')
  if ([string]::IsNullOrWhiteSpace($value)) {$value=[Environment]::GetEnvironmentVariable($key,'Machine')}
  if (![string]::IsNullOrWhiteSpace($value)) {[Environment]::SetEnvironmentVariable($key,$value,'Process')}
}
