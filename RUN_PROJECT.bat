@echo off
title FIFA World Cup 2026 - Distributed Ticketing Platform
cls
echo =========================================================================
echo   FIFA WORLD CUP 2026 -- DISTRIBUTED DATABASE SYSTEM LAUNCHER
echo =========================================================================
echo.
echo [1/3] Checking and freeing ports 5000 and 5173...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5000 ^| findstr LISTENING') do (
    taskkill /F /PID %%a >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5173 ^| findstr LISTENING') do (
    taskkill /F /PID %%a >nul 2>&1
)

echo [2/3] Opening browser window...
start "" http://localhost:5000

echo [3/3] Starting Backend & Frontend together in this single terminal...
echo =========================================================================
echo   Backend API:   http://localhost:5000/api
echo   Full Web App:  http://localhost:5000 (and http://localhost:5173)
echo =========================================================================
echo.

npm run dev
