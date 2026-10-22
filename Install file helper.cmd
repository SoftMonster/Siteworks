@echo off
rem Site Works: lets the extension write scripts into sites\ and rebuild the index for you.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0helper\install-helper.ps1"
echo.
pause
