const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const Tunnel = require('./tunnel');

// Your existing data management code here...
let existingUsernames = [];
let existingPasswords = [];
const tunnel = new Tunnel();
let activeConnections = new Map();

// Simple JSON response helper
function sendJSON(res, statusCode, data) {
    res.writeHead(statusCode, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
}

// Simple server
const server = http.createServer(async (req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const method = req.method;
    const pathname = parsedUrl.pathname;

    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    // Handle API routes
    if (pathname === '/api/health') {
        sendJSON(res, 200, { status: 'OK', timestamp: new Date().toISOString() });
        return;
    }

    if (pathname === '/' || pathname === '/api') {
        sendJSON(res, 200, { 
            message: 'VPN API Server is running',
            endpoints: ['/api/health']
        });
        return;
    }

    // 404 for other routes
    sendJSON(res, 404, { message: 'Not found' });
});

const port = process.env.PORT || 3001;
server.listen(port, () => {
    console.log(`Simple server running on port ${port}`);
}); 