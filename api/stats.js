const defaultDb = require('../data/db.json');
const path = require('path');
const fs = require('fs');

module.exports = (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        let db = defaultDb;
        const tmpDbPath = '/tmp/data/db.json';
        if (fs.existsSync(tmpDbPath)) {
            try {
                db = JSON.parse(fs.readFileSync(tmpDbPath, 'utf-8'));
            } catch (e) {}
        }
        res.status(200).json({
            postersCount: (db.posters || []).length,
            articlesCount: (db.articles || []).length
        });
    } catch (err) {
        res.status(200).json({
            postersCount: (defaultDb.posters || []).length,
            articlesCount: (defaultDb.articles || []).length
        });
    }
};
