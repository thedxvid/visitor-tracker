const express = require('express');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Ensure logs directory exists
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

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
            // Using ip-api.com (free, no API key needed)
            const geoResponse = await axios.get(`http://ip-api.com/json/${ip}?fields=status,message,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,org,as,query`);
            if (geoResponse.data.status === 'success') {
                geoData = geoResponse.data;
            }
        } catch (geoError) {
            console.error('GeoIP lookup failed:', geoError.message);
            geoData = { error: 'GeoIP lookup failed' };
        }

        const visitorRecord = {
            timestamp: new Date().toISOString(),
            ip: ip,
            userAgent: userAgent,
            referer: referer,
            acceptLanguage: acceptLanguage,
            geolocation: geoData,
            clientInfo: clientData
        };

        // Append to JSONL file
        const logFile = path.join(logsDir, 'visitors.jsonl');
        fs.appendFileSync(logFile, JSON.stringify(visitorRecord) + '\n');

        console.log(`[${new Date().toLocaleString('pt-BR')}] Novo visitante registrado: ${ip}`);

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
    try {
        const logFile = path.join(logsDir, 'visitors.jsonl');

        if (!fs.existsSync(logFile)) {
            return res.json([]);
        }

        const content = fs.readFileSync(logFile, 'utf-8');
        const lines = content.trim().split('\n').filter(line => line.trim());
        const visitors = lines.map(line => {
            try {
                return JSON.parse(line);
            } catch {
                return null;
            }
        }).filter(v => v !== null);

        // Return in reverse order (newest first)
        res.json(visitors.reverse());
    } catch (error) {
        console.error('Error reading visitors:', error);
        res.status(500).json({ error: 'Failed to read visitors' });
    }
});

// API to clear all logs
app.delete('/api/visitors', (req, res) => {
    try {
        const logFile = path.join(logsDir, 'visitors.jsonl');
        fs.writeFileSync(logFile, '');
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to clear logs' });
    }
});

app.listen(PORT, () => {
    console.log(`\n🟢 Servidor rodando em http://localhost:${PORT}`);
    console.log(`📊 Painel Admin em http://localhost:${PORT}/admin`);
    console.log(`📁 Logs salvos em: ${logsDir}`);
    console.log(`\nAguardando visitantes...\n`);
});
