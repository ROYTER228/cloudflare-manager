const mysql = require('mysql2/promise');

const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: 'P@ssw0rd',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

async function initializeDatabase() {
    try {
        // Создаем соединение
        const connection = await mysql.createConnection({
            host: dbConfig.host,
            user: dbConfig.user,
            password: dbConfig.password
        });

        // Создаем базу данных
        await connection.query('CREATE DATABASE IF NOT EXISTS cloudflare_manager');
        console.log('База данных создана или уже существует');

        // Используем базу данных
        await connection.query('USE cloudflare_manager');

        // Создаем таблицу для пользователей (если нужно)
        await connection.query(`
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                api_key VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Создаем таблицу для доменов (если нужно хранить локально)
        await connection.query(`
            CREATE TABLE IF NOT EXISTS domains (
                id INT AUTO_INCREMENT PRIMARY KEY,
                zone_id VARCHAR(32) NOT NULL,
                name VARCHAR(255) NOT NULL,
                status VARCHAR(50),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        console.log('Таблицы созданы успешно');
        await connection.end();
    } catch (error) {
        console.error('Ошибка при инициализации базы данных:', error);
        process.exit(1);
    }
}

initializeDatabase(); 