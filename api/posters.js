const defaultDb = require('../data/db.json');
const path = require('path');
const fs = require('fs');

module.exports = (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=60');

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
        res.status(200).json(db.posters || []);
    } catch (err) {
        res.status(200).json(defaultDb.posters || []);
    }
};
