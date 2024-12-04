const express = require('express');
const router = express.Router();
const axios = require('axios');

// Получение списка редиректов для домена
router.get('/:zoneId', async (req, res) => {
    try {
        const headers = {
            'X-Auth-Email': req.session.email,
            'X-Auth-Key': req.session.cloudflareApi,
            'Content-Type': 'application/json',
        };

        // Сначала получаем информацию о зоне
        const zoneResponse = await axios.get(
            `https://api.cloudflare.com/client/v4/zones/${req.params.zoneId}`,
            { headers }
        );

        if (!zoneResponse.data.success) {
            throw new Error('Failed to fetch zone info');
        }

        // Затем получаем редиректы
        const redirectsResponse = await axios.get(
            `https://api.cloudflare.com/client/v4/zones/${req.params.zoneId}/pagerules`,
            { headers }
        );

        if (!redirectsResponse.data.success) {
            throw new Error('Failed to fetch redirects');
        }

        // Фильтруем только правила с редиректами
        const redirects = redirectsResponse.data.result.filter(rule => 
            rule.actions.some(action => action.id === 'forwarding_url')
        );

        res.render('redirects/index', {
            zone: zoneResponse.data.result,
            redirects: redirects,
            error: null
        });
    } catch (error) {
        console.error('Redirects error:', error.response?.data || error.message);
        res.render('redirects/index', {
            zone: null,
            redirects: [],
            error: 'Ошибка при получении редиректов: ' + (error.response?.data?.errors?.[0]?.message || error.message)
        });
    }
});

// Добавление нового редиректа
router.post('/:zoneId/add', async (req, res) => {
    let { source_url, target_url, status_code } = req.body;
    
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

        if (!zoneResponse.data.success) {
            throw new Error('Failed to fetch zone info');
        }

        const zoneName = zoneResponse.data.result.name;

        // Форматируем source_url (откуда)
        if (!source_url || source_url === '/' || source_url === '') {
            source_url = zoneName; // Используем только домен
        } else if (!source_url.includes(zoneName)) {
            // Если в source_url нет имени домена, добавляем его
            if (source_url.startsWith('/')) {
                source_url = zoneName + source_url;
            } else {
                source_url = zoneName + '/' + source_url;
            }
        }

        // Форматируем target_url (куда)
        if (!target_url.startsWith('http://') && !target_url.startsWith('https://')) {
            target_url = 'https://' + target_url;
        }

        const response = await axios.post(
            `https://api.cloudflare.com/client/v4/zones/${req.params.zoneId}/pagerules`,
            {
                targets: [
                    {
                        target: 'url',
                        constraint: {
                            operator: 'matches',
                            value: source_url
                        }
                    }
                ],
                actions: [
                    {
                        id: 'forwarding_url',
                        value: {
                            url: target_url,
                            status_code: parseInt(status_code)
                        }
                    }
                ],
                status: 'active'
            },
            { headers }
        );

        if (response.data.success) {
            res.redirect(`/redirects/${req.params.zoneId}`);
        } else {
            throw new Error(response.data.errors[0].message);
        }
    } catch (error) {
        console.error('Add redirect error:', error.response?.data || error.message);
        
        // Получаем информацию о зоне для отображения на странице ошибки
        const zoneResponse = await axios.get(
            `https://api.cloudflare.com/client/v4/zones/${req.params.zoneId}`,
            { headers: {
                'X-Auth-Email': req.session.email,
                'X-Auth-Key': req.session.cloudflareApi,
                'Content-Type': 'application/json',
            }}
        );

        res.render('redirects/index', {
            zone: zoneResponse.data.result,
            redirects: [],
            error: 'Ошибка при добавлении редиректа: ' + 
                  (error.response?.data?.messages?.[0]?.message || 
                   error.response?.data?.errors?.[0]?.message || 
                   error.message)
        });
    }
});

// Удаление редиректа
router.delete('/:zoneId/rules/:ruleId', async (req, res) => {
    try {
        const headers = {
            'X-Auth-Email': req.session.email,
            'X-Auth-Key': req.session.cloudflareApi,
            'Content-Type': 'application/json',
        };

        const response = await axios.delete(
            `https://api.cloudflare.com/client/v4/zones/${req.params.zoneId}/pagerules/${req.params.ruleId}`,
            { headers }
        );

        if (response.data.success) {
            res.json({ success: true });
        } else {
            throw new Error(response.data.errors[0].message);
        }
    } catch (error) {
        console.error('Delete redirect error:', error.response?.data || error.message);
        res.status(500).json({
            success: false,
            error: error.response?.data?.errors?.[0]?.message || error.message
        });
    }
});

module.exports = router; 