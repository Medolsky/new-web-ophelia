const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

// Setup Directories
const UPLOADS_DIR = path.join(__dirname, 'uploads');
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

// Admin Credentials
const ADMIN_USERNAME = process.env.ADMIN_USER || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'ophelia2026';
const ACTIVE_TOKENS = new Set();

// Seed initial database if empty
function initializeDB() {
    if (!fs.existsSync(DB_FILE)) {
        const seedData = {
            posters: [
                {
                    id: 'poster_1',
                    title: 'Grand Launching Ophelia City',
                    description: 'Poster resmi peresmian kota Ophelia Roleplay dengan sistem custom dan ekonomi stabil.',
                    imageUrl: 'asset/img/logo-3d.png',
                    category: 'EVENT',
                    createdAt: new Date(Date.now() - 86400000 * 3).toISOString()
                },
                {
                    id: 'poster_2',
                    title: 'Open Recruitment: Polisi & EMS',
                    description: 'Pendaftaran terbuka instansi kepolisian dan medis kota Ophelia Roleplay.',
                    imageUrl: 'asset/img/logo-kota.png',
                    category: 'RECRUITMENT',
                    createdAt: new Date(Date.now() - 86400000 * 2).toISOString()
                },
                {
                    id: 'poster_3',
                    title: 'Car Meet & Drift Championship',
                    description: 'Kompetisi modifikasi mobil dan adu kecepatan di Los Santos Airport.',
                    imageUrl: 'asset/img/logo-3d.png',
                    category: 'COMMUNITY',
                    createdAt: new Date(Date.now() - 86400000).toISOString()
                }
            ],
            articles: [
                {
                    id: 'article_1',
                    title: 'Pembaruan Fitur Framework v2.4 & Optimalisasi FPS Kota',
                    category: 'PATCH NOTES',
                    author: 'Developer Team',
                    coverUrl: 'asset/img/logo-3d.png',
                    excerpt: 'Simak rangkuman pembaharuan script custom pekerjaan, optimalisasi handling mobil, dan peningkatan kestabilan server.',
                    content: 'Warga Ophelia Roleplay yang terhormat,\n\nKami dengan bangga merilis pembaruan v2.4 yang difokuskan pada peningkatan performa dan kenyamanan bermain:\n\n1. Optimalisasi Script Core: Pengurangan lag spike dan latensi FiveM hingga 35%.\n2. Modifikasi Kendaraan: Penyeimbangan handling mobil sport, SUV dinas kepolisian, dan ambulans.\n3. Fitur Pekerjaan Baru: Penambahan variasi pekerjaan legal dan perluasan interaksi pedagang pasar.\n4. Sistem Keamanan Kota: Pengetatan integrasi Anti-Cheat dan proteksi cyber kota.\n\nSelamat menikmati petualangan roleplay yang lebih imersif dan kompetitif di Ophelia!',
                    createdAt: new Date(Date.now() - 86400000 * 3).toISOString()
                },
                {
                    id: 'article_2',
                    title: 'Panduan Menjadi Warga Baru & Aturan Roleplay Ophelia',
                    category: 'GUIDE',
                    author: 'Head Admin',
                    coverUrl: 'asset/img/logo-kota.png',
                    excerpt: 'Panduan lengkap seputar etika roleplay, istilah penting (FailRP, VDM, RDM), dan tata tertib hidup di kota Ophelia.',
                    content: 'Bagi seluruh pendatang baru di Ophelia Roleplay, perhatikan prinsip utama dalam menjaga kualitas cerita roleplay bersama:\n\n- Hormati Value of Life: Selalu hargai nyawa karakter Anda dalam setiap skenario kejahatan maupun kecelakaan.\n- No Random Death Match (RDM) & Vehicle Death Match (VDM): Dilarang melukai atau menabrak warga tanpa latar belakang roleplay yang jelas.\n- Menghormati Instansi: Hormati petugas kepolisian dan paramedis saat bertugas di TKP.\n\nCiptakan jalan cerita yang unik dan bangun reputasi karaktermu bersama komunitas kami!',
                    createdAt: new Date(Date.now() - 86400000 * 2).toISOString()
                },
                {
                    id: 'article_3',
                    title: 'Event Komunitas: Turnamen Underground & Pasar Malam',
                    category: 'EVENT',
                    author: 'Kreatif Team',
                    coverUrl: 'asset/img/logo-3d.png',
                    excerpt: 'Bersiaplah untuk festival akhir pekan dengan hadiah ratusan juta rupiah uang in-game dan gelar juara kota.',
                    content: 'Malam minggu ini Ophelia akan menggelar rangkaian event meriah:\n\n- Drag Race Championship di runway Sandy Shores.\n- Bazar Pedagang Kaki Lima di pusat kota dengan diskon makanan & merchandise khusus.\n- Konser musik live di Diamond Casino Roof.\n\nPastikan Anda mendaftarkan tim dan kendaraan terbaik Anda melalui Discord resmi Ophelia Roleplay!',
                    createdAt: new Date(Date.now() - 86400000).toISOString()
                }
            ]
        };
        fs.writeFileSync(DB_FILE, JSON.stringify(seedData, null, 2), 'utf-8');
    }
}

initializeDB();

function readDB() {
    try {
        if (fs.existsSync(DB_FILE)) {
            const raw = fs.readFileSync(DB_FILE, 'utf-8');
            return JSON.parse(raw);
        }
    } catch (e) {
        console.warn('DB read error:', e.message);
    }
    return { posters: [], articles: [] };
}

function writeDB(data) {
    try {
        fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (e) {
        console.warn('DB write warning (ephemeral/read-only):', e.message);
    }
}

// Multer Storage Configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, UPLOADS_DIR);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        const safeName = Date.now() + '-' + crypto.randomBytes(4).toString('hex') + ext;
        cb(null, safeName);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 15 * 1024 * 1024 }, // 15MB limit
    fileFilter: (req, file, cb) => {
        const allowed = /jpeg|jpg|png|webp|gif/;
        const ext = path.extname(file.originalname).toLowerCase();
        if (allowed.test(ext)) {
            cb(null, true);
        } else {
            cb(new Error('Hanya file gambar (PNG, JPG, WEBP, GIF) yang diperbolehkan!'));
        }
    }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve Static Files
app.use(express.static(path.join(__dirname)));
app.use('/uploads', express.static(UPLOADS_DIR));

// Authentication Middleware
function requireAuth(req, res, next) {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.replace('Bearer ', '').trim();
    if (!token || !ACTIVE_TOKENS.has(token)) {
        return res.status(401).json({ success: false, message: 'Akses ditolak: Silakan login terlebih dahulu.' });
    }
    next();
}

// ================= API ROUTES =================

// Auth: Login
app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        const token = crypto.randomBytes(32).toString('hex');
        ACTIVE_TOKENS.add(token);
        return res.json({
            success: true,
            token,
            user: { username: ADMIN_USERNAME, role: 'Administrator' }
        });
    }
    return res.status(401).json({ success: false, message: 'Username atau password admin salah!' });
});

// Auth: Verify Token
app.get('/api/auth/verify', (req, res) => {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.replace('Bearer ', '').trim();
    if (token && ACTIVE_TOKENS.has(token)) {
        return res.json({ valid: true, user: { username: ADMIN_USERNAME, role: 'Administrator' } });
    }
    return res.status(401).json({ valid: false });
});

// Auth: Logout
app.post('/api/auth/logout', (req, res) => {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.replace('Bearer ', '').trim();
    if (token) ACTIVE_TOKENS.delete(token);
    res.json({ success: true });
});

// Stats: Overview
app.get('/api/stats', (req, res) => {
    const db = readDB();
    res.json({
        postersCount: db.posters.length,
        articlesCount: db.articles.length
    });
});

// ---------------- CFX REALTIME SERVER STATUS ----------------
const CFX_CODE = 'zjjmbx5';
let cfxCache = {
    data: null,
    timestamp: 0
};
const CFX_CACHE_TTL = 15000; // 15 seconds cache

