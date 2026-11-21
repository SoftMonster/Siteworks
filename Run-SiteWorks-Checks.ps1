[CmdletBinding()]
param(
    [string]$RepositoryPath = (Get-Location).Path
)
$ErrorActionPreference = 'Continue'
$repo = (Resolve-Path -LiteralPath $RepositoryPath -ErrorAction Stop).Path
$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$log = Join-Path $repo "SiteWorks-checks-$stamp.txt"
Start-Transcript -Path $log -Force | Out-Null

Write-Host "=== SITE WORKS LOCAL CHECKS ===" -ForegroundColor Cyan
Write-Host "Repository: $repo"
Write-Host "Started: $(Get-Date -Format o)"

Push-Location $repo
try {
    Write-Host "`n--- Environment ---" -ForegroundColor Cyan
    $PSVersionTable | Format-List
    node --version
    npm --version
    git status --short --branch

    if (-not (Test-Path -LiteralPath 'package.json')) {
        throw 'package.json not found. Run this script from the Siteworks repository folder.'
    }

    $results = @()
    foreach ($task in @(
        @{ Name = 'npm test'; Args = @('test') },
        @{ Name = 'npm run check'; Args = @('run','check') },
        @{ Name = 'npm run manifest -- --check'; Args = @('run','manifest','--','--check') }
    )) {
        Write-Host "`n--- $($task.Name) ---" -ForegroundColor Cyan
        $npmArgs = $task.Args
        & npm @npmArgs
        $code = $LASTEXITCODE
        $results += [pscustomobject]@{ Check = $task.Name; ExitCode = $code; Result = if ($code -eq 0) {'PASS'} else {'FAIL'} }
    }

    Write-Host "`n--- Summary ---" -ForegroundColor Cyan
    $results | Format-Table -AutoSize
    Write-Host "Evidence log: $log" -ForegroundColor Green
    if (@($results | Where-Object { $_.ExitCode -ne 0 }).Count -gt 0) {
        Write-Host 'One or more checks failed. Keep the log; do not modify the manifest or source yet.' -ForegroundColor Yellow
    }
}
finally {
    Pop-Location
    Stop-Transcript | Out-Null
}
Write-Host "`nFinished. Send the generated SiteWorks-checks-*.txt file back for analysis." -ForegroundColor Green
