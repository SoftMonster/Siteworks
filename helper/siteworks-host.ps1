# Site Works file helper - a native messaging host.
#
# The browser starts this (through siteworks-host.cmd) when a Site Works page asks for
# a file operation, sends one JSON message, reads one JSON reply, and it exits.
# Only the Site Works extension can start it: its ID is the only one listed in
# com.siteworks.helper.json (allowed_origins), written by "Install file helper.cmd".
#
# It can only: list/rebuild the index, write or move-to-trash .js files and write
# hosts.txt inside the sites folder, and open the sites folder or a script in a
# text editor. It never runs scripts and never touches files outside SiteWorks.

$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
$Root = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
. (Join-Path $PSScriptRoot 'siteworks-lib.ps1')
$Version = '1.3.0'

$stdin = [Console]::OpenStandardInput()
$stdout = [Console]::OpenStandardOutput()

function Read-Exactly([int]$n) {
  $buf = New-Object byte[] $n; $got = 0
  while ($got -lt $n) { $r = $stdin.Read($buf, $got, $n - $got); if ($r -le 0) { return $null }; $got += $r }
  return ,$buf
}
function Read-Message {
  $len = Read-Exactly 4; if ($null -eq $len) { return $null }
  $n = [BitConverter]::ToInt32($len, 0); if ($n -le 0 -or $n -gt 4MB) { return $null }
  $body = Read-Exactly $n; if ($null -eq $body) { return $null }
  return ([Text.Encoding]::UTF8.GetString($body) | ConvertFrom-Json)
}
function Send-Message($obj) {
  $json = ConvertTo-Json -InputObject $obj -Depth 6 -Compress
  $bytes = [Text.Encoding]::UTF8.GetBytes($json)
  $stdout.Write([BitConverter]::GetBytes([int]$bytes.Length), 0, 4)
  $stdout.Write($bytes, 0, $bytes.Length)
  $stdout.Flush()
}

function Invoke-Command-SW($m) {
  $sites = Get-SWSitesDir $Root
  switch ([string]$m.cmd) {
    'ping'    { return @{ ok = $true; version = $Version; root = $Root; ps = $PSVersionTable.PSVersion.ToString() } }
    'rebuild' { $f = Build-SWIndex $Root; return @{ ok = $true; files = @($f) } }
    'write' {
      $full = Resolve-SWPath $Root ([string]$m.path)
      $exists = Test-Path -LiteralPath $full
      if ($exists -and -not $m.overwrite) { return @{ error = 'exists'; message = "sites\$($m.path.Replace('/', '\')) already exists." } }
      if ($exists -and $m.expectHash -and (Get-SWHash $full) -ne [string]$m.expectHash) {
        return @{ error = 'changed'; message = 'The file was changed on disk since you opened it (in another editor?). Reload it first, or save again to overwrite.' }
      }
      Write-SWText $full ([string]$m.text)
      $f = Build-SWIndex $Root
      return @{ ok = $true; created = -not $exists; hash = (Get-SWHash $full); files = @($f) }
    }
    'hosts' {
      $site = [string]$m.site
      $full = Resolve-SWPath $Root ($site + '/hosts.txt') -Hosts
      $lines = @("# $site`: the scripts in this folder run on these sites (one per line;", '# subdomains are included).') + @($m.hosts | ForEach-Object { ([string]$_).Trim() } | Where-Object { $_ })
      Write-SWText $full (($lines -join "`r`n") + "`r`n")
      $f = Build-SWIndex $Root
      return @{ ok = $true; files = @($f) }
    }
    'trash' {
      $full = Resolve-SWPath $Root ([string]$m.path)
      if (-not (Test-Path -LiteralPath $full)) { return @{ error = 'missing'; message = 'That file is not there any more.' } }
      $dest = Join-Path (Join-Path $Root 'trash') ((Get-Date).ToString('yyyy-MM-dd_HH-mm-ss') + $script:SWSep + ([string]$m.path).Replace('/', $script:SWSep))
      New-Item -ItemType Directory -Path (Split-Path -Parent $dest) -Force | Out-Null
      Move-Item -LiteralPath $full -Destination $dest
      # tidy now-empty folders up to the site folder
      $dir = Split-Path -Parent $full
      while ($dir.Length -gt $sites.Length -and -not (Get-ChildItem -LiteralPath $dir -Force)) { Remove-Item -LiteralPath $dir; $dir = Split-Path -Parent $dir }
      $f = Build-SWIndex $Root
      return @{ ok = $true; trashed = $dest; files = @($f) }
    }
    'edit' {
      $full = Resolve-SWPath $Root ([string]$m.path)
      if (-not (Test-Path -LiteralPath $full)) { return @{ error = 'missing'; message = 'That file is not there any more.' } }
      Open-SWEditor $full; return @{ ok = $true }
    }
    'reveal' {
      $target = if ($m.path) { Resolve-SWPath $Root ([string]$m.path) } else { $sites }
      if ($IsWindows -eq $false) { return @{ error = 'unsupported'; message = 'Opening Explorer only works on Windows.' } }
      if ($m.path) { Start-Process -FilePath 'explorer.exe' -ArgumentList ('/select,"' + $target + '"') | Out-Null }
      else { Start-Process -FilePath 'explorer.exe' -ArgumentList ('"' + $target + '"') | Out-Null }
      return @{ ok = $true }
    }
    default { return @{ error = 'unknown'; message = "Unknown command: $($m.cmd)" } }
  }
}

while ($true) {
  $m = $null
  try { $m = Read-Message } catch { Send-Message @{ error = 'bad'; message = "Couldn't read the request: $($_.Exception.Message)" }; break }
  if ($null -eq $m) { break }
  try { $r = Invoke-Command-SW $m } catch { $r = @{ error = 'failed'; message = $_.Exception.Message } }
  Send-Message $r
}
