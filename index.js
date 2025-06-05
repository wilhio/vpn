const readline = require('readline');
const fs = require('fs');
const path = require('path');
const os = require('os');
const Tunnel = require('./tunnel');
const express = require('express');
const cors = require('cors');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

let existingUsernames = [];
let existingPasswords = [];
const tunnel = new Tunnel();

// Track active connections
let activeConnections = new Map(); // userId -> connection status

// Get the secure directory path
const userHome = os.homedir();
const secureDir = path.join(userHome, '.vpn_secure');
const usersFile = path.join(secureDir, 'users.json');

// Initialize and migrate existing data
async function initializeData() {
    try {
        // Create secure directory if it doesn't exist
        if (!fs.existsSync(secureDir)) {
            fs.mkdirSync(secureDir, { mode: 0o700 });
        }

        // Verify encryption key integrity
        if (!tunnel.verifyKeyIntegrity()) {
            console.error('Encryption key integrity check failed. Please ensure your key is valid.');
            process.exit(1);
        }

        if (fs.existsSync(usersFile)) {
            const data = JSON.parse(fs.readFileSync(usersFile, 'utf8'));
            existingUsernames = data.usernames || [];
            
            // Migrate existing plaintext passwords to encrypted format
            if (data.passwords && data.passwords.length > 0) {
                existingPasswords = await Promise.all(
                    data.passwords.map(async (password) => {
                        if (typeof password === 'string') {
                            // This is a plaintext password that needs to be encrypted
                            return await tunnel.encrypt(password);
                        }
                        // Verify existing encrypted password structure
                        if (!password.iv || !password.encryptedData || !password.authTag) {
                            throw new Error('Invalid password format detected');
                        }
                        return password;
                    })
                );
                // Save the migrated data
                await saveData();
            }
        } else {
            console.log('Starting with fresh data');
            existingUsernames = [];
            existingPasswords = [];
        }
    } catch (error) {
        console.error('Error initializing data:', error.message);
        process.exit(1);
    }
}

async function saveData() {
    try {
        const data = {
            usernames: existingUsernames,
            passwords: existingPasswords,
            lastUpdated: new Date().toISOString()
        };
        fs.writeFileSync(usersFile, JSON.stringify(data, null, 2), { mode: 0o600 });
    } catch (error) {
        console.error('Error saving data:', error.message);
        throw error;
    }
}

function isUsernameUnique(username) {
    return !existingUsernames.includes(username.toLowerCase());
}

async function isPasswordUnique(encryptedPassword) {
    return !existingPasswords.some(pwd => 
        pwd.encryptedData === encryptedPassword.encryptedData &&
        pwd.iv === encryptedPassword.iv
    );
}

// Authentication helper functions
async function authenticateUser(username, password) {
    const userIndex = existingUsernames.findIndex(u => u === username.toLowerCase());
    if (userIndex === -1) {
        return false;
    }

    try {
        const encryptedPassword = existingPasswords[userIndex];
        const decryptedPassword = await tunnel.decrypt(
            encryptedPassword.encryptedData,
            encryptedPassword.iv,
            encryptedPassword.authTag
        );
        return decryptedPassword === password;
    } catch (error) {
        console.error('Authentication error:', error.message);
        return false;
    }
}

// CLI functions (keeping existing functionality)
function askForUsername() {
    rl.question('Create a unique username for yourself: ', (answer) => {
        const username = answer.trim();
        
        if (!username) {
            console.log('Username cannot be empty. Please try again.');
            askForUsername();
            return;
        }

        if (isUsernameUnique(username)) {
            existingUsernames.push(username.toLowerCase());
            saveData();
            console.log(`Username "${username}" has been created successfully!`);
            askForPassword();
        } else {
            console.log(`Sorry, the username "${username}" is already taken. Please try another one.`);
            askForUsername(); 
        }
    });
}

async function askForPassword() {
    rl.question('Create a new password: ', async (answer) => {
        const password = answer.trim();
        
        if (!password) {
            console.log('Password cannot be empty. Please try again.');
            askForPassword();
            return;
        }

        try {
            const encryptedPassword = await tunnel.encrypt(password);
            
            if (await isPasswordUnique(encryptedPassword)) {
                existingPasswords.push(encryptedPassword);
                await saveData();
                console.log('Password created and encrypted successfully!');
                console.log('Account setup complete!');
                startWebServer();
            } else {
                console.log('This password is already in use. Please choose a different one.');
                askForPassword();
            }
        } catch (error) {
            console.error('Error encrypting password:', error.message);
            askForPassword();
        }
    });
}

// Web server setup
function startWebServer() {
    const app = express();

    // Enable CORS
    app.use(cors());
    app.use(express.json());

    // Check if frontend build exists
    const frontendBuildPath = path.join(__dirname, 'frontend/build');
    const frontendIndexPath = path.join(frontendBuildPath, 'index.html');
    const hasFrontendBuild = fs.existsSync(frontendIndexPath);

    // Serve static files from the React app if it exists
    if (hasFrontendBuild) {
        app.use(express.static(frontendBuildPath));
    }

    // API routes
    app.post('/api/register', async (req, res) => {
        try {
            const { username, password } = req.body;

            // Validation
            if (!username || !password) {
                return res.status(400).json({ message: 'Username and password are required' });
            }

            if (password.length < 6) {
                return res.status(400).json({ message: 'Password must be at least 6 characters long' });
            }

            // Check if username is unique
            if (!isUsernameUnique(username)) {
                return res.status(409).json({ message: 'Username already taken' });
            }

            // Encrypt password
            const encryptedPassword = await tunnel.encrypt(password);

            // Check if password is unique
            if (!(await isPasswordUnique(encryptedPassword))) {
                return res.status(409).json({ message: 'Password already in use' });
            }

            // Save user
            existingUsernames.push(username.toLowerCase());
            existingPasswords.push(encryptedPassword);
            await saveData();

            res.status(201).json({ message: 'User registered successfully' });
        } catch (error) {
            console.error('Registration error:', error.message);
            res.status(500).json({ message: 'Internal server error' });
        }
    });

    app.post('/api/login', async (req, res) => {
        try {
            const { username, password } = req.body;

            if (!username || !password) {
                return res.status(400).json({ message: 'Username and password are required' });
            }

            const isAuthenticated = await authenticateUser(username, password);
            
            if (isAuthenticated) {
                res.json({ 
                    message: 'Login successful',
                    user: { username: username.toLowerCase() }
                });
            } else {
                res.status(401).json({ message: 'Invalid credentials' });
            }
        } catch (error) {
            console.error('Login error:', error.message);
            res.status(500).json({ message: 'Internal server error' });
        }
    });

    app.post('/api/connect', async (req, res) => {
        try {
            const { username } = req.body;

            if (!username) {
                return res.status(400).json({ message: 'Username required' });
            }

            // Simulate VPN connection process
            // In a real implementation, this would establish actual VPN tunnel
            console.log(`Establishing VPN connection for user: ${username}`);
            
            // Store connection status
            activeConnections.set(username.toLowerCase(), {
                connected: true,
                connectedAt: new Date().toISOString(),
                ip: '10.0.0.' + Math.floor(Math.random() * 254 + 1) // Simulated VPN IP
            });

            res.json({ 
                message: 'VPN connected successfully',
                status: 'connected',
                ip: activeConnections.get(username.toLowerCase()).ip
            });
        } catch (error) {
            console.error('Connection error:', error.message);
            res.status(500).json({ message: 'Connection failed' });
        }
    });

    app.post('/api/disconnect', async (req, res) => {
        try {
            const { username } = req.body;

            if (!username) {
                return res.status(400).json({ message: 'Username required' });
            }

            console.log(`Disconnecting VPN for user: ${username}`);
            
            // Remove connection status
            activeConnections.delete(username.toLowerCase());

            res.json({ 
                message: 'VPN disconnected successfully',
                status: 'disconnected'
            });
        } catch (error) {
            console.error('Disconnection error:', error.message);
            res.status(500).json({ message: 'Disconnection failed' });
        }
    });

    app.get('/api/status', (req, res) => {
        try {
            const { username } = req.query;
            
            if (!username) {
                return res.status(400).json({ message: 'Username required' });
            }

            const connection = activeConnections.get(username.toLowerCase());
            
            res.json({
                connected: !!connection,
                ...(connection && {
                    connectedAt: connection.connectedAt,
                    ip: connection.ip
                })
            });
        } catch (error) {
            console.error('Status check error:', error.message);
            res.status(500).json({ message: 'Failed to check status' });
        }
    });

    // Health check endpoint
    app.get('/api/health', (req, res) => {
        res.json({ status: 'OK', timestamp: new Date().toISOString() });
    });

    // Frontend routes - only if build exists
    if (hasFrontendBuild) {
        // The "catchall" handler: for any request that doesn't
        // match one above, send back React's index.html file.
        app.get('*', (req, res) => {
            res.sendFile(frontendIndexPath);
        });
    } else {
        // Fallback route when no frontend build exists
        app.get('*', (req, res) => {
            res.json({
                message: 'VPN API Server is running',
                status: 'OK',
                note: 'Frontend not built. Run "npm run build" to build the frontend.',
                availableEndpoints: [
                    'POST /api/register',
                    'POST /api/login',
                    'POST /api/connect',
                    'POST /api/disconnect',
                    'GET /api/status',
                    'GET /api/health'
                ]
            });
        });
    }

    const port = process.env.PORT || 3001;
    app.listen(port, () => {
        console.log(`VPN Server is running on port ${port}`);
        if (hasFrontendBuild) {
            console.log(`Frontend available at http://localhost:${port}`);
        } else {
            console.log(`API available at http://localhost:${port}/api`);
            console.log('To build frontend: npm run build');
        }
        console.log('For development, run the React app separately on port 3000');
    });
}

// Check if we should run CLI or web server directly
const args = process.argv.slice(2);

if (args.includes('--web-only')) {
    // Skip CLI setup and start web server directly
    initializeData().then(() => {
        startWebServer();
    }).catch(error => {
        console.error('Fatal error:', error.message);
        process.exit(1);
    });
} else {
    // Run CLI setup first, then start web server
    initializeData().then(() => {
        askForUsername();
    }).catch(error => {
        console.error('Fatal error:', error.message);
        process.exit(1);
    });
}

