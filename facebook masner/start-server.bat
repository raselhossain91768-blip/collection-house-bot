@echo off
title Collection House AI Messenger Bot
echo ======================================================
echo    Collection House AI Messenger Server Starting...
echo ======================================================
echo.

if exist "%APPDATA%\Antigravity\bin\agy-node.cmd" (
    "%APPDATA%\Antigravity\bin\agy-node.cmd" server.js
) else (
    node server.js
)

pause
