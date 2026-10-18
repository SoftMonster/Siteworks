@echo off
rem Site Works: rebuilds sites\index.json (the list of scripts the extension can run).
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0build-index.ps1"
echo.
echo Reload the page to use them (no need to reload the extension).
pause
