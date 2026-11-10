@echo off
title QuizPulse - Online Quiz System
echo ===================================================
echo   Starting QuizPulse Backend & Frontend Services
echo ===================================================
echo.
echo [1/2] Launching Backend Server on http://localhost:5000 ...
start "QuizPulse Backend (Port 5000)" cmd /k "cd /d %~dp0server && node src/server.js"

echo [2/2] Launching Frontend Client on http://localhost:3000 ...
start "QuizPulse Frontend (Port 3000)" cmd /k "cd /d %~dp0client && npx next dev -p 3000"

echo.
echo All services launched!
echo Open your browser at: http://localhost:3000
echo ===================================================
timeout /t 5
