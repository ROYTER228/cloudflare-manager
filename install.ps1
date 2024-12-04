# Проверка и установка Node.js
function Install-NodeJS {
    Write-Host "Проверка наличия Node.js..." -ForegroundColor Yellow
    
    if (!(Get-Command node -ErrorAction SilentlyContinue)) {
        Write-Host "Node.js не установлен. Устанавливаем..." -ForegroundColor Yellow
        
        # Скачиваем установщик Node.js
        $nodeUrl = "https://nodejs.org/dist/v20.11.1/node-v20.11.1-x64.msi"
        $nodeInstaller = "$env:TEMP\node-installer.msi"
        
        Invoke-WebRequest -Uri $nodeUrl -OutFile $nodeInstaller
        
        # Устанавливаем Node.js
        Start-Process msiexec.exe -Wait -ArgumentList "/i $nodeInstaller /quiet"
        
        Remove-Item $nodeInstaller
        
        # Обновляем PATH
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
        
        Write-Host "Node.js успешно установлен" -ForegroundColor Green
    } else {
        Write-Host "Node.js уже установлен" -ForegroundColor Green
    }
}

# Установка MySQL
function Install-MySQL {
    Write-Host "Проверка наличия MySQL..." -ForegroundColor Yellow
    
    if (!(Get-Service mysql -ErrorAction SilentlyContinue)) {
        Write-Host "MySQL не установлен. Устанавливаем..." -ForegroundColor Yellow
        
        # Скачиваем установщик MySQL
        $mysqlUrl = "https://dev.mysql.com/get/Downloads/MySQL-8.0/mysql-8.0.36-winx64.zip"
        $mysqlZip = "$env:TEMP\mysql.zip"
        
        Invoke-WebRequest -Uri $mysqlUrl -OutFile $mysqlZip
        
        # Распаковываем MySQL
        Expand-Archive $mysqlZip -DestinationPath "C:\mysql" -Force
        
        # Создаем конфигурационный файл
        @"
[mysqld]
basedir=C:/mysql
datadir=C:/mysql/data
port=3306
"@ | Out-File "C:\mysql\my.ini" -Encoding ASCII
        
        # Инициализируем MySQL
        Start-Process "C:\mysql\bin\mysqld.exe" -ArgumentList "--initialize-insecure" -Wait
        
        # Устанавливаем MySQL как службу
        Start-Process "C:\mysql\bin\mysqld.exe" -ArgumentList "--install" -Wait
        
        # Запускаем службу MySQL
        Start-Service mysql
        
        # Устанавливаем пароль root
        Start-Process "C:\mysql\bin\mysql.exe" -ArgumentList "-u root -e ""ALTER USER 'root'@'localhost' IDENTIFIED BY 'P@ssw0rd'""" -Wait
        
        Write-Host "MySQL успешно установлен" -ForegroundColor Green
    } else {
        Write-Host "MySQL уже установлен" -ForegroundColor Green
    }
}

# Клонирование и настройка проекта
function Setup-Project {
    Write-Host "Настройка проекта..." -ForegroundColor Yellow
    
    # Создаем рабочую директорию
    $projectPath = "C:\CloudflareManager"
    New-Item -ItemType Directory -Force -Path $projectPath
    Set-Location $projectPath
    
    # Скачиваем проект
    if (Test-Path ".git") {
        git pull
    } else {
        git clone https://github.com/ваш-репозиторий.git .
    }
    
    # Устанавливаем зависимости
    npm install
    
    # Создаем базу данных
    $query = @"
CREATE DATABASE IF NOT EXISTS cloudflare_manager;
USE cloudflare_manager;
"@
    
    $query | mysql -u root -p"P@ssw0rd"
    
    # Собираем CSS
    npm run build:css
    
    Write-Host "Проект успешно настроен" -ForegroundColor Green
}

# Создание ярлыка на рабочем столе
function Create-Shortcut {
    $WshShell = New-Object -comObject WScript.Shell
    $Shortcut = $WshShell.CreateShortcut("$env:USERPROFILE\Desktop\Cloudflare Manager.lnk")
    $Shortcut.TargetPath = "http://localhost:3000"
    $Shortcut.Save()
}

# Основной процесс установки
try {
    Write-Host "Начинаем установку Cloudflare Manager..." -ForegroundColor Cyan
    
    Install-NodeJS
    Install-MySQL
    Setup-Project
    Create-Shortcut
    
    # Запускаем приложение
    Start-Process "http://localhost:3000"
    npm start
    
    Write-Host "Установка успешно завершена!" -ForegroundColor Green
    Write-Host "Приложение доступно по адресу: http://localhost:3000" -ForegroundColor Cyan
} catch {
    Write-Host "Произошла ошибка при установке: $_" -ForegroundColor Red
    Write-Host "Пожалуйста, обратитесь к разработчику за помощью" -ForegroundColor Red
}

Read-Host -Prompt "Нажмите Enter для завершения" 