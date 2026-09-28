const ADMIN_USERNAME = process.env.ADMIN_USER || 'admin';

module.exports = (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const authHeader = req.headers.authorization || '';
    const token = authHeader.replace('Bearer ', '').trim();

    if (token && token.startsWith('ophelia_admin_token_')) {
        return res.status(200).json({ valid: true, user: { username: ADMIN_USERNAME, role: 'Administrator' } });
    }

    return res.status(401).json({ valid: false });
};
