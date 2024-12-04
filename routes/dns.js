const express = require('express');
const router = express.Router();
const axios = require('axios');

// Получение DNS записей для домена
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

        // Затем получаем DNS записи
        const dnsResponse = await axios.get(
            `https://api.cloudflare.com/client/v4/zones/${req.params.zoneId}/dns_records`,
            { headers }
        );

        if (!dnsResponse.data.success) {
            throw new Error('Failed to fetch DNS records');
        }

        res.render('dns/index', { 
            zone: zoneResponse.data.result,
            records: dnsResponse.data.result,
            error: null 
        });
    } catch (error) {
        console.error('DNS error:', error.response?.data || error.message);
        res.render('dns/index', { 
            zone: null,
            records: [],
            error: 'Ошибка при получении DNS записей: ' + (error.response?.data?.errors?.[0]?.message || error.message)
        });
    }
});

// Добавление новой DNS записи
router.post('/:zoneId/add', async (req, res) => {
    const { type, name, content, proxied, ttl } = req.body;
    
    try {
        const headers = {
            'X-Auth-Email': req.session.email,
            'X-Auth-Key': req.session.cloudflareApi,
            'Content-Type': 'application/json',
        };

        const response = await axios({
            method: 'POST',
            url: `https://api.cloudflare.com/client/v4/zones/${req.params.zoneId}/dns_records`,
            headers,
            data: {
                type,
                name,
                content,
                proxied: proxied === 'true',
                ttl: parseInt(ttl)
            }
        });

        if (response.data.success) {
            res.redirect(`/dns/${req.params.zoneId}`);
        } else {
            throw new Error(response.data.errors[0].message);
        }
    } catch (error) {
        console.error('DNS add error:', error.response?.data || error.message);
        res.render('dns/add', { 
            zoneId: req.params.zoneId,
            error: `Ошибка при добавлении DNS записи: ${error.response?.data?.errors?.[0]?.message || error.message}` 
        });
    }
});

// Удаление DNS записи
router.delete('/:zoneId/records/:recordId', async (req, res) => {
    try {
        const headers = {
            'X-Auth-Email': req.session.email,
            'X-Auth-Key': req.session.cloudflareApi,
            'Content-Type': 'application/json',
        };

        const response = await axios.delete(
            `https://api.cloudflare.com/client/v4/zones/${req.params.zoneId}/dns_records/${req.params.recordId}`,
            { headers }
        );

        if (response.data.success) {
            res.json({ success: true });
        } else {
            throw new Error(response.data.errors[0].message);
        }
    } catch (error) {
        console.error('DNS delete error:', error.response?.data || error.message);
        res.status(500).json({ 
            success: false, 
            error: error.response?.data?.errors?.[0]?.message || error.message 
        });
    }
});

// Обновление DNS записи
router.patch('/:zoneId/records/:recordId', async (req, res) => {
    try {
        const headers = {
            'X-Auth-Email': req.session.email,
            'X-Auth-Key': req.session.cloudflareApi,
            'Content-Type': 'application/json',
        };

        const response = await axios.patch(
            `https://api.cloudflare.com/client/v4/zones/${req.params.zoneId}/dns_records/${req.params.recordId}`,
            req.body,
            { headers }
        );

        if (response.data.success) {
            res.json({ success: true });
        } else {
            throw new Error(response.data.errors[0].message);
        }
    } catch (error) {
        console.error('DNS update error:', error.response?.data || error.message);
        res.status(500).json({ 
            success: false, 
            error: error.response?.data?.errors?.[0]?.message || error.message 
        });
    }
});

// Удаление всех DNS записей
router.delete('/:zoneId/records', async (req, res) => {
    try {
        const headers = {
            'X-Auth-Email': req.session.email,
            'X-Auth-Key': req.session.cloudflareApi,
            'Content-Type': 'application/json',
        };

        // Сначала получаем все записи
        const recordsResponse = await axios.get(
            `https://api.cloudflare.com/client/v4/zones/${req.params.zoneId}/dns_records`,
            { headers }
        );

        if (!recordsResponse.data.success) {
            throw new Error('Failed to fetch DNS records');
        }

        // Удаляем каждую запись
        const deletePromises = recordsResponse.data.result.map(record => 
            axios.delete(
                `https://api.cloudflare.com/client/v4/zones/${req.params.zoneId}/dns_records/${record.id}`,
                { headers }
            )
        );

        await Promise.all(deletePromises);

        res.json({ success: true });
    } catch (error) {
        console.error('DNS delete all error:', error.response?.data || error.message);
        res.status(500).json({ 
            success: false, 
            error: error.response?.data?.errors?.[0]?.message || error.message 
        });
    }
});

module.exports = router; 