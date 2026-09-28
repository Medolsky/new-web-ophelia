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

function getRequestId(req) {
    if (req.query && req.query.id && req.query.id !== '[id]' && req.query.id !== '[id].js') {
        return String(req.query.id).trim();
    }
    if (req.body && req.body.id) {
        return String(req.body.id).trim();
    }
    if (req.url) {
        const urlPart = req.url.split('?')[0];
        const segments = urlPart.split('/').filter(Boolean);
        const last = segments[segments.length - 1];
        if (last && last !== 'articles' && last !== '[id]' && last !== '[id].js' && !last.endsWith('.js')) {
            return decodeURIComponent(last).trim();
        }
        if (req.url.includes('?')) {
            const queryParams = new URLSearchParams(req.url.split('?')[1]);
            const qId = queryParams.get('id');
            if (qId && qId !== '[id]' && qId !== '[id].js') return qId.trim();
        }
    }
    return null;
}

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const id = getRequestId(req);

    // ---------------- GET (All or Single) ----------------
    if (req.method === 'GET') {
        try {
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

            if (isConfigured) {
                if (id) {
                    const { data: single, error: sErr } = await supabase
                        .from('articles')
                        .select('*')
                        .eq('id', id)
                        .maybeSingle();

                    if (sErr) throw sErr;
                    if (!single) return res.status(404).json({ success: false, message: 'Artikel tidak ditemukan.' });

                    return res.status(200).json({
                        id: single.id,
                        title: single.title,
                        category: single.category || 'UPDATE',
                        author: single.author || 'Admin Ophelia',
                        readTime: single.read_time || '3 MIN',
                        excerpt: single.excerpt || '',
                        content: single.content || '',
                        coverUrl: single.cover_url || 'asset/img/logo-kota.png',
                        createdAt: single.created_at
                    });
                }

                const { data, error } = await supabase
                    .from('articles')
                    .select('*')
                    .order('created_at', { ascending: false });

                if (error) throw error;

                const articles = (data || []).map(a => ({
                    id: a.id,
                    title: a.title,
                    category: a.category || 'UPDATE',
                    author: a.author || 'Admin Ophelia',
                    readTime: a.read_time || '3 MIN',
                    excerpt: a.excerpt || '',
                    content: a.content || '',
                    coverUrl: a.cover_url || 'asset/img/logo-kota.png',
                    createdAt: a.created_at
                }));

                return res.status(200).json(articles);
            }

            const db = getFallbackDb();
            const articles = [...(db.articles || [])].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            return res.status(200).json(articles);
        } catch (err) {
            console.error('[GET Articles Error]:', err.message);
            const db = getFallbackDb();
            return res.status(200).json(db.articles || []);
        }
    }

    // ---------------- AUTH CHECK FOR WRITE METHODS ----------------
    if (!isAuthenticated(req)) {
        return res.status(401).json({ success: false, message: 'Akses ditolak: Token autentikasi admin tidak valid.' });
    }

    // ---------------- POST (Create) ----------------
    if (req.method === 'POST') {
        try {
            if (req.headers['content-type'] && req.headers['content-type'].includes('multipart/form-data')) {
                await parseMultipart(req, res, 'coverImage');
            }

            const { title, category, author, excerpt, content, directCoverUrl } = req.body || {};
            if (!title || !title.trim()) {
                return res.status(400).json({ success: false, message: 'Judul artikel wajib diisi.' });
            }

            let coverUrl = 'asset/img/logo-kota.png';

            if (req.file) {
                if (isConfigured) {
                    coverUrl = await uploadImage(req.file.buffer, req.file.originalname, req.file.mimetype, 'articles');
                } else {
                    const b64 = req.file.buffer.toString('base64');
                    coverUrl = `data:${req.file.mimetype || 'image/jpeg'};base64,${b64}`;
                }
            } else if (directCoverUrl && directCoverUrl.trim()) {
                coverUrl = directCoverUrl.trim();
            }

            const wordCount = (content || '').trim().split(/\s+/).filter(Boolean).length;
            const readTime = Math.max(1, Math.ceil(wordCount / 200)) + ' MIN';

            const newArticle = {
                id: 'art_' + Date.now(),
                title: title.trim(),
                category: (category || 'UPDATE').toUpperCase().trim(),
                author: (author || 'Admin Ophelia').trim(),
                readTime,
                excerpt: (excerpt || '').trim(),
                content: (content || '').trim(),
                coverUrl,
                createdAt: new Date().toISOString()
            };

            if (isConfigured) {
                const { error } = await supabase.from('articles').insert({
                    id: newArticle.id,
                    title: newArticle.title,
                    category: newArticle.category,
                    author: newArticle.author,
                    read_time: newArticle.readTime,
                    excerpt: newArticle.excerpt,
                    content: newArticle.content,
                    cover_url: newArticle.coverUrl,
                    created_at: newArticle.createdAt
                });
                if (error) throw error;
            } else {
                const db = getFallbackDb();
                if (!Array.isArray(db.articles)) db.articles = [];
                db.articles.unshift(newArticle);
                saveFallbackDb(db);
            }

            return res.status(201).json({ success: true, article: newArticle });
        } catch (err) {
            console.error('[POST Article Error]:', err);
            return res.status(500).json({ success: false, message: err.message || 'Gagal menyimpan artikel.' });
        }
    }

    // ---------------- PUT (Update) ----------------
    if (req.method === 'PUT') {
        try {
            if (req.headers['content-type'] && req.headers['content-type'].includes('multipart/form-data')) {
                await parseMultipart(req, res, 'coverImage');
            }

            const targetId = id || (req.body && req.body.id);
            if (!targetId) {
                return res.status(400).json({ success: false, message: 'ID artikel tidak ditemukan.' });
            }

            const { title, category, author, excerpt, content, directCoverUrl } = req.body || {};

            if (isConfigured) {
                const { data: existing, error: fetchErr } = await supabase
                    .from('articles')
                    .select('*')
                    .eq('id', targetId)
                    .maybeSingle();

                if (fetchErr) throw fetchErr;
                if (!existing) {
                    return res.status(404).json({ success: false, message: `Artikel dengan ID "${targetId}" tidak ditemukan di database.` });
                }

                let coverUrl = existing.cover_url;
                if (req.file) {
                    coverUrl = await uploadImage(req.file.buffer, req.file.originalname, req.file.mimetype, 'articles');
                    if (existing.cover_url && existing.cover_url !== coverUrl) {
                        await deleteImage(existing.cover_url);
                    }
                } else if (directCoverUrl && directCoverUrl.trim()) {
                    coverUrl = directCoverUrl.trim();
                }

                const updatedContent = content !== undefined ? content.trim() : existing.content;
                const wordCount = (updatedContent || '').split(/\s+/).filter(Boolean).length;
                const readTime = Math.max(1, Math.ceil(wordCount / 200)) + ' MIN';

                const updates = {
                    title: (title || existing.title).trim(),
                    category: (category || existing.category || 'UPDATE').toUpperCase().trim(),
                    author: (author || existing.author || 'Admin Ophelia').trim(),
                    read_time: readTime,
                    excerpt: excerpt !== undefined ? excerpt.trim() : existing.excerpt,
                    content: updatedContent,
                    cover_url: coverUrl
                };

                const { error: updateErr } = await supabase
                    .from('articles')
                    .update(updates)
                    .eq('id', targetId);

                if (updateErr) throw updateErr;

                return res.status(200).json({
                    success: true,
                    article: {
                        id: targetId,
                        title: updates.title,
                        category: updates.category,
                        author: updates.author,
                        readTime: updates.read_time,
                        excerpt: updates.excerpt,
                        content: updates.content,
                        coverUrl: updates.cover_url,
                        createdAt: existing.created_at
                    }
                });
            } else {
                const db = getFallbackDb();
                const index = (db.articles || []).findIndex(a => a.id === targetId);
                if (index === -1) {
                    return res.status(404).json({ success: false, message: 'Artikel tidak ditemukan.' });
                }

                let coverUrl = db.articles[index].coverUrl;
                if (req.file) {
                    const b64 = req.file.buffer.toString('base64');
                    coverUrl = `data:${req.file.mimetype || 'image/jpeg'};base64,${b64}`;
                } else if (directCoverUrl && directCoverUrl.trim()) {
                    coverUrl = directCoverUrl.trim();
                }

                const updatedContent = content !== undefined ? content.trim() : db.articles[index].content;
                const wordCount = (updatedContent || '').split(/\s+/).filter(Boolean).length;
                const readTime = Math.max(1, Math.ceil(wordCount / 200)) + ' MIN';

                db.articles[index] = {
                    ...db.articles[index],
                    title: (title || db.articles[index].title).trim(),
                    category: (category || db.articles[index].category || 'UPDATE').toUpperCase().trim(),
                    author: (author || db.articles[index].author || 'Admin Ophelia').trim(),
                    readTime,
                    excerpt: excerpt !== undefined ? excerpt.trim() : db.articles[index].excerpt,
                    content: updatedContent,
                    coverUrl
                };

                saveFallbackDb(db);
                return res.status(200).json({ success: true, article: db.articles[index] });
            }
        } catch (err) {
            console.error('[PUT Article Error]:', err);
            return res.status(500).json({ success: false, message: err.message || 'Gagal memperbarui artikel.' });
        }
    }

    // ---------------- DELETE ----------------
    if (req.method === 'DELETE') {
        try {
            const targetId = id || (req.body && req.body.id);
            if (!targetId) {
                return res.status(400).json({ success: false, message: 'ID artikel yang akan dihapus tidak ditentukan.' });
            }

            if (isConfigured) {
                const { data: existing, error: findErr } = await supabase
                    .from('articles')
                    .select('id, cover_url')
                    .eq('id', targetId)
                    .maybeSingle();

                if (findErr) throw findErr;
                if (!existing) {
                    return res.status(404).json({ success: false, message: `Artikel dengan ID "${targetId}" tidak ditemukan di database.` });
                }

                if (existing.cover_url) {
                    await deleteImage(existing.cover_url);
                }

                const { error: delErr } = await supabase.from('articles').delete().eq('id', targetId);
                if (delErr) throw delErr;

                return res.status(200).json({ success: true, message: 'Artikel berhasil dihapus.' });
            } else {
                const db = getFallbackDb();
                const index = (db.articles || []).findIndex(a => a.id === targetId);
                if (index === -1) {
                    return res.status(404).json({ success: false, message: 'Artikel tidak ditemukan.' });
                }
                db.articles.splice(index, 1);
                saveFallbackDb(db);
                return res.status(200).json({ success: true, message: 'Artikel berhasil dihapus.' });
            }
        } catch (err) {
            console.error('[DELETE Article Error]:', err);
            return res.status(500).json({ success: false, message: err.message || 'Gagal menghapus artikel.' });
        }
    }

    return res.status(405).json({ success: false, message: 'Method not allowed' });
};
