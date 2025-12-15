const express = require('express');
const path = require('path');
const axios = require('axios');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/visitor-tracker';

mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('✅ MongoDB conectado');
}).catch(err => {
    console.error('❌ Erro ao conectar MongoDB:', err.message);
});

// Visitor Schema
const visitorSchema = new mongoose.Schema({
    timestamp: { type: Date, default: Date.now },
    ip: String,
    userAgent: String,
    referer: String,
    acceptLanguage: String,
    geolocation: Object,
    clientInfo: Object
}, { timestamps: true });

const Visitor = mongoose.model('Visitor', visitorSchema);

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

        // Save to MongoDB
        const visitor = new Visitor({
            ip: ip,
            userAgent: userAgent,
            referer: referer,
            acceptLanguage: acceptLanguage,
            geolocation: geoData,
            clientInfo: clientData
        });

        await visitor.save();

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
app.get('/api/visitors', async (req, res) => {
    try {
        const visitors = await Visitor.find().sort({ timestamp: -1 }).limit(100);
        res.json(visitors);
    } catch (error) {
        console.error('Error reading visitors:', error);
        res.status(500).json({ error: 'Failed to read visitors' });
    }
});

// API to clear all logs
app.delete('/api/visitors', async (req, res) => {
    try {
        await Visitor.deleteMany({});
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to clear logs' });
    }
});

// For local development
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`\n🟢 Servidor rodando em http://localhost:${PORT}`);
        console.log(`📊 Painel Admin em http://localhost:${PORT}/admin`);
        console.log(`\nAguardando visitantes...\n`);
    });
}

// Export for Vercel
module.exports = app;
