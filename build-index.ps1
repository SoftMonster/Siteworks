# Site Works: lists every .js file under sites\ (and each site's hosts.txt) into sites\index.json.
# Double-click "Rebuild index.cmd" (it runs this) after adding, renaming or removing
# scripts or editing a hosts.txt.
function Q([string]$s) { '"' + $s.Replace('\', '\\').Replace('"', '\"') + '"' }
$root = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot 'sites')).Path.TrimEnd('\')
$files = @(Get-ChildItem -LiteralPath $root -Recurse -File -Filter '*.js' |
           ForEach-Object { $_.FullName.Substring($root.Length + 1).Replace('\', '/') } |
           Sort-Object)
$sites = @()
foreach ($d in @(Get-ChildItem -LiteralPath $root -Directory | Sort-Object Name)) {
  $hosts = @()
  $ht = Join-Path $d.FullName 'hosts.txt'
  if (Test-Path -LiteralPath $ht) {
    $hosts = @(Get-Content -LiteralPath $ht | ForEach-Object { $_.Trim() } | Where-Object { $_ -and -not $_.StartsWith('#') })
  }
  $sites += (Q $d.Name) + ':{"hosts":[' + (($hosts | ForEach-Object { Q $_ }) -join ',') + ']}'
}
$json = '{"built":"' + (Get-Date).ToUniversalTime().ToString('o') + '","sites":{' + ($sites -join ',') +
        '},"files":[' + (($files | ForEach-Object { Q $_ }) -join ',') + ']}'
[IO.File]::WriteAllText((Join-Path $root 'index.json'), $json, (New-Object Text.UTF8Encoding $false))
Write-Host ('Site Works: indexed ' + $files.Count + ' script(s):')
$files | ForEach-Object { Write-Host ('  sites\' + $_.Replace('/', '\')) }
