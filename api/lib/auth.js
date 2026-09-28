function isAuthenticated(req) {
    const authHeader = req.headers.authorization || req.headers.Authorization || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    return Boolean(token && token.startsWith('ophelia_admin_token_'));
}

module.exports = { isAuthenticated };
