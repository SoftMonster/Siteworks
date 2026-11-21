[CmdletBinding()]
param()

$ErrorActionPreference = 'Continue'
$repo = [System.IO.Path]::GetFullPath($PSScriptRoot)
if (-not (Test-Path -LiteralPath (Join-Path $repo 'package.json') -PathType Leaf)) {
    Write-Host "ERROR: package.json was not found in $repo" -ForegroundColor Red
    exit 2
}

$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$logDir = Join-Path $env:TEMP 'SiteWorks-Diagnostics'
New-Item -ItemType Directory -Path $logDir -Force | Out-Null
$log = Join-Path $logDir "SiteWorks-checks-$stamp.txt"
try { Start-Transcript -Path $log -Force | Out-Null }
catch { Write-Host "Cannot create log: $($_.Exception.Message)" -ForegroundColor Red; exit 3 }

function Find-Executable {
    param([string]$Name, [string[]]$Candidates)
    $cmd = Get-Command $Name -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($cmd) { return $cmd.Source }
    foreach ($candidate in $Candidates) {
        if ($candidate -and (Test-Path -LiteralPath $candidate -PathType Leaf)) { return $candidate }
    }
    return $null
}

function Add-ToolDirectoryToPath {
    param([string]$Executable)
    if ($Executable) {
        $dir = Split-Path -Parent $Executable
        if ($env:PATH -notlike "*$dir*") { $env:PATH = "$dir;$env:PATH" }
    }
}

