const path = require('path');
const fs = require('fs');

module.exports = (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        let db = { posters: [], articles: [] };
        const tmpDbPath = '/tmp/data/db.json';
        const localDbPath = path.join(process.cwd(), 'data', 'db.json');

        if (fs.existsSync(tmpDbPath)) {
            db = JSON.parse(fs.readFileSync(tmpDbPath, 'utf-8'));
        } else if (fs.existsSync(localDbPath)) {
            db = JSON.parse(fs.readFileSync(localDbPath, 'utf-8'));
        }

        res.status(200).json({
            postersCount: (db.posters || []).length,
            articlesCount: (db.articles || []).length
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
