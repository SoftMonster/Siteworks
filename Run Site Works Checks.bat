@echo off
setlocal
rem Site Works diagnostic launcher.
rem These checks do not require Administrator rights; do not elevate unnecessarily.
set "SCRIPT=%~dp0Run-SiteWorks-Checks.ps1"
if not exist "%SCRIPT%" (
  echo ERROR: Run-SiteWorks-Checks.ps1 was not found beside this batch file.
  echo Keep both files in the Siteworks repository root.
  pause
  exit /b 1
)
start "Site Works checks" powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -NoExit -File "%SCRIPT%" -RepositoryPath "%~dp0"
endlocal
