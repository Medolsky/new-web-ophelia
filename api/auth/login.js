const crypto = require('crypto');

const ADMIN_USERNAME = process.env.ADMIN_USER || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'ophelia2026';

module.exports = (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
        const { username, password } = body;

        if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
            // Predictable token or signed token that works in serverless
            const token = 'ophelia_admin_token_' + Buffer.from(username + ':' + Date.now()).toString('base64');
            return res.status(200).json({
                success: true,
                token,
                user: { username: ADMIN_USERNAME, role: 'Administrator' }
            });
        }
        return res.status(401).json({ success: false, message: 'Username atau password admin salah!' });
    } catch (e) {
        return res.status(400).json({ success: false, message: 'Invalid request body' });
    }
};
