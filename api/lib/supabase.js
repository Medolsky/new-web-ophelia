const { createClient } = require('@supabase/supabase-js');
const defaultDb = require('../../data/db.json');

const DEFAULT_SUPABASE_URL = 'https://pyqeamlsglsrqbsnripz.supabase.co';
const DEFAULT_SUPABASE_KEY = 'sb_publishable_Lc5XCpjjC92ihtE095VuUg_aXOvl9Iq';

const supabaseUrl = process.env.SUPABASE_URL || 
    process.env.NEXT_PUBLIC_SUPABASE_URL || 
    DEFAULT_SUPABASE_URL;

const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 
    process.env.SUPABASE_KEY || 
    process.env.SUPABASE_ANON_KEY || 
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
    DEFAULT_SUPABASE_KEY;

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
async function seedInitialData() {
    // No-op: Data is managed directly in Supabase or seeded once via SQL script
    return;
}

module.exports = {
    supabase,
    isConfigured: !!supabase,
    uploadImage,
    deleteImage,
    seedInitialData
};
