const { createClient } = require('@supabase/supabase-js');
const defaultDb = require('../../data/db.json');

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 
    process.env.SUPABASE_KEY || 
    process.env.SUPABASE_ANON_KEY || 
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let supabase = null;
if (supabaseUrl && supabaseKey) {
    supabase = createClient(supabaseUrl, supabaseKey, {
        auth: { persistSession: false }
    });
}

const BUCKET_NAME = 'ophelia-media';

/**
 * Upload an image buffer to Supabase Storage
 * Returns public URL of uploaded file
 */
async function uploadImage(fileBuffer, originalName, mimeType, folder = 'posters') {
    if (!supabase) {
        throw new Error('Supabase client not configured.');
    }

    const ext = (originalName && originalName.includes('.')) 
        ? originalName.split('.').pop().toLowerCase() 
        : (mimeType === 'image/png' ? 'png' : mimeType === 'image/webp' ? 'webp' : 'jpg');
    const cleanName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;
    const filePath = `${folder}/${cleanName}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, fileBuffer, {
            contentType: mimeType || 'image/jpeg',
            cacheControl: '3600',
            upsert: true
        });

    if (error) {
        throw new Error(`Gagal upload ke Supabase Storage: ${error.message}`);
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(filePath);

    return publicUrlData.publicUrl;
}

/**
 * Delete image from Supabase Storage if it's hosted there
 */
async function deleteImage(imageUrl) {
    if (!supabase || !imageUrl) return;
    try {
        if (imageUrl.includes(`/storage/v1/object/public/${BUCKET_NAME}/`)) {
            const path = imageUrl.split(`/storage/v1/object/public/${BUCKET_NAME}/`)[1];
            if (path) {
                await supabase.storage.from(BUCKET_NAME).remove([decodeURIComponent(path)]);
            }
        }
    } catch (e) {
        console.warn('[Supabase Storage] Delete error:', e.message);
    }
}

/**
 * Seed initial data if tables are empty
 */
let hasSeeded = false;
async function seedInitialData() {
    if (!supabase || hasSeeded) return;
    try {
        hasSeeded = true;
        // Check posters
        const { count: posterCount, error: pErr } = await supabase
            .from('posters')
            .select('*', { count: 'exact', head: true });

        if (!pErr && posterCount === 0 && Array.isArray(defaultDb.posters) && defaultDb.posters.length > 0) {
            const formattedPosters = defaultDb.posters.map(p => ({
                id: p.id,
                title: p.title,
                description: p.description || '',
                category: p.category || 'EVENT',
                image_url: p.imageUrl || 'asset/img/logo-3d.png',
                created_at: p.createdAt || new Date().toISOString()
            }));
            await supabase.from('posters').insert(formattedPosters);
            console.log('[Supabase] Initial posters seeded successfully.');
        }

        // Check articles
        const { count: articleCount, error: aErr } = await supabase
            .from('articles')
            .select('*', { count: 'exact', head: true });

        if (!aErr && articleCount === 0 && Array.isArray(defaultDb.articles) && defaultDb.articles.length > 0) {
            const formattedArticles = defaultDb.articles.map(a => ({
                id: a.id,
                title: a.title,
                category: a.category || 'UPDATE',
                author: a.author || 'Admin Ophelia',
                read_time: a.readTime || '3 MIN',
                excerpt: a.excerpt || '',
                content: a.content || '',
                cover_url: a.coverUrl || 'asset/img/logo-kota.png',
                created_at: a.createdAt || new Date().toISOString()
            }));
            await supabase.from('articles').insert(formattedArticles);
            console.log('[Supabase] Initial articles seeded successfully.');
        }
    } catch (e) {
        console.warn('[Supabase] Seeding warning:', e.message);
    }
}

module.exports = {
    supabase,
    isConfigured: !!supabase,
    uploadImage,
    deleteImage,
    seedInitialData
};
