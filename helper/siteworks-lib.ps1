# Site Works: shared PowerShell functions, used by build-index.ps1 and the file helper.
# Nothing here writes outside the SiteWorks folder.

$script:SWSep = [IO.Path]::DirectorySeparatorChar

function Get-SWSitesDir([string]$Root) { [IO.Path]::GetFullPath((Join-Path $Root 'sites')).TrimEnd('\', '/') }

function ConvertTo-SWQuoted([string]$s) { '"' + $s.Replace('\', '\\').Replace('"', '\"') + '"' }

# Lists every .js file under sites\ (and each site's hosts.txt) into sites\index.json.
# Returns the list of script paths (forward slashes, relative to sites\).
function Build-SWIndex([string]$Root) {
  $sites = Get-SWSitesDir $Root
  $files = @(Get-ChildItem -LiteralPath $sites -Recurse -File -Filter '*.js' |
             ForEach-Object { $_.FullName.Substring($sites.Length + 1).Replace('\', '/') } |
             Sort-Object)
  $entries = @()
  foreach ($d in @(Get-ChildItem -LiteralPath $sites -Directory | Sort-Object Name)) {
    $hosts = @()
    $ht = Join-Path $d.FullName 'hosts.txt'
    if (Test-Path -LiteralPath $ht) {
      $hosts = @(Get-Content -LiteralPath $ht | ForEach-Object { $_.Trim() } | Where-Object { $_ -and -not $_.StartsWith('#') })
    }
    $entries += (ConvertTo-SWQuoted $d.Name) + ':{"hosts":[' + (($hosts | ForEach-Object { ConvertTo-SWQuoted $_ }) -join ',') + ']}'
  }
  $json = '{"built":"' + (Get-Date).ToUniversalTime().ToString('o') + '","sites":{' + ($entries -join ',') +
          '},"files":[' + (($files | ForEach-Object { ConvertTo-SWQuoted $_ }) -join ',') + ']}'
  [IO.File]::WriteAllText((Join-Path $sites 'index.json'), $json, (New-Object Text.UTF8Encoding $false))
  return ,$files
}

# Turns "Site/folder/name.js" into a full path inside sites\, or throws.
# Only .js files (and <Site>/hosts.txt when -Hosts) are allowed; no "..", no drive letters.
function Resolve-SWPath([string]$Root, [string]$Rel, [switch]$Hosts) {
  if (-not $Rel) { throw 'No file name given.' }
  $Rel = $Rel.Replace('\', '/')
  if ($Rel -match '[:*?"<>|\x00-\x1f]') { throw "A file or folder name can't contain : * ? "" < > |" }
  $segs = @($Rel.Split('/'))
  $reserved = '^(con|prn|aux|nul|com\d|lpt\d)(\..*)?$'
  foreach ($s in $segs) {
    if (-not $s -or $s -eq '.' -or $s -eq '..') { throw "Empty folder name, '.' or '..' in $Rel" }
    if ($s -ne $s.Trim() -or $s.EndsWith('.')) { throw "Folder or file names can't start or end with a space, or end with a dot: '$s'" }
    if ($s -match $reserved) { throw "'$s' is a name Windows reserves." }
  }
  $leaf = $segs[-1]
  if ($Hosts) { if ($segs.Count -ne 2 -or $leaf -ne 'hosts.txt') { throw 'hosts.txt must be sites\<Site>\hosts.txt' } }
  elseif ($leaf -notmatch '\.js$') { throw 'Scripts must end in .js' }
  $sites = Get-SWSitesDir $Root
  $full = [IO.Path]::GetFullPath((Join-Path $sites ($segs -join $script:SWSep)))
  if (-not $full.StartsWith($sites + $script:SWSep, [StringComparison]::OrdinalIgnoreCase)) { throw 'That path is outside the sites folder.' }
  return $full
}

function Get-SWHash([string]$Path) { (Get-FileHash -LiteralPath $Path -Algorithm SHA256).Hash.ToLowerInvariant() }

function Write-SWText([string]$Path, [string]$Text) {
  $dir = Split-Path -Parent $Path
  if (-not (Test-Path -LiteralPath $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
  [IO.File]::WriteAllText($Path, $Text, (New-Object Text.UTF8Encoding $false))
}

# Opens a file in a text editor - VS Code if it's installed, else Notepad.
# Never the default .js handler: on Windows that is Windows Script Host, which would RUN it.
function Open-SWEditor([string]$Path) {
  $code = Get-Command code -ErrorAction SilentlyContinue
  if ($code) { Start-Process -FilePath $code.Source -ArgumentList ('"' + $Path + '"') -WindowStyle Hidden | Out-Null }
  elseif ($IsWindows -ne $false) { Start-Process -FilePath 'notepad.exe' -ArgumentList ('"' + $Path + '"') | Out-Null }
  else { throw 'No editor found.' }
}