app.get('/api/server-status', async (req, res) => {
    const now = Date.now();
    if (cfxCache.data && (now - cfxCache.timestamp < CFX_CACHE_TTL)) {
        return res.json(cfxCache.data);
    }

    try {
        const https = require('https');
        const cfxUrl = `https://frontend.cfx-services.net/api/servers/single/${CFX_CODE}`;
        
        const fetchCfx = () => new Promise((resolve, reject) => {
            const request = https.get(cfxUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'application/json'
                },
                timeout: 6000
            }, (response) => {
                if (response.statusCode < 200 || response.statusCode >= 300) {
                    return reject(new Error(`CFX API returned status ${response.statusCode}`));
                }
                let raw = '';
                response.on('data', chunk => raw += chunk);
                response.on('end', () => {
                    try {
                        resolve(JSON.parse(raw));
                    } catch (e) {
                        reject(e);
                    }
                });
            });

            request.on('error', reject);
            request.on('timeout', () => {
                request.destroy();
                reject(new Error('CFX API request timed out'));
            });
        });

        const json = await fetchCfx();
        const serverData = json.Data || {};
        const clients = typeof serverData.clients === 'number' ? serverData.clients : 0;
        const maxClients = serverData.sv_maxclients || serverData.svMaxclients || 1000;
        const hostname = serverData.hostname || 'OPHELIA ROLEPLAY';

        const result = {
            online: true,
            clients,
            maxClients,
            hostname,
            cfxCode: CFX_CODE,
            connectUrl: `https://cfx.re/join/${CFX_CODE}`,
            updatedAt: new Date().toISOString()
        };

        cfxCache = {
            data: result,
            timestamp: now
        };

        return res.json(result);
    } catch (err) {
        console.warn('[CFX Status Error]:', err.message);
        if (cfxCache.data) {
            return res.json(cfxCache.data);
        }
        return res.json({
            online: false,
            clients: 0,
            maxClients: 1000,
            hostname: 'OPHELIA ROLEPLAY',
            cfxCode: CFX_CODE,
            connectUrl: `https://cfx.re/join/${CFX_CODE}`,
            error: err.message
        });
    }
});

// ---------------- POSTERS CRUD ----------------

// GET all posters
app.get('/api/posters', (req, res) => {
    const db = readDB();
    const sorted = [...db.posters].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(sorted);
});

