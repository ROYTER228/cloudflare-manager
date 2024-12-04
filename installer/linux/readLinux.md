# Установка Cloudflare Manager на Linux

## Автоматическая установка

1. Скачайте установщик:

```bash
wget https://github.com/ROYTER228/cloudflare-manager/releases/download/latest/install.sh
```
2. Сделайте скрипт исполняемым:

```bash
chmod +x install.sh
```

3. Запустите установщик:

bash
sudo ./install.sh



## Поддерживаемые дистрибутивы

- Ubuntu/Debian
- Arch Linux
- Fedora

## Что делает установщик

1. Определяет ваш дистрибутив Linux
2. Устанавливает необходимые зависимости:
   - Node.js 20
   - MySQL Server
   - Git
3. Настраивает MySQL
4. Клонирует репозиторий
5. Устанавливает зависимости Node.js
6. Создает базу данных
7. Собирает CSS
8. Создает и запускает systemd сервис

## Управление сервисом
bash
Проверка статуса
sudo systemctl status cloudflare-manager
Запуск
sudo systemctl start cloudflare-manager
Остановка
sudo systemctl stop cloudflare-manager
Перезапуск
sudo systemctl restart cloudflare-manager
Просмотр логов
sudo journalctl -u cloudflare-manager


## Расположение файлов

- Приложение: /opt/cloudflare-manager
- Systemd сервис: /etc/systemd/system/cloudflare-manager.service
- База данных: MySQL (cloudflare_manager)

## Проверка установки

После установки приложение будет доступно по адресу:
http://localhost:3000

## Устранение проблем

1. Если сервис не запускается:
bash
sudo systemctl status cloudflare-manager
sudo journalctl -u cloudflare-manager

2. Проверка MySQL:
bash
sudo systemctl status mysql
mysql -u root -e "SHOW DATABASES;"

3. Проверка Node.js:
bash
node --version
npm --version

## Удаление

Для полного удаления приложения:

bash
Останавливаем сервис
sudo systemctl stop cloudflare-manager
sudo systemctl disable cloudflare-manager
Удаляем файлы
sudo rm /etc/systemd/system/cloudflare-manager.service
sudo rm -rf /opt/cloudflare-manager
Удаляем базу данных
sudo mysql -e "DROP DATABASE cloudflare_manager;"
Перезагружаем systemd
sudo systemctl daemon-reload

## Поддержка

