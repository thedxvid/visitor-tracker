const express = require('express');
const path = require('path');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// In-memory storage (resets on deploy/restart)
let visitors = [];

// Helper to get client IP
function getClientIp(req) {
    return req.headers['x-forwarded-for']?.split(',')[0].trim() ||
        req.headers['x-real-ip'] ||
        req.connection?.remoteAddress ||
        req.socket?.remoteAddress ||
        'unknown';
}

// API endpoint to log visitor data
app.post('/api/log', async (req, res) => {
    try {
        const clientData = req.body;
        const ip = getClientIp(req);
        const userAgent = req.headers['user-agent'] || 'unknown';
        const referer = req.headers['referer'] || 'direct';
        const acceptLanguage = req.headers['accept-language'] || 'unknown';

        // Get geolocation from IP
        let geoData = {};
        try {
            const geoResponse = await axios.get(`http://ip-api.com/json/${ip}?fields=status,message,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,org,as,query`);
            if (geoResponse.data.status === 'success') {
                geoData = geoResponse.data;
            }
        } catch (geoError) {
            console.error('GeoIP lookup failed:', geoError.message);
            geoData = { error: 'GeoIP lookup failed' };
        }

        const visitorRecord = {
            id: Date.now(),
            timestamp: new Date().toISOString(),
            ip: ip,
            userAgent: userAgent,
            referer: referer,
            acceptLanguage: acceptLanguage,
            geolocation: geoData,
            clientInfo: clientData
        };

        // Store in memory (newest first)
        visitors.unshift(visitorRecord);

        // Keep only last 100 visitors
        if (visitors.length > 100) {
            visitors = visitors.slice(0, 100);
        }

        console.log(`[${new Date().toLocaleString('pt-BR')}] Novo visitante: ${ip}`);

        res.json({ success: true });
    } catch (error) {
        console.error('Error logging visitor:', error);
        res.status(500).json({ success: false, error: 'Internal error' });
    }
});

// Serve index.html for root
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Serve admin panel
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// API to get all visitors
app.get('/api/visitors', (req, res) => {
    res.json(visitors);
});

// API to clear all logs
app.delete('/api/visitors', (req, res) => {
    visitors = [];
    res.json({ success: true });
});

// For local development
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`\n🟢 Servidor rodando em http://localhost:${PORT}`);
        console.log(`📊 Painel Admin em http://localhost:${PORT}/admin`);
        console.log(`💾 Storage: Memória (temporário)`);
        console.log(`\nAguardando visitantes...\n`);
    });
}

// Export for Vercel
module.exports = app;
