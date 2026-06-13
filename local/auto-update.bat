@echo off
chcp 65001 >nul
rem 10분마다 자동으로 수집+빌드 반복. 이 창을 닫으면 중지됩니다.
:loop
call "%~dp0update.bat"
echo.
echo === 10분 후 다시 실행합니다 (이 창을 닫으면 중지) ===
timeout /t 600 /nobreak >nul
goto loop
