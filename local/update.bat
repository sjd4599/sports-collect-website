@echo off
chcp 65001 >nul
cd /d "%~dp0.."
echo [%date% %time%] update start
rem 1) 수집(무료 번역) -> 2) 이미지 backfill -> 3) standalone 재생성
node scripts\collect.mjs --max=40
node scripts\backfill-images.mjs --max=200
node scripts\build-standalone.mjs
rem 로컬 서버용 폴더(site)로 복사 (vite의 index.html 은 건드리지 않음)
if not exist site mkdir site
copy /Y standalone.html site\index.html >nul
if exist genimg xcopy /E /I /Y genimg site\genimg >nul
echo [%date% %time%] done - site\index.html updated
