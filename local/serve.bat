@echo off
chcp 65001 >nul
cd /d "%~dp0.."
if not exist site\index.html (
  echo site 폴더가 아직 없습니다. 먼저 update.bat 을 한 번 실행하세요.
  pause
  exit /b
)
echo.
echo  사이트 주소: http://localhost:8080
echo  같은 와이파이의 다른 기기에서는: http://(이 PC의 IP):8080
echo  (이 창을 닫으면 서버가 꺼집니다)
echo.
npx --yes serve -l 8080 site
