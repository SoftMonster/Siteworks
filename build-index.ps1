# Site Works: lists every .js file under sites\ (and each site's hosts.txt) into sites\index.json.
# Double-click "Rebuild index.cmd" (it runs this) after adding, renaming or removing
# scripts or editing a hosts.txt - or use Rebuild index in Site Works once the file helper is installed.
. (Join-Path $PSScriptRoot 'helper\siteworks-lib.ps1')
$files = Build-SWIndex $PSScriptRoot
Write-Host ('Site Works: indexed ' + $files.Count + ' script(s):')
$files | ForEach-Object { Write-Host ('  sites\' + $_.Replace('/', '\')) }
