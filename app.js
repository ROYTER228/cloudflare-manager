const express = require('express');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const mysql = require('mysql2/promise');
const ejs = require('ejs');
const path = require('path');
const axios = require('axios');
const expressLayouts = require('express-ejs-layouts');

// Добавляем поддержку TailwindUI
const tailwindcss = require('@tailwindcss/forms');

const authRoutes = require('./routes/auth');
const domainRoutes = require('./routes/domains');
const dnsRoutes = require('./routes/dns');
const redirectsRoutes = require('./routes/redirects');

const app = express();

// Конфигурация MySQL
const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: 'P@ssw0rd',
    database: 'cloudflare_manager',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

// Создание пула соединений MySQL
const pool = mysql.createPool(dbConfig);

// Настройка хранилища сессий в MySQL
const sessionStore = new MySQLStore({
    ...dbConfig,
    createDatabaseTable: true
});

// Настройка Express и EJS
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Настройка express-ejs-layouts
app.use(expressLayouts);
app.set('layout extractScripts', true);
app.set('layout extractStyles', true);
app.set('layout', './layouts/main');

app.use(express.static(path.join(__dirname, 'public')));
app.use('/css', express.static(path.join(__dirname, 'node_modules/@tailwindcss/forms/dist')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Настройка сессий
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
}));

// Добавляем пул соединений в request
app.use((req, res, next) => {
    req.db = pool;
    next();
});

// Middleware для проверки авторизации
const authMiddleware = (req, res, next) => {
    if (!req.session.cloudflareApi) {
        return res.redirect('/login');
    }
    next();
};

// Добавляем middleware для установки layout по умолчанию
app.use((req, res, next) => {
    res.locals.layout = './layouts/main';
    next();
});

// Middleware для добавления текущего пути
app.use((req, res, next) => {
    res.locals.path = req.path;
    next();
});

// Роуты
app.use('/auth', authRoutes);
app.use('/domains', authMiddleware, domainRoutes);
app.use('/dns', authMiddleware, dnsRoutes);
app.use('/redirects', authMiddleware, redirectsRoutes);

// Маршрут для страницы входа
app.get('/login', (req, res) => {
    res.render('login', { 
        error: null,
        hideNav: true
    });
});

// Главная страница
app.get('/', authMiddleware, (req, res) => {
    res.redirect('/dashboard');
});

// Маршрут для dashboard
app.get('/dashboard', authMiddleware, async (req, res) => {
    try {
        const headers = {
            'X-Auth-Email': req.session.email,
            'X-Auth-Key': req.session.cloudflareApi,
            'Content-Type': 'application/json',
        };

        const response = await axios.get('https://api.cloudflare.com/client/v4/zones', { headers });

        if (!response.data.success) {
            throw new Error('Failed to fetch zones');
        }

        res.render('dashboard', { 
            domains: response.data.result,
            error: null
        });
    } catch (error) {
        console.error('Dashboard error:', error.response?.data || error.message);
        res.render('dashboard', { 
            domains: [],
            error: 'Ошибка при получении данных'
        });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