// POST create poster
app.post('/api/posters', requireAuth, upload.single('image'), (req, res) => {
    try {
        const { title, description, category, directImageUrl } = req.body;
        if (!title) {
            return res.status(400).json({ success: false, message: 'Judul poster wajib diisi.' });
        }

        let imageUrl = '';
        if (req.file) {
            imageUrl = 'uploads/' + req.file.filename;
        } else if (directImageUrl) {
            imageUrl = directImageUrl;
        } else {
            imageUrl = 'asset/img/logo-3d.png';
        }

        const db = readDB();
        const newPoster = {
            id: 'poster_' + Date.now(),
            title: title.trim(),
            description: (description || '').trim(),
            category: (category || 'EVENT').toUpperCase().trim(),
            imageUrl,
            createdAt: new Date().toISOString()
        };

        db.posters.unshift(newPoster);
        writeDB(db);

        res.status(201).json({ success: true, poster: newPoster });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// PUT update poster
app.put('/api/posters/:id', requireAuth, upload.single('image'), (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, category, directImageUrl } = req.body;
        const db = readDB();
        const index = db.posters.findIndex(p => p.id === id);

        if (index === -1) {
            return res.status(404).json({ success: false, message: 'Poster tidak ditemukan.' });
        }

        const existing = db.posters[index];
        let imageUrl = existing.imageUrl;

        if (req.file) {
            // Delete old uploaded file if local
            if (existing.imageUrl && existing.imageUrl.startsWith('uploads/')) {
                const oldPath = path.join(__dirname, existing.imageUrl);
                if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
            }
            imageUrl = 'uploads/' + req.file.filename;
        } else if (directImageUrl) {
            imageUrl = directImageUrl;
        }

        const updated = {
            ...existing,
            title: title ? title.trim() : existing.title,
            description: description !== undefined ? description.trim() : existing.description,
            category: category ? category.toUpperCase().trim() : existing.category,
            imageUrl,
            updatedAt: new Date().toISOString()
        };

        db.posters[index] = updated;
        writeDB(db);

        res.json({ success: true, poster: updated });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// DELETE poster
app.delete('/api/posters/:id', requireAuth, (req, res) => {
    try {
        const { id } = req.params;
        const db = readDB();
        const index = db.posters.findIndex(p => p.id === id);

        if (index === -1) {
            return res.status(404).json({ success: false, message: 'Poster tidak ditemukan.' });
        }

        const [deleted] = db.posters.splice(index, 1);
        if (deleted.imageUrl && deleted.imageUrl.startsWith('uploads/')) {
            const filePath = path.join(__dirname, deleted.imageUrl);
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        }

        writeDB(db);
        res.json({ success: true, message: 'Poster berhasil dihapus.' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ---------------- ARTICLES CRUD ----------------

// GET all articles
app.get('/api/articles', (req, res) => {
    const db = readDB();
    const sorted = [...db.articles].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(sorted);
});

// GET single article
app.get('/api/articles/:id', (req, res) => {
    const db = readDB();
    const article = db.articles.find(a => a.id === req.params.id);
    if (!article) return res.status(404).json({ success: false, message: 'Artikel tidak ditemukan.' });
    res.json(article);
});

// POST create article
app.post('/api/articles', requireAuth, upload.single('coverImage'), (req, res) => {
    try {
        const { title, category, author, excerpt, content, directCoverUrl } = req.body;
        if (!title || !content) {
            return res.status(400).json({ success: false, message: 'Judul dan isi artikel wajib diisi.' });
        }

        let coverUrl = '';
        if (req.file) {
            coverUrl = 'uploads/' + req.file.filename;
        } else if (directCoverUrl) {
            coverUrl = directCoverUrl;
        } else {
            coverUrl = 'asset/img/logo-3d.png';
        }

        const db = readDB();
        const newArticle = {
            id: 'article_' + Date.now(),
            title: title.trim(),
            category: (category || 'BERITA').toUpperCase().trim(),
            author: (author || 'Ophelia Staff').trim(),
            excerpt: (excerpt || content.slice(0, 140) + '...').trim(),
            content: content.trim(),
            coverUrl,
            createdAt: new Date().toISOString()
        };

        db.articles.unshift(newArticle);
        writeDB(db);

        res.status(201).json({ success: true, article: newArticle });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// PUT update article
app.put('/api/articles/:id', requireAuth, upload.single('coverImage'), (req, res) => {
    try {
        const { id } = req.params;
        const { title, category, author, excerpt, content, directCoverUrl } = req.body;
        const db = readDB();
        const index = db.articles.findIndex(a => a.id === id);

        if (index === -1) {
            return res.status(404).json({ success: false, message: 'Artikel tidak ditemukan.' });
        }

        const existing = db.articles[index];
        let coverUrl = existing.coverUrl;

        if (req.file) {
            if (existing.coverUrl && existing.coverUrl.startsWith('uploads/')) {
                const oldPath = path.join(__dirname, existing.coverUrl);
                if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
            }
            coverUrl = 'uploads/' + req.file.filename;
        } else if (directCoverUrl) {
            coverUrl = directCoverUrl;
        }

        const updated = {
            ...existing,
            title: title ? title.trim() : existing.title,
            category: category ? category.toUpperCase().trim() : existing.category,
            author: author ? author.trim() : existing.author,
            excerpt: excerpt ? excerpt.trim() : existing.excerpt,
            content: content ? content.trim() : existing.content,
            coverUrl,
            updatedAt: new Date().toISOString()
        };

        db.articles[index] = updated;
        writeDB(db);

        res.json({ success: true, article: updated });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// DELETE article
app.delete('/api/articles/:id', requireAuth, (req, res) => {
    try {
        const { id } = req.params;
        const db = readDB();
        const index = db.articles.findIndex(a => a.id === id);

        if (index === -1) {
            return res.status(404).json({ success: false, message: 'Artikel tidak ditemukan.' });
        }

        const [deleted] = db.articles.splice(index, 1);
        if (deleted.coverUrl && deleted.coverUrl.startsWith('uploads/')) {
            const filePath = path.join(__dirname, deleted.coverUrl);
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        }

        writeDB(db);
        res.json({ success: true, message: 'Artikel berhasil dihapus.' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Fallback to index.html for client routes
app.use((req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Start Server (only listen when not running in serverless environment like Vercel)
if (!process.env.VERCEL) {
    app.listen(PORT, () => {
        console.log(`[OPHELIA SERVER] Running at http://localhost:${PORT}`);
        console.log(`[OPHELIA SERVER] Admin Panel available at http://localhost:${PORT}/admin.html`);
    });
}

module.exports = app;
