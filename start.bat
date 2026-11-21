@echo off
echo ============================================
echo   CredShield — Starting All Services
echo ============================================
echo.

start "CredShield ML Service (port 5000)" cmd /k "cd /d %~dp0credshield-ml && python predict_api.py"
timeout /t 3 /nobreak >nul

start "CredShield Backend (port 3000)" cmd /k "cd /d %~dp0credshield-backend && npm start"
timeout /t 2 /nobreak >nul

start "CredShield Frontend (port 5173)" cmd /k "cd /d %~dp0credshield-frontend && npm run dev"

echo.
echo All services launched in separate windows.
echo   ML Service  → http://localhost:5000
echo   Backend     → http://localhost:3000
echo   Frontend    → http://localhost:5173
echo.
pause
