@echo off
echo ========================================
echo   RCC Voting System - Local Development
echo ========================================
echo.

echo [1/2] Starting Backend Server...
start cmd /k "cd backend && venv\Scripts\activate && echo Backend Starting... && python manage.py runserver"

timeout /t 3 /nobreak >nul

echo [2/2] Starting Frontend Server...
start cmd /k "cd frontend && echo Frontend Starting... && npm run dev"

echo.
echo ========================================
echo   Servers Starting!
echo ========================================
echo.
echo Backend:  http://localhost:8000
echo Frontend: http://localhost:3000
echo Admin:    http://localhost:3000/admin/login
echo.
echo Press any key to close this window...
pause >nul
