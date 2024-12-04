import tkinter as tk
from tkinter import ttk, messagebox
import subprocess
import os
import sys
import requests
import zipfile
import threading
from pathlib import Path

class InstallerGUI:
    def __init__(self, root):
        self.root = root
        self.root.title("Cloudflare Manager Installer")
        self.root.geometry("600x400")
        self.root.resizable(False, False)

        # Стили
        style = ttk.Style()
        style.configure("Custom.TButton", padding=10)
        style.configure("Custom.TProgressbar", thickness=20)

        # Основной контейнер
        main_frame = ttk.Frame(root, padding="20")
        main_frame.pack(fill=tk.BOTH, expand=True)

        # Заголовок
        title = ttk.Label(
            main_frame, 
            text="Установка Cloudflare Manager", 
            font=("Helvetica", 16, "bold")
        )
        title.pack(pady=20)

        # Прогресс бар
        self.progress = ttk.Progressbar(
            main_frame,
            style="Custom.TProgressbar",
            mode='determinate',
            length=500
        )
        self.progress.pack(pady=20)

        # Текст статуса
        self.status_text = ttk.Label(
            main_frame,
            text="Готов к установке",
            font=("Helvetica", 10)
        )
        self.status_text.pack(pady=10)

        # Кнопки
        button_frame = ttk.Frame(main_frame)
        button_frame.pack(pady=20)

        self.install_button = ttk.Button(
            button_frame,
            text="Установить",
            style="Custom.TButton",
            command=self.start_installation
        )
        self.install_button.pack(side=tk.LEFT, padx=10)

        self.cancel_button = ttk.Button(
            button_frame,
            text="Отмена",
            style="Custom.TButton",
            command=root.quit
        )
        self.cancel_button.pack(side=tk.LEFT, padx=10)

    def update_status(self, text, progress):
        self.status_text.config(text=text)
        self.progress["value"] = progress
        self.root.update()

    def install_nodejs(self):
        self.update_status("Установка Node.js...", 10)
        try:
            # Проверяем наличие Node.js
            subprocess.run(["node", "--version"], capture_output=True)
        except FileNotFoundError:
            # Скачиваем и устанавливаем Node.js
            nodejs_url = "https://nodejs.org/dist/v20.11.1/node-v20.11.1-x64.msi"
            installer_path = os.path.join(os.getenv("TEMP"), "node-installer.msi")
            
            response = requests.get(nodejs_url)
            with open(installer_path, "wb") as f:
                f.write(response.content)
            
            subprocess.run(["msiexec", "/i", installer_path, "/quiet"], check=True)
            os.remove(installer_path)

    def install_mysql(self):
        self.update_status("Установка MySQL...", 30)
        mysql_path = "C:\\mysql"
        
        if not os.path.exists(mysql_path):
            # Скачиваем MySQL
            mysql_url = "https://dev.mysql.com/get/Downloads/MySQL-8.0/mysql-8.0.36-winx64.zip"
            mysql_zip = os.path.join(os.getenv("TEMP"), "mysql.zip")
            
            response = requests.get(mysql_url)
            with open(mysql_zip, "wb") as f:
                f.write(response.content)
            
            # Распаковываем
            with zipfile.ZipFile(mysql_zip, 'r') as zip_ref:
                zip_ref.extractall(mysql_path)
            
            # Конфигурируем MySQL
            config = """[mysqld]
basedir=C:/mysql
datadir=C:/mysql/data
port=3306"""
            
            with open(os.path.join(mysql_path, "my.ini"), "w") as f:
                f.write(config)
            
            # Инициализируем и устанавливаем MySQL как службу
            subprocess.run([
                os.path.join(mysql_path, "bin", "mysqld.exe"),
                "--initialize-insecure"
            ], check=True)
            
            subprocess.run([
                os.path.join(mysql_path, "bin", "mysqld.exe"),
                "--install"
            ], check=True)
            
            # Запускаем службу
            subprocess.run(["net", "start", "mysql"], check=True)

    def setup_project(self):
        self.update_status("Настройка проекта...", 60)
        project_path = "C:\\CloudflareManager"
        
        # Создаем директорию проекта
        os.makedirs(project_path, exist_ok=True)
        os.chdir(project_path)
        
        # Клонируем репозиторий
        subprocess.run([
            "git", "clone",
            "https://github.com/ROYTER228/cloudflare-manager",
            "."
        ], check=True)
        
        # Устанавливаем зависимости
        subprocess.run(["npm", "install"], check=True)
        
        # Создаем базу данных
        subprocess.run([
            "mysql",
            "-u", "root",
            "-pP@ssw0rd",
            "-e", "CREATE DATABASE IF NOT EXISTS cloudflare_manager;"
        ], check=True)
        
        # Собираем CSS
        subprocess.run(["npm", "run", "build:css"], check=True)

    def create_shortcut(self):
        self.update_status("Создание ярлыка...", 90)
        desktop = os.path.join(os.path.expanduser("~"), "Desktop")
        shortcut_path = os.path.join(desktop, "Cloudflare Manager.url")
        
        with open(shortcut_path, "w") as f:
            f.write("""[InternetShortcut]
URL=http://localhost:3000
IconIndex=0""")

    def start_installation(self):
        self.install_button.config(state="disabled")
        
        try:
            self.install_nodejs()
            self.install_mysql()
            self.setup_project()
            self.create_shortcut()
            
            self.update_status("Установка завершена!", 100)
            messagebox.showinfo(
                "Успех",
                "Cloudflare Manager успешно установлен!\nОткройте http://localhost:3000"
            )
            
            # Запускаем приложение
            subprocess.Popen(["npm", "start"], cwd="C:\\CloudflareManager")
            
        except Exception as e:
            messagebox.showerror(
                "Ошибка",
                f"Произошла ошибка при установке:\n{str(e)}"
            )
        finally:
            self.install_button.config(state="normal")

if __name__ == "__main__":
    root = tk.Tk()
    app = InstallerGUI(root)
    root.mainloop() 
