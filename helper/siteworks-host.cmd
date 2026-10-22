@echo off
rem Site Works file helper. The browser runs this; you don't need to.
powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File "%~dp0siteworks-host.ps1" %*
