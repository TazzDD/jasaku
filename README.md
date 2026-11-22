# JASAKU — Multi-Service & Rental Marketplace (Next.js + Supabase)

## Status
Sudah ada: fondasi Next.js, database + RLS, auth (daftar/masuk/keluar, verifikasi email, proteksi route), homepage, katalog (search/filter/sort/pagination).
Sudah juga: detail layanan, booking (jasa & rental), pesanan customer, dashboard provider dasar (buat layanan, terima/tolak pesanan).
Sudah juga: dashboard admin (ringkasan, review/terbitkan/unggulkan layanan, kategori, status pengguna, laporan).
Sudah juga: edit/arsip layanan dan upload gambar (maks. 6 gambar, 5 MB, JPG/PNG/WebP, signature file dicek di server).
Sudah juga: chat realtime customer–provider (jalankan juga migrasi 002), notifikasi pesan otomatis (belum ada UI daftar notifikasi).
Sudah juga: review & rating (hanya booking selesai, 1 per booking, balasan provider), favorit, daftar notifikasi + lonceng di navbar.
Sudah juga: laporkan/blokir, halaman syarat/privasi/keamanan, lupa+reset password, menu hamburger mobile, loading/error/404, jadwal provider, admin booking & review.
Uji RLS: `supabase/tests/rls_checks.sql`.
Belum ada: jadwal, chat, review, upload gambar, sitemap. Kode ini BELUM diuji dijalankan.

## Setup lokal (gratis)
1. `npm install`
2. Buat project di supabase.com (Free). Jalankan `supabase/migrations/001_init_schema_rls_seed.sql` di SQL Editor.
3. Supabase > Authentication > URL Configuration: Site URL `http://localhost:3000`, Redirect URL `http://localhost:3000/auth/callback`.
4. `cp .env.example .env.local`, isi URL dan anon key (Settings > API).
5. `npm run dev`
6. Jadikan admin (SQL Editor): `insert into user_roles(user_id,role) select id,'admin' from profiles where email='emailanda@contoh.com';`

## Deploy gratis
- Cloudflare Workers + OpenNext: `npx wrangler login`, lalu `npm run cf:deploy`. Isi env var di dashboard Cloudflare. Plan Free membatasi ukuran Worker (3 MiB terkompresi); build bisa gagal jika melebihi.
- Alternatif gratis: Vercel Hobby (hanya non-komersial).

## Batas free tier
Supabase Free: project di-pause jika tidak aktif sekitar 7 hari, DB 500 MB, storage 1 GB. Pantau di dashboard masing-masing.

## Admin pertama
Daftar lewat aplikasi, lalu di SQL Editor jalankan baris `insert into user_roles ... 'admin'` (lihat langkah 6). Buka `/admin` untuk menerbitkan layanan.
