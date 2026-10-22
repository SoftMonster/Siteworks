# Site Works: registers (or with -Uninstall removes) the file helper for your Windows user.
# Run it through "Install file helper.cmd" / "Uninstall file helper.cmd" in the SiteWorks folder.
# Re-run it if you move the SiteWorks folder.
param([switch]$Uninstall)
$ErrorActionPreference = 'Stop'
$Root = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$Name = 'com.siteworks.helper'
# Brave, Chrome, Chromium and Edge each look in their own place (Brave also reads Chrome's).
$Keys = @(
  'HKCU:\Software\BraveSoftware\Brave-Browser\NativeMessagingHosts',
  'HKCU:\Software\Google\Chrome\NativeMessagingHosts',
  'HKCU:\Software\Chromium\NativeMessagingHosts',
  'HKCU:\Software\Microsoft\Edge\NativeMessagingHosts'
)

if ($Uninstall) {
  foreach ($k in $Keys) { if (Test-Path "$k\$Name") { Remove-Item "$k\$Name" -Force } }
  $mf = Join-Path $PSScriptRoot "$Name.json"; if (Test-Path $mf) { Remove-Item $mf -Force }
  Write-Host 'Site Works file helper removed.'
  return
}

# The extension's ID comes from the "key" in manifest.json, so it is the same on every computer.
$manifest = Get-Content -Raw -LiteralPath (Join-Path $Root 'manifest.json') | ConvertFrom-Json
if (-not $manifest.key) { throw 'manifest.json has no "key", so the extension ID is not fixed.' }
$der = [Convert]::FromBase64String($manifest.key)
$sha = [Security.Cryptography.SHA256]::Create().ComputeHash($der)
$id = -join ($sha[0..15] | ForEach-Object { '{0:x2}' -f $_ } | ForEach-Object { $_.ToCharArray() } | ForEach-Object { [char](97 + [Convert]::ToInt32([string]$_, 16)) })

$hostManifest = [ordered]@{
  name            = $Name
  description     = 'Site Works file helper: writes scripts into the SiteWorks sites folder and rebuilds its index.'
  path            = (Join-Path $PSScriptRoot 'siteworks-host.cmd')
  type            = 'stdio'
  allowed_origins = @("chrome-extension://$id/")
}
$mfPath = Join-Path $PSScriptRoot "$Name.json"
[IO.File]::WriteAllText($mfPath, (ConvertTo-Json -InputObject $hostManifest -Depth 4), (New-Object Text.UTF8Encoding $false))

foreach ($k in $Keys) { New-Item -Path "$k\$Name" -Value $mfPath -Force | Out-Null }

Write-Host 'Site Works file helper installed.'
Write-Host ("  Extension ID : $id")
Write-Host ("  Sites folder : " + (Join-Path $Root 'sites'))
Write-Host ''
Write-Host 'Reload the Site Works Manage page: "File helper" should now say Connected.'
Write-Host 'If you move the SiteWorks folder, run this again.'