try {
    Write-Host '=== SITE WORKS LOCAL CHECKS ===' -ForegroundColor Cyan
    Write-Host "Repository: $repo"
    Write-Host "Started: $(Get-Date -Format o)"
    Write-Host "PowerShell: $($PSVersionTable.PSVersion)"
    Write-Host "Computer: $env:COMPUTERNAME"
    Write-Host "User: $env:USERNAME"
    Write-Host "Log: $log"

    # Discover common install locations, including Git bundled with GitHub Desktop.
    $nodeCandidates = @(
        "$env:ProgramFiles\nodejs\node.exe",
        "$env:LOCALAPPDATA\Programs\nodejs\node.exe",
        "$env:APPDATA\npm\node.exe"
    )
    $npmCandidates = @(
        "$env:ProgramFiles\nodejs\npm.cmd",
        "$env:LOCALAPPDATA\Programs\nodejs\npm.cmd"
    )
    $gitCandidates = @(
        "$env:ProgramFiles\Git\cmd\git.exe",
        "$env:ProgramFiles\Git\bin\git.exe",
        "$env:LOCALAPPDATA\Programs\Git\cmd\git.exe",
        "$env:LOCALAPPDATA\GitHubDesktop\app-*\resources\app\git\cmd\git.exe"
    )
    $gitExpanded = @()
    foreach ($pattern in $gitCandidates) {
        $matches = @(Get-ChildItem -Path $pattern -ErrorAction SilentlyContinue | Select-Object -ExpandProperty FullName)
        $gitExpanded += $matches
    }

    $nodeExe = Find-Executable -Name 'node.exe' -Candidates $nodeCandidates
    $npmCmd = Find-Executable -Name 'npm.cmd' -Candidates $npmCandidates
    $gitExe = Find-Executable -Name 'git.exe' -Candidates $gitExpanded
    Add-ToolDirectoryToPath $nodeExe
    Add-ToolDirectoryToPath $npmCmd
    Add-ToolDirectoryToPath $gitExe

    Write-Host "`n--- Tool discovery ---" -ForegroundColor Cyan
    if ($nodeExe) { Write-Host "Node.js: $nodeExe" -ForegroundColor Green } else { Write-Host 'Node.js: NOT FOUND' -ForegroundColor Yellow }
    if ($npmCmd) { Write-Host "npm: $npmCmd" -ForegroundColor Green } else { Write-Host 'npm: NOT FOUND' -ForegroundColor Yellow }
    if ($gitExe) { Write-Host "Git: $gitExe" -ForegroundColor Green } else { Write-Host 'Git: NOT FOUND' -ForegroundColor Yellow }

    $missing = @()
    if (-not $nodeExe -or -not $npmCmd) { $missing += 'Node.js LTS (includes npm)' }
    if (-not $gitExe) { $missing += 'Git for Windows' }

    if ($missing.Count -gt 0) {
        Write-Host "`nRequired developer tools are missing or not discoverable." -ForegroundColor Yellow
        Write-Host "Missing: $($missing -join ', ')"
        $winget = Get-Command winget.exe -ErrorAction SilentlyContinue
        if ($winget) {
            Write-Host "`nWindows Package Manager is available." -ForegroundColor Cyan
            $answer = Read-Host "Install missing tools using winget now? This may require installer approval (Y/N)"
            if ($answer -match '^(Y|YES)$') {
                if (-not $nodeExe -or -not $npmCmd) {
                    Write-Host "`nInstalling Node.js LTS..." -ForegroundColor Cyan
                    & $winget.Source install --id OpenJS.NodeJS.LTS --exact --accept-package-agreements --accept-source-agreements
                }
                if (-not $gitExe) {
                    Write-Host "`nInstalling Git for Windows..." -ForegroundColor Cyan
                    & $winget.Source install --id Git.Git --exact --accept-package-agreements --accept-source-agreements
                }
                # Refresh PATH from machine and user environment after installers finish.
                $machinePath = [Environment]::GetEnvironmentVariable('Path', 'Machine')
                $userPath = [Environment]::GetEnvironmentVariable('Path', 'User')
                $env:PATH = "$machinePath;$userPath"
                $nodeExe = Find-Executable -Name 'node.exe' -Candidates $nodeCandidates
                $npmCmd = Find-Executable -Name 'npm.cmd' -Candidates $npmCandidates
                $gitExe = Find-Executable -Name 'git.exe' -Candidates $gitExpanded
                Add-ToolDirectoryToPath $nodeExe
                Add-ToolDirectoryToPath $npmCmd
                Add-ToolDirectoryToPath $gitExe
            }
        } else {
            Write-Host "winget is unavailable. Install Node.js LTS from https://nodejs.org/ and Git for Windows from https://git-scm.com/download/win, then rerun this same launcher." -ForegroundColor Yellow
        }
    }

    $results = @()
    if ($nodeExe -and $npmCmd) {
        Write-Host "`n--- Node.js / npm versions ---" -ForegroundColor Cyan
        & $nodeExe --version
        & $npmCmd --version

        foreach ($task in @(
            @{ Name = 'npm test'; Args = @('test') },
            @{ Name = 'npm run check'; Args = @('run','check') },
            @{ Name = 'npm run manifest -- --check'; Args = @('run','manifest','--','--check') }
        )) {
            Write-Host "`n--- $($task.Name) ---" -ForegroundColor Cyan
            $npmArgs = $task.Args
            & $npmCmd @npmArgs
            $code = $LASTEXITCODE
            $results += [pscustomobject]@{ Check = $task.Name; ExitCode = $code; Result = if ($code -eq 0) {'PASS'} else {'FAIL'} }
        }
    } else {
        $results += [pscustomobject]@{ Check = 'Node.js/npm availability'; ExitCode = 127; Result = 'BLOCKED - prerequisites missing' }
    }

    if ($gitExe) {
        Write-Host "`n--- Git status ---" -ForegroundColor Cyan
        & $gitExe -C $repo status --short --branch
        Write-Host "`n--- Git recent commits ---" -ForegroundColor Cyan
        & $gitExe -C $repo log -5 --oneline --decorate
    } else {
        $results += [pscustomobject]@{ Check = 'Git availability'; ExitCode = 127; Result = 'BLOCKED - Git not found' }
    }

    Write-Host "`n--- Summary ---" -ForegroundColor Cyan
    $results | Format-Table -AutoSize
    if (@($results | Where-Object { $_.ExitCode -ne 0 }).Count -gt 0) {
        Write-Host "`nOne or more checks failed or were blocked. Return this log for review." -ForegroundColor Yellow
    } else {
        Write-Host "`nAll configured checks passed." -ForegroundColor Green
    }
    Write-Host "`nEvidence log: $log" -ForegroundColor Green
}
catch {
    Write-Host "UNEXPECTED DIAGNOSTIC ERROR: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host $_.ScriptStackTrace
}
finally {
    Stop-Transcript | Out-Null
}
Write-Host "`nFinished. Return the report from $logDir." -ForegroundColor Green
