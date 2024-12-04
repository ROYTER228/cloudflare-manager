const express = require('express');
const router = express.Router();
const axios = require('axios');

router.get('/login', (req, res) => {
    res.render('login');
});

router.post('/login', async (req, res) => {
    const { email, api_key } = req.body;

    try {
        // Проверяем API ключ
        const headers = {
            'X-Auth-Email': email,
            'X-Auth-Key': api_key,
            'Content-Type': 'application/json'
        };

        const response = await axios.get('https://api.cloudflare.com/client/v4/user', { headers });

        if (response.data.success) {
            // Сохраняем данные в сессию
            req.session.email = email;
            req.session.cloudflareApi = api_key;
            res.redirect('/dashboard');
        } else {
            throw new Error('Invalid credentials');
        }
    } catch (error) {
        console.error('Auth error:', error.response?.data || error.message);
        res.render('login', {
            error: 'Неверный email или API ключ',
            hideNav: true
        });
    }
});

router.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login');
});

module.exports = router; 