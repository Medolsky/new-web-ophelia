const defaultDb = require('../data/db.json');
const path = require('path');
const fs = require('fs');
const { supabase, isConfigured } = require('./lib/supabase');

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        if (isConfigured) {
            const [postersRes, articlesRes] = await Promise.all([
                supabase.from('posters').select('*', { count: 'exact', head: true }),
                supabase.from('articles').select('*', { count: 'exact', head: true })
            ]);

            return res.status(200).json({
                postersCount: typeof postersRes.count === 'number' ? postersRes.count : (defaultDb.posters || []).length,
                articlesCount: typeof articlesRes.count === 'number' ? articlesRes.count : (defaultDb.articles || []).length,
                database: 'supabase'
            });
        }

        let db = defaultDb;
        const tmpDbPath = '/tmp/data/db.json';
        if (fs.existsSync(tmpDbPath)) {
            try {
                db = JSON.parse(fs.readFileSync(tmpDbPath, 'utf-8'));
            } catch (e) {}
        }
        res.status(200).json({
            postersCount: (db.posters || []).length,
            articlesCount: (db.articles || []).length,
            database: 'local-fallback'
        });
    } catch (err) {
        res.status(200).json({
            postersCount: (defaultDb.posters || []).length,
            articlesCount: (defaultDb.articles || []).length,
            database: 'fallback'
        });
    }
};
