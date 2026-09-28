-- ==============================================================================
-- OPHELIA ROLEPLAY - SUPABASE DATABASE & STORAGE SCHEMA
-- Jalankan skrip SQL ini di Supabase Dashboard -> SQL Editor -> New Query -> Run
-- ==============================================================================

-- 1. TABEL POSTERS (POSTER & FOTO KOTA)
CREATE TABLE IF NOT EXISTS public.posters (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT DEFAULT 'EVENT',
    image_url TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TABEL ARTICLES (BERITA & ARTIKEL KOTA)
CREATE TABLE IF NOT EXISTS public.articles (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    category TEXT DEFAULT 'UPDATE',
    author TEXT DEFAULT 'Admin Ophelia',
    read_time TEXT DEFAULT '3 MIN',
    excerpt TEXT,
    content TEXT,
    cover_url TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. ENABLE ROW LEVEL SECURITY (RLS)
ALTER TABLE public.posters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;

-- 4. POLICIES: PUBLIC READ ACCESS (Semua pengunjung web bisa melihat poster & artikel)
DROP POLICY IF EXISTS "Public Read Posters" ON public.posters;
CREATE POLICY "Public Read Posters" ON public.posters FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public Read Articles" ON public.articles;
CREATE POLICY "Public Read Articles" ON public.articles FOR SELECT USING (true);

-- 5. POLICIES: FULL ACCESS (Memperbolehkan tambah, edit, dan hapus dari Backend API)
DROP POLICY IF EXISTS "Allow All Posters" ON public.posters;
CREATE POLICY "Allow All Posters" ON public.posters FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow All Articles" ON public.articles;
CREATE POLICY "Allow All Articles" ON public.articles FOR ALL USING (true) WITH CHECK (true);

-- 6. SETUP STORAGE BUCKET: ophelia-media (Untuk Upload Foto & Cover)
INSERT INTO storage.buckets (id, name, public)
VALUES ('ophelia-media', 'ophelia-media', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- STORAGE POLICIES
DROP POLICY IF EXISTS "Public Read Storage Media" ON storage.objects;
CREATE POLICY "Public Read Storage Media" ON storage.objects FOR SELECT USING (bucket_id = 'ophelia-media');

DROP POLICY IF EXISTS "Allow Upload Storage Media" ON storage.objects;
CREATE POLICY "Allow Upload Storage Media" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'ophelia-media');

DROP POLICY IF EXISTS "Allow Update Storage Media" ON storage.objects;
CREATE POLICY "Allow Update Storage Media" ON storage.objects FOR UPDATE USING (bucket_id = 'ophelia-media');

DROP POLICY IF EXISTS "Allow Delete Storage Media" ON storage.objects;
CREATE POLICY "Allow Delete Storage Media" ON storage.objects FOR DELETE USING (bucket_id = 'ophelia-media');

-- 7. SEED DATA AWAL (Opsional jika tabel masih kosong)
INSERT INTO public.posters (id, title, description, category, image_url, created_at)
VALUES 
    ('poster_1', 'Grand Launching Ophelia City', 'Poster resmi peresmian kota Ophelia Roleplay dengan sistem custom dan ekonomi stabil.', 'EVENT', 'asset/img/logo-3d.png', NOW() - INTERVAL '3 days'),
    ('poster_2', 'Open Recruitment: Polisi & EMS', 'Pendaftaran terbuka instansi kepolisian dan medis kota Ophelia Roleplay.', 'RECRUITMENT', 'asset/img/logo-kota.png', NOW() - INTERVAL '2 days'),
    ('poster_3', 'Car Meet & Drift Championship', 'Kompetisi modifikasi mobil dan adu kecepatan di Los Santos Airport.', 'COMMUNITY', 'asset/img/logo-3d.png', NOW() - INTERVAL '1 day')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.articles (id, title, category, author, read_time, excerpt, content, cover_url, created_at)
VALUES 
    ('art_1', 'Patch Notes v2.5: Pembaruan Sistem Ekonomi & Kendaraan Baru', 'PATCH NOTES', 'Lead Developer', '4 MIN', 'Simak daftar lengkap perubahan pada pembaruan server Ophelia Roleplay minggu ini.', 'Kota Ophelia Roleplay kini menghadirkan update v2.5 dengan berbagai perbaikan performa server FiveM, sistem handling kendaraan baru, dan balancing pekerjaan sipil.', 'asset/img/logo-3d.png', NOW() - INTERVAL '2 days'),
    ('art_2', 'Panduan Lengkap Memulai Roleplay Bagi Warga Baru', 'GUIDE', 'Community Manager', '6 MIN', 'Semua hal yang perlu Anda ketahui sebelum memasuki Los Santos untuk pertama kalinya.', 'Selamat datang di Ophelia Roleplay! Panduan ini dirancang untuk membantu warga baru memahami aturan roleplay (Rules & Lore), cara mendapatkan pekerjaan legal pertama, dan etika komunikasi.', 'asset/img/logo-kota.png', NOW() - INTERVAL '4 days')
ON CONFLICT (id) DO NOTHING;
