@echo off
echo ========================================
echo   AI-NEXUS Server Startup Script
echo ========================================
echo.

echo [1/2] Starting Backend Server...
start "AI-NEXUS Backend" cmd /k "cd /d %~dp0backend && npm run dev"
timeout /t 3 /nobreak >nul

echo [2/2] Starting Frontend Server...
start "AI-NEXUS Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"
timeout /t 2 /nobreak >nul

echo.
echo ========================================
echo   Servers Starting!
echo ========================================
echo.
echo Backend:  http://localhost:5000
echo Frontend: http://localhost:3000 (or 3002)
echo.
echo Two windows will open - keep them running!
echo.
pause




