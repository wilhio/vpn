const http = require('http');
const fs = require('fs');
const path = require('path');

// HTML page with VPN interface
const vpnHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>VPN Dashboard</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Sand Serif', serif;
            background: #121212;
            min-height: 100vh;
            color: white;
        }
        .container { 
            max-width: 800px; 
            margin: 0 auto; 
            padding: 20px;
        }
        .header {
            text-align: center;
            margin-bottom: 40px;
            padding: 20px 0;
        }
        .header h1 {
            font-size: 2.5rem;
            margin-bottom: 10px;
        }
        .status-card {
            background: #1E1E1E;
            border-radius: 20px;
            padding: 40px;
            text-align: center;
            margin-bottom: 30px;
            border: 1px solid #333;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .status-badge {
            display: inline-block;
            padding: 12px 24px;
            border-radius: 50px;
            font-weight: bold;
            font-size: 1.1rem;
            margin: 20px 0;
        }
        .connected { background: #2E7D32; }
        .disconnected { background: #C62828; }
        .connect-btn {
            background: #2196F3;
            border: none;
            color: white;
            padding: 15px 40px;
            font-size: 1.2rem;
            border-radius: 50px;
            cursor: pointer;
            transition: all 0.3s ease;
            margin: 20px 0;
        }
        .connect-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(0,0,0,0.3);
            background: #1976D2;
        }
        .disconnect-btn {
            background: #C62828;
        }
        .disconnect-btn:hover {
            background: #B71C1C;
        }
        .info-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-top: 30px;
        }
        .info-card {
            background: #1E1E1E;
            border-radius: 15px;
            padding: 25px;
            border: 1px solid #333;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .loading {
            display: inline-block;
            width: 20px;
            height: 20px;
            border: 3px solid #333;
            border-top: 3px solid #2196F3;
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        .hidden { display: none; }
        .ip-display {
            font-size: 1.3rem;
            color: #4CAF50;
            margin: 15px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔒 VPN Dashboard</h1>
            <p>Secure your connection with one click</p>
        </div>

        <div class="status-card">
            <h2>Connection Status</h2>
            <div id="status-badge" class="status-badge disconnected">
                🔴 Disconnected
            </div>
            <div id="ip-display" class="ip-display hidden"></div>
            <br>
            <button id="connect-btn" class="connect-btn" onclick="toggleConnection()">
                🟢 Connect VPN
            </button>
            <div id="loading" class="loading hidden"></div>
        </div>

        <div class="info-grid">
            <div class="info-card">
                <h3>🛡️ Security Status</h3>
                <p id="security-status">unprotected</p>
            </div>
            <div class="info-card">
                <h3>📍 Location</h3>
                <p id="location">Your real location</p>
            </div>
            <div class="info-card">
                <h3>🌐 IP Address</h3>
                <p id="ip-address">Your real IP</p>
            </div>
            <div class="info-card">
                <h3>⚡ Speed</h3>
                <p id="speed">Normal speed</p>
            </div>
        </div>
    </div>

    <script>
        let isConnected = false;
        let currentIP = '';

        function updateStatus() {
            const statusBadge = document.getElementById('status-badge');
            const connectBtn = document.getElementById('connect-btn');
            const ipDisplay = document.getElementById('ip-display');
            const securityStatus = document.getElementById('security-status');
            const location = document.getElementById('location');
            const ipAddress = document.getElementById('ip-address');
            const speed = document.getElementById('speed');

            if (isConnected) {
                statusBadge.textContent = '🟢 Connected';
                statusBadge.className = 'status-badge connected';
                connectBtn.textContent = '🔴 Disconnect VPN';
                connectBtn.className = 'connect-btn disconnect-btn';
                ipDisplay.textContent = '🌐 VPN IP: ' + currentIP;
                ipDisplay.classList.remove('hidden');
                securityStatus.textContent = 'encrypted and secure';
                location.textContent = 'Virtual location (VPN Server)';
                ipAddress.textContent = currentIP;
                speed.textContent = 'Protected speed';
            } else {
                statusBadge.textContent = '🔴 Disconnected';
                statusBadge.className = 'status-badge disconnected';
                connectBtn.textContent = '🟢 Connect VPN';
                connectBtn.className = 'connect-btn';
                ipDisplay.classList.add('hidden');
                securityStatus.textContent = 'unprotected';
                location.textContent = 'Your real location';
                ipAddress.textContent = 'Your real IP';
                speed.textContent = 'Normal speed';
            }
        }

        async function toggleConnection() {
            const connectBtn = document.getElementById('connect-btn');
            const loading = document.getElementById('loading');
            
            // Show loading
            connectBtn.style.display = 'none';
            loading.classList.remove('hidden');

            // Simulate connection time
            await new Promise(resolve => setTimeout(resolve, 2000));

            if (!isConnected) {
                // Connect
                currentIP = '10.0.0.' + Math.floor(Math.random() * 254 + 1);
                isConnected = true;
            } else {
                // Disconnect
                isConnected = false;
                currentIP = '';
            }

            // Hide loading
            loading.classList.add('hidden');
            connectBtn.style.display = 'inline-block';
            
            updateStatus();
        }

        // Initialize
        updateStatus();
    </script>
</body>
</html>`;

const server = http.createServer((req, res) => {
    const url = req.url;
    
    if (url === '/' || url === '/index.html') {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(vpnHTML);
    } else if (url === '/favicon.ico') {
        res.writeHead(200, { 'Content-Type': 'image/x-icon' });
        res.end('');
    } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
    }
});

const port = process.env.PORT || 3001;
server.listen(port, () => {
    console.log(`🚀 VPN Website running on port ${port}`);
    console.log(`📱 Open your browser and go to: http://localhost:${port}`);
    console.log('✨ Click Connect to test the VPN interface!');
}); 