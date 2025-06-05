const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const os = require('os');

class Tunnel {
    constructor() {
        this.algorithm = 'aes-256-gcm';
        // Store key in user's home directory in a hidden folder
        const userHome = os.homedir();
        this.keyDir = path.join(userHome, '.vpn_secure');
        this.keyFile = path.join(this.keyDir, '.encryption_key');
        this.encryptionKey = this.loadOrCreateKey();
    }

    loadOrCreateKey() {
        try {
            // Create the secure directory if it doesn't exist
            if (!fs.existsSync(this.keyDir)) {
                fs.mkdirSync(this.keyDir, { mode: 0o700 }); // Only owner can read/write
            }

            // Try to load existing key
            if (fs.existsSync(this.keyFile)) {
                const key = fs.readFileSync(this.keyFile);
                // Verify key length
                if (key.length !== 32) {
                    throw new Error('Invalid key length');
                }
                return key;
            }
            
            // Generate new key if none exists
            const key = crypto.randomBytes(32);
            fs.writeFileSync(this.keyFile, key, { mode: 0o600 }); // Only owner can read/write
            return key;
        } catch (error) {
            throw new Error('Failed to load or create encryption key: ' + error.message);
        }
    }

    async encrypt(data) {
        if (!data || typeof data !== 'string') {
            throw new Error('Invalid data format for encryption');
        }

        try {
            // Generate a random initialization vector
            const iv = crypto.randomBytes(16);
            
            // Create cipher
            const cipher = crypto.createCipheriv(this.algorithm, this.encryptionKey, iv);
            
            // Encrypt the data
            let encrypted = cipher.update(data, 'utf8', 'hex');
            encrypted += cipher.final('hex');
            
            // Get the auth tag
            const authTag = cipher.getAuthTag();
            
            // Return IV, encrypted data, and auth tag
            return {
                iv: iv.toString('hex'),
                encryptedData: encrypted,
                authTag: authTag.toString('hex'),
                timestamp: Date.now() // Add timestamp for additional security
            };
        } catch (error) {
            throw new Error('Encryption failed: ' + error.message);
        }
    }

    async decrypt(encryptedData, iv, authTag) {
        if (!encryptedData || !iv || !authTag) {
            throw new Error('Missing required decryption parameters');
        }

        try {
            // Convert hex strings back to buffers
            const decipher = crypto.createDecipheriv(
                this.algorithm,
                this.encryptionKey,
                Buffer.from(iv, 'hex')
            );
            
            // Set auth tag
            decipher.setAuthTag(Buffer.from(authTag, 'hex'));
            
            // Decrypt the data
            let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            
            return decrypted;
        } catch (error) {
            throw new Error('Decryption failed: ' + error.message);
        }
    }

    // Add method to verify encryption key integrity
    verifyKeyIntegrity() {
        try {
            const key = fs.readFileSync(this.keyFile);
            return key.length === 32;
        } catch (error) {
            return false;
        }
    }
}

module.exports = Tunnel;