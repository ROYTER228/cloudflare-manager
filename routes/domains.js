const express = require('express');
const router = express.Router();
const axios = require('axios');

// Получение списка всех доменов
router.get('/', async (req, res) => {
    try {
        const headers = {
            'X-Auth-Email': req.session.email,
            'X-Auth-Key': req.session.cloudflareApi,
            'Content-Type': 'application/json',
        };

        const response = await axios.get('https://api.cloudflare.com/client/v4/zones', { headers });

        res.render('domains', { 
            domains: response.data.result,
            error: null
        });
    } catch (error) {
        console.error('Error fetching domains:', error.response?.data || error.message);
        res.render('domains', { 
            domains: [],
            error: 'Ошибка при получении списка доменов' 
        });
    }
});

// Страница добавления нового домена
router.get('/add', (req, res) => {
    res.render('domains/add');
});

// Добавление нового домена
router.post('/add', async (req, res) => {
    const { name } = req.body;
    
    try {
        const headers = {
            'X-Auth-Email': req.session.email,
            'X-Auth-Key': req.session.cloudflareApi,
            'Content-Type': 'application/json',
        };

        const response = await axios({
            method: 'POST',
            url: 'https://api.cloudflare.com/client/v4/zones',
            headers: headers,
            data: {
                name: name,
                jump_start: true
            }
        });

        if (response.data.success) {
            res.redirect('/domains');
        } else {
            throw new Error(response.data.errors[0].message);
        }
    } catch (error) {
        console.error('Error adding domain:', error.response?.data || error.message);
        res.render('domains/add', { 
            error: 'Ошибка при добавлении домена: ' + (error.response?.data?.errors?.[0]?.message || error.message)
        });
    }
});

// Страница настроек домена
router.get('/:zoneId/settings', async (req, res) => {
    try {
        const headers = {
            'X-Auth-Email': req.session.email,
            'X-Auth-Key': req.session.cloudflareApi,
            'Content-Type': 'application/json',
        };

        // Получаем информацию о домене
        const zoneResponse = await axios.get(
            `https://api.cloudflare.com/client/v4/zones/${req.params.zoneId}`,
            { headers }
        );

        // Получаем настройки безопасности
        const securityResponse = await axios.get(
            `https://api.cloudflare.com/client/v4/zones/${req.params.zoneId}/settings/security_level`,
            { headers }
        );

        // Получаем настройки DNS
        const dnsResponse = await axios.get(
            `https://api.cloudflare.com/client/v4/zones/${req.params.zoneId}/dns_records`,
            { headers }
        );

        if (!zoneResponse.data.success || !dnsResponse.data.success || !securityResponse.data.success) {
            throw new Error('Failed to fetch data from Cloudflare');
        }

        const zoneData = zoneResponse.data.result;
        zoneData.security_level = securityResponse.data.result.value;

        res.render('domains/settings', {
            zone: zoneData,
            dns: dnsResponse.data.result,
            error: null
        });
    } catch (error) {
        console.error('Error fetching zone settings:', error.response?.data || error.message);
        res.render('domains/settings', {
            zone: null,
            dns: [],
            error: 'Ошибка при получении настроек домена'
        });
    }
});

// Удаление домена
router.delete('/:zoneId', async (req, res) => {
    try {
        const headers = {
            'X-Auth-Email': req.session.email,
            'X-Auth-Key': req.session.cloudflareApi,
            'Content-Type': 'application/json',
        };

        const response = await axios.delete(
            `https://api.cloudflare.com/client/v4/zones/${req.params.zoneId}`,
            { headers }
        );

        if (response.data.success) {
            res.json({ success: true });
        } else {
            throw new Error(response.data.errors[0].message);
        }
    } catch (error) {
        console.error('Error deleting domain:', error.response?.data || error.message);
        res.status(500).json({ 
            success: false, 
            error: error.response?.data?.errors?.[0]?.message || error.message 
        });
    }
});

// Изменение настроек безопасности
router.patch('/:zoneId/security', async (req, res) => {
    try {
        const headers = {
            'X-Auth-Email': req.session.email,
            'X-Auth-Key': req.session.cloudflareApi,
            'Content-Type': 'application/json',
        };

        const response = await axios.patch(
            `https://api.cloudflare.com/client/v4/zones/${req.params.zoneId}/settings/security_level`,
            {
                value: req.body.security_level
            },
            { headers }
        );

        if (response.data.success) {
            res.json({ success: true });
        } else {
            throw new Error(response.data.errors[0].message);
        }
    } catch (error) {
        console.error('Security settings error:', error.response?.data || error.message);
        res.status(500).json({
            success: false,
            error: error.response?.data?.errors?.[0]?.message || error.message
        });
    }
});

module.exports = router; 