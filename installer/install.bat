@echo off
echo Installing Cloudflare Manager...

:: Проверяем наличие Python
python --version >nul 2>&1
if errorlevel 1 (
    echo Python not found. Installing Python...
    curl -o python-installer.exe https://www.python.org/ftp/python/3.11.0/python-3.11.0-amd64.exe
    python-installer.exe /quiet InstallAllUsers=1 PrependPath=1
    del python-installer.exe
)

:: Устанавливаем зависимости
pip install -r requirements.txt

:: Запускаем установщик
python installer.py

pause 