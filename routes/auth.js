const express = require('express');
const router = express.Router();
const axios = require('axios');

router.get('/login', (req, res) => {
    res.render('login');
});

router.post('/login', async (req, res) => {
    const { apiKey, email } = req.body;
    
    try {
        const response = await axios.get('https://api.cloudflare.com/client/v4/zones', {
            headers: {
                'X-Auth-Email': email,
                'X-Auth-Key': apiKey,
                'Content-Type': 'application/json',
            },
        });

        if (response.data.success) {
            req.session.cloudflareApi = apiKey;
            req.session.email = email;
            res.redirect('/dashboard');
        } else {
            throw new Error('Invalid API key');
        }
    } catch (error) {
        console.error('Auth error:', error.response?.data || error.message);
        res.render('login', { 
            error: 'Ошибка при проверке API ключа: ' + (error.response?.data?.errors?.[0]?.message || error.message)
        });
    }
});

router.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login');
});

module.exports = router; 