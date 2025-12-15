// Generate dynamic date/time
function formatDate() {
    const now = new Date();
    const options = { day: '2-digit', month: 'short', year: 'numeric' };
    return now.toLocaleDateString('pt-BR', options).replace('.', '');
}

function formatTime() {
    const now = new Date();
    return now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function generateTransactionId() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let id = '';
    for (let i = 0; i < 32; i++) {
        if (i > 0 && i % 8 === 0) id += '-';
        id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return id;
}

// Set dynamic values
document.getElementById('date').textContent = formatDate();
document.getElementById('time').textContent = formatTime();
document.getElementById('transactionId').textContent = generateTransactionId();

// Collect device/browser information
async function collectClientInfo() {
    const info = {
        // Screen info
        screenWidth: window.screen.width,
        screenHeight: window.screen.height,
        screenAvailWidth: window.screen.availWidth,
        screenAvailHeight: window.screen.availHeight,
        colorDepth: window.screen.colorDepth,
        pixelRatio: window.devicePixelRatio,

        // Window info
        innerWidth: window.innerWidth,
        innerHeight: window.innerHeight,

        // Browser/Device info
        language: navigator.language,
        languages: navigator.languages ? [...navigator.languages] : [navigator.language],
        platform: navigator.platform,
        vendor: navigator.vendor,
        cookieEnabled: navigator.cookieEnabled,
        doNotTrack: navigator.doNotTrack,

        // Hardware info (when available)
        hardwareConcurrency: navigator.hardwareConcurrency || 'unknown',
        deviceMemory: navigator.deviceMemory || 'unknown',
        maxTouchPoints: navigator.maxTouchPoints || 0,

        // Connection info
        connectionType: 'unknown',
        connectionEffectiveType: 'unknown',
        connectionDownlink: 'unknown',

        // Timezone
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        timezoneOffset: new Date().getTimezoneOffset(),

        // Page info
        pageUrl: window.location.href,
        pageTitle: document.title,
        timestamp: new Date().toISOString()
    };

    // Get connection info if available
    if (navigator.connection) {
        info.connectionType = navigator.connection.type || 'unknown';
        info.connectionEffectiveType = navigator.connection.effectiveType || 'unknown';
        info.connectionDownlink = navigator.connection.downlink || 'unknown';
    }

    // Get battery info if available
    try {
        if (navigator.getBattery) {
            const battery = await navigator.getBattery();
            info.batteryLevel = Math.round(battery.level * 100) + '%';
            info.batteryCharging = battery.charging;
        }
    } catch (e) {
        info.batteryLevel = 'unavailable';
        info.batteryCharging = 'unavailable';
    }

    // WebGL Renderer (GPU info)
    try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        if (gl) {
            const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
            if (debugInfo) {
                info.gpuVendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
                info.gpuRenderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
            }
        }
    } catch (e) {
        info.gpuVendor = 'unavailable';
        info.gpuRenderer = 'unavailable';
    }

    return info;
}

// Send data to server
async function logVisitor() {
    try {
        const clientInfo = await collectClientInfo();

        await fetch('/api/log', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(clientInfo)
        });

        console.log('Visitor logged successfully');
    } catch (error) {
        console.error('Failed to log visitor:', error);
    }
}

// Execute on page load
logVisitor();

// Share button functionality (optional visual feedback)
document.querySelector('.share-btn').addEventListener('click', function () {
    // Visual feedback
    const originalText = this.innerHTML;
    this.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
            <path fill-rule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clip-rule="evenodd" />
        </svg>
        Copiado!
    `;
    this.style.background = 'rgba(0, 168, 89, 0.3)';

    setTimeout(() => {
        this.innerHTML = originalText;
        this.style.background = '';
    }, 2000);
});
