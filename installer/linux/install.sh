#!/bin/bash

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Функция для проверки ошибок
check_error() {
    if [ $? -ne 0 ]; then
        echo -e "${RED}Ошибка: $1${NC}"
        exit 1
    fi
}

echo -e "${YELLOW}Установка Cloudflare Manager...${NC}"

# Определяем дистрибутив
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$NAME
else
    echo -e "${RED}Невозможно определить дистрибутив${NC}"
    exit 1
fi

# Установка зависимостей в зависимости от дистрибутива
case $OS in
    "Ubuntu"|"Debian GNU/Linux")
        echo -e "${YELLOW}Установка зависимостей для Ubuntu/Debian...${NC}"
        sudo apt update
        sudo apt install -y curl
        curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
        sudo apt install -y nodejs mysql-server git
        check_error "Установка зависимостей"
        ;;
    "Arch Linux")
        echo -e "${YELLOW}Установка зависимостей для Arch Linux...${NC}"
        sudo pacman -Syu --noconfirm nodejs npm mysql git
        check_error "Установка зависимостей"
        ;;
    "Fedora")
        echo -e "${YELLOW}Установка зависимостей для Fedora...${NC}"
        sudo dnf install -y nodejs mysql-server git
        check_error "Установка зависимостей"
        ;;
    *)
        echo -e "${RED}Неподдерживаемый дистрибутив: $OS${NC}"
        exit 1
        ;;
esac

# Запуск MySQL
echo -e "${YELLOW}Настройка MySQL...${NC}"
sudo systemctl start mysql
sudo systemctl enable mysql
check_error "Запуск MySQL"

# Создание директории проекта
PROJECT_DIR="/opt/cloudflare-manager"
sudo mkdir -p $PROJECT_DIR
sudo chown $USER:$USER $PROJECT_DIR
check_error "Создание директории проекта"

# Клонирование репозитория
echo -e "${YELLOW}Клонирование репозитория...${NC}"
git clone https://github.com/ROYTER228/cloudflare-manager.git $PROJECT_DIR
check_error "Клонирование репозитория"
cd $PROJECT_DIR

# Установка зависимостей Node.js
echo -e "${YELLOW}Ус��ановка зависимостей Node.js...${NC}"
npm install
check_error "Установка зависимостей Node.js"

# Создание базы данных
echo -e "${YELLOW}Создание базы данных...${NC}"
sudo mysql -e "CREATE DATABASE IF NOT EXISTS cloudflare_manager;"
check_error "Создание базы данных"

# Сборка CSS
echo -e "${YELLOW}Сборка CSS...${NC}"
npm run build:css
check_error "Сборка CSS"

# Создание systemd сервиса
echo -e "${YELLOW}Создание systemd сервиса...${NC}"
sudo tee /etc/systemd/system/cloudflare-manager.service << EOF
[Unit]
Description=Cloudflare Manager
After=network.target mysql.service

[Service]
Type=simple
User=$USER
WorkingDirectory=$PROJECT_DIR
ExecStart=/usr/bin/npm start
Restart=always
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF
check_error "Создание systemd сервиса"

# Запуск сервиса
sudo systemctl daemon-reload
sudo systemctl enable cloudflare-manager
sudo systemctl start cloudflare-manager
check_error "Запуск сервиса"

echo -e "${GREEN}Установка успешно завершена!${NC}"
echo -e "Cloudflare Manager доступен по адресу: http://localhost:3000"
echo -e "Для просмотра логов: sudo journalctl -u cloudflare-manager"
echo -e "Для управления сервисом: sudo systemctl {start|stop|restart} cloudflare-manager" 