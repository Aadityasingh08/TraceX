@echo off
title TRACE-X Intelligence Workspace Launcher
echo ========================================================
echo   Starting TRACE-X Workspace Services...
echo ========================================================

REM 1. Start PostgreSQL on port 5433
echo [1/3] Starting Database...
"C:\Program Files\PostgreSQL\18\bin\pg_ctl.exe" -D "C:\Users\HP\.tracex\pgdata" -o "-p 5433" start >nul 2>&1

REM 2. Start Backend in new window
echo [2/3] Starting Backend API (port 5000)...
start "TRACE-X Backend" cmd /k "cd /d %~dp0Backend && npm run dev"

REM 3. Start Frontend in new window
echo [3/3] Starting Frontend UI (port 5173)...
start "TRACE-X Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

timeout /t 3 >nul

REM 4. Open Browser
echo Opening TRACE-X in your browser...
start http://localhost:5173/

echo ========================================================
echo   TRACE-X is now running!
echo   URL: http://localhost:5173/
echo   Login: analyst@tracex.local / analyst123
echo ========================================================
pause
