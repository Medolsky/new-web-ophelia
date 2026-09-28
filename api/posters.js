const path = require('path');
const fs = require('fs');
const defaultDb = require('../data/db.json');
const { supabase, isConfigured, uploadImage, deleteImage, seedInitialData } = require('./lib/supabase');
const { isAuthenticated } = require('./lib/auth');
const { parseMultipart } = require('./lib/multer-helper');

const DATA_DIR = process.env.VERCEL ? '/tmp/data' : path.join(__dirname, '..', 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

function getFallbackDb() {
    try {
        if (fs.existsSync(DB_FILE)) {
            return JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
        }
    } catch (e) {}
    return JSON.parse(JSON.stringify(defaultDb));
}

function saveFallbackDb(db) {
    try {
        if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
        fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
    } catch (e) {
        console.warn('[Fallback DB] Save error:', e.message);
    }
}

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Determine ID from URL query (/api/posters?id=xxx or /api/posters/[id])
    const id = req.query && req.query.id ? req.query.id : null;

    // ---------------- GET (All or Single) ----------------
    if (req.method === 'GET') {
        try {
            if (isConfigured) {
                await seedInitialData();
                const { data, error } = await supabase
                    .from('posters')
                    .select('*')
                    .order('created_at', { ascending: false });

                if (error) throw error;

                // Map Supabase column names to frontend camelCase
                const posters = (data || []).map(p => ({
                    id: p.id,
                    title: p.title,
                    description: p.description || '',
                    category: p.category || 'EVENT',
                    imageUrl: p.image_url || 'asset/img/logo-3d.png',
                    createdAt: p.created_at
                }));

                res.setHeader('Cache-Control', 's-maxage=10, stale-while-revalidate=30');
                return res.status(200).json(posters);
            }

            // Fallback to local / memory db
            const db = getFallbackDb();
            const posters = [...(db.posters || [])].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            return res.status(200).json(posters);
        } catch (err) {
            console.error('[GET Posters Error]:', err.message);
            const db = getFallbackDb();
            return res.status(200).json(db.posters || []);
        }
    }

    // ---------------- AUTH CHECK FOR WRITE METHODS ----------------
    if (!isAuthenticated(req)) {
        return res.status(401).json({ success: false, message: 'Akses ditolak: Token autentikasi admin tidak valid.' });
    }

    // ---------------- POST (Create) ----------------
    if (req.method === 'POST') {
        try {
            // Parse multipart body if sent via FormData
            if (req.headers['content-type'] && req.headers['content-type'].includes('multipart/form-data')) {
                await parseMultipart(req, res, 'image');
            }

            const { title, description, category, directImageUrl } = req.body || {};
            if (!title || !title.trim()) {
                return res.status(400).json({ success: false, message: 'Judul poster wajib diisi.' });
            }

            let imageUrl = 'asset/img/logo-3d.png';

            // Handle image upload
            if (req.file) {
                if (isConfigured) {
                    imageUrl = await uploadImage(req.file.buffer, req.file.originalname, req.file.mimetype, 'posters');
                } else {
                    // In-memory base64 fallback when cloud storage is not connected
                    const b64 = req.file.buffer.toString('base64');
                    imageUrl = `data:${req.file.mimetype || 'image/jpeg'};base64,${b64}`;
                }
            } else if (directImageUrl && directImageUrl.trim()) {
                imageUrl = directImageUrl.trim();
            }

            const newPoster = {
                id: 'poster_' + Date.now(),
                title: title.trim(),
                description: (description || '').trim(),
                category: (category || 'EVENT').toUpperCase().trim(),
                imageUrl,
                createdAt: new Date().toISOString()
            };

            if (isConfigured) {
                const { error } = await supabase.from('posters').insert({
                    id: newPoster.id,
                    title: newPoster.title,
                    description: newPoster.description,
                    category: newPoster.category,
                    image_url: newPoster.imageUrl,
                    created_at: newPoster.createdAt
                });
                if (error) throw error;
            } else {
                const db = getFallbackDb();
                if (!Array.isArray(db.posters)) db.posters = [];
                db.posters.unshift(newPoster);
                saveFallbackDb(db);
            }

            return res.status(201).json({ success: true, poster: newPoster });
        } catch (err) {
            console.error('[POST Poster Error]:', err);
            return res.status(500).json({ success: false, message: err.message || 'Gagal menyimpan poster.' });
        }
    }

    // ---------------- PUT (Update) ----------------
    if (req.method === 'PUT') {
        try {
            if (req.headers['content-type'] && req.headers['content-type'].includes('multipart/form-data')) {
                await parseMultipart(req, res, 'image');
            }

            const targetId = id || (req.body && req.body.id);
            if (!targetId) {
                return res.status(400).json({ success: false, message: 'ID poster tidak ditemukan.' });
            }

            const { title, description, category, directImageUrl } = req.body || {};

            if (isConfigured) {
                const { data: existing, error: fetchErr } = await supabase
                    .from('posters')
                    .select('*')
                    .eq('id', targetId)
                    .single();

                if (fetchErr || !existing) {
                    return res.status(404).json({ success: false, message: 'Poster tidak ditemukan di database.' });
                }

                let imageUrl = existing.image_url;
                if (req.file) {
                    // Upload new image to Supabase Storage
                    imageUrl = await uploadImage(req.file.buffer, req.file.originalname, req.file.mimetype, 'posters');
                    // Clean up old image if stored in Supabase
                    if (existing.image_url && existing.image_url !== imageUrl) {
                        await deleteImage(existing.image_url);
                    }
                } else if (directImageUrl && directImageUrl.trim()) {
                    imageUrl = directImageUrl.trim();
                }

                const updates = {
                    title: (title || existing.title).trim(),
                    description: description !== undefined ? description.trim() : existing.description,
                    category: (category || existing.category || 'EVENT').toUpperCase().trim(),
                    image_url: imageUrl
                };

                const { error: updateErr } = await supabase
                    .from('posters')
                    .update(updates)
                    .eq('id', targetId);

                if (updateErr) throw updateErr;

                return res.status(200).json({
                    success: true,
                    poster: {
                        id: targetId,
                        title: updates.title,
                        description: updates.description,
                        category: updates.category,
                        imageUrl: updates.image_url,
                        createdAt: existing.created_at
                    }
                });
            } else {
                // Local / memory fallback
                const db = getFallbackDb();
                const index = (db.posters || []).findIndex(p => p.id === targetId);
                if (index === -1) {
                    return res.status(404).json({ success: false, message: 'Poster tidak ditemukan.' });
                }

                let imageUrl = db.posters[index].imageUrl;
                if (req.file) {
                    const b64 = req.file.buffer.toString('base64');
                    imageUrl = `data:${req.file.mimetype || 'image/jpeg'};base64,${b64}`;
                } else if (directImageUrl && directImageUrl.trim()) {
                    imageUrl = directImageUrl.trim();
                }

                db.posters[index] = {
                    ...db.posters[index],
                    title: (title || db.posters[index].title).trim(),
                    description: description !== undefined ? description.trim() : db.posters[index].description,
                    category: (category || db.posters[index].category || 'EVENT').toUpperCase().trim(),
                    imageUrl
                };

                saveFallbackDb(db);
                return res.status(200).json({ success: true, poster: db.posters[index] });
            }
        } catch (err) {
            console.error('[PUT Poster Error]:', err);
            return res.status(500).json({ success: false, message: err.message || 'Gagal memperbarui poster.' });
        }
    }

    // ---------------- DELETE ----------------
    if (req.method === 'DELETE') {
        try {
            const targetId = id || (req.body && req.body.id);
            if (!targetId) {
                return res.status(400).json({ success: false, message: 'ID poster yang akan dihapus tidak ditentukan.' });
            }

            if (isConfigured) {
                const { data: existing } = await supabase
                    .from('posters')
                    .select('image_url')
                    .eq('id', targetId)
                    .single();

                if (existing && existing.image_url) {
                    await deleteImage(existing.image_url);
                }

                const { error } = await supabase.from('posters').delete().eq('id', targetId);
                if (error) throw error;

                return res.status(200).json({ success: true, message: 'Poster berhasil dihapus.' });
            } else {
                const db = getFallbackDb();
                const index = (db.posters || []).findIndex(p => p.id === targetId);
                if (index === -1) {
                    return res.status(404).json({ success: false, message: 'Poster tidak ditemukan.' });
                }
                db.posters.splice(index, 1);
                saveFallbackDb(db);
                return res.status(200).json({ success: true, message: 'Poster berhasil dihapus.' });
            }
        } catch (err) {
            console.error('[DELETE Poster Error]:', err);
            return res.status(500).json({ success: false, message: err.message || 'Gagal menghapus poster.' });
        }
    }

    return res.status(405).json({ success: false, message: 'Method not allowed' });
};
