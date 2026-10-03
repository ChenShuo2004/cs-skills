@echo off
chcp 65001 >nul
cd /d %~dp0
where python >nul 2>nul && (python tts.py) || (py tts.py)
echo.
echo 配音完成后回到 Claude 说一声「配音好了」即可
pause
