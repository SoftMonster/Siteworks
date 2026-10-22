@echo off
rem Site Works: removes the file helper registration.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0helper\install-helper.ps1" -Uninstall
echo.
pause
