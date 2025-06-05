const express = require('express');
const cors = require('cors');
const app = express();

// Enable CORS
app.use(cors());
app.use(express.json());

// Simple test route
app.get('/', (req, res) => {
    res.json({ message: 'Server is working!' });
});

// API routes
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK' });
});

const port = process.env.PORT || 3001;
app.listen(port, () => {
    console.log(`Test server running on port ${port}`);
}); 