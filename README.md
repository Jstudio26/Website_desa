# Website Kelurahan Matani Tiga

Website kelurahan: **Nuxt** di frontend, **Supabase** untuk backend (database PostgreSQL,
login admin, dan penyimpanan gambar). Target deploy: **Vercel**.

Fitur publik:

- **Profil, Data Penduduk, Potensi, Organisasi** kelurahan
- **Peta Wilayah** — batas lingkungan + titik landmark/fasilitas publik yang bisa diklik
- **Berita**, **Pengumuman**, **Galeri**
- **Layanan Surat** dan **Pengaduan** — warga mendapat kode tiket, lalu bisa **Cek Status**
- **Kontak** — info, jam pelayanan, dan form pesan

Semua konten dikelola dari `/admin`. Hanya email yang terdaftar di tabel `admins` yang bisa
mengelola konten dan melihat data warga — sekadar bisa login tidak cukup.

---

## Teknologi

| Bagian | Pilihan |
|---|---|
| Framework | Nuxt (Vue 3, TypeScript), mode kompatibilitas 4 |
| Styling | Tailwind CSS (token warna/font di `app/assets/css/main.css`) |
| Database | Supabase PostgreSQL + Row Level Security |
| Auth | Supabase Auth (email + password) via `@nuxtjs/supabase` |
| Storage | Supabase Storage, bucket publik `media` (gambar, maks. 5 MB) |
| Peta | Leaflet + OpenStreetMap; import GeoJSON / shapefile (.zip) |

Tidak ada API backend sendiri. Halaman membaca Supabase langsung; formulir publik memanggil
fungsi SQL (`ajukan_surat`, `kirim_pengaduan`, `kirim_pesan`, `cek_status`) yang memvalidasi
isian dan membatasi spam. Keamanan ditegakkan oleh RLS di `supabase/schema.sql`.
Folder `server/` hanya berisi `robots.txt`, `sitemap.xml`, endpoint keep-alive, dan polyfill WebSocket untuk Node 20.

---

## Setup lokal

1. Buat project di <https://supabase.com>.
2. **SQL Editor** → tempel seluruh isi [`supabase/schema.sql`](supabase/schema.sql) → **Run**.
   Aman dijalankan ulang; juga dipakai untuk memperbarui database lama ke skema terbaru.
3. **Authentication → Users → Add user** (centang *Auto Confirm User*), lalu daftarkan
   emailnya sebagai admin di SQL Editor:
   ```sql
   insert into public.admins (email) values ('email-admin@contoh.com') on conflict do nothing;
   ```
4. Salin `.env.example` ke `.env`, isi `SUPABASE_URL` dan `SUPABASE_KEY`
   (**Project Settings → API**: Project URL dan *anon public* key — **jangan** service_role key).
5. Jalankan:
   ```bash
   npm install
   npm run dev          # http://localhost:3000  ·  admin di /admin
   ```

| Perintah | Fungsi |
|---|---|
| `npm run dev` | Mode pengembangan |
| `npm run build` | Build produksi (`.output/`) |
| `npm run preview` | Pratinjau hasil build |
| `npm run typecheck` | Cek tipe TypeScript |
| `npm run lint` | ESLint |

Skor Lighthouse dari `npm run dev` tidak mewakili situs sebenarnya (kode belum di-minify).
Ukur dari `npm run build` → `node .output/server/index.mjs`, di jendela Incognito.

---

## Checklist go-live

**Supabase**

- [ ] **Authentication → Sign In / Providers → matikan "Allow new users to sign up".**
      Akun admin/operator dibuat manual lewat *Add user*.
- [ ] Jalankan versi terbaru `supabase/schema.sql`.
- [ ] Daftarkan email admin di tabel `admins` (lihat Setup langkah 3).
- [ ] **Authentication → URL Configuration**: isi *Site URL* dengan domain produksi
      (`https://matanitiga.site`) dan tambahkan `https://<domain>/confirm`
      ke *Redirect URLs*.

**Vercel**

- [ ] Import repo GitHub. Preset *Nuxt* terdeteksi otomatis; Node 20 atau lebih baru.
- [ ] Environment variables (Production): `SUPABASE_URL`, `SUPABASE_KEY` (anon key),
      `NUXT_PUBLIC_SITE_URL` (domain produksi), `APP_NAME`, dan `CRON_SECRET`
      (string acak panjang, mis. hasil `openssl rand -hex 32`).
- [ ] Setelah deploy, buka **Settings → Cron Jobs**: pastikan `/api/keepalive` terdaftar,
      lalu klik **Run** sekali dan cek hasilnya sukses (lihat "Keep-alive database" di bawah).
- [ ] Hubungkan domain, lalu cek `https://<domain>/robots.txt` dan `/sitemap.xml`.

> Urutan penting: jalankan `schema.sql` **berbarengan** dengan deploy kode terbaru. Kode lama
> menulis formulir langsung ke tabel, dan skema baru memblokir cara itu.

**Isi konten (Admin)**

- [ ] Profil → telepon/WA kantor, email, **jam pelayanan**, logo (diperkecil otomatis).
- [ ] Layanan Surat → **Jenis Surat & Persyaratan** sesuai ketentuan kantor.
- [ ] Minimal beberapa berita/pengumuman dan foto galeri, perangkat kelurahan, pengurus organisasi.
- [ ] Peta → batas 8 lingkungan dan titik landmark.

**Uji setelah live**

- [ ] Kirim satu permohonan surat dan satu pengaduan uji → simpan kodenya → buka **Cek Status**.
- [ ] Ubah statusnya di admin → pastikan riwayat/catatan muncul di Cek Status → hapus data uji.
- [ ] Coba dari HP: menu, formulir, unggah foto pengaduan, peta.

---

## Keep-alive database

Supabase paket gratis **mem-pause project setelah 7 hari tanpa aktivitas**; website lalu
tidak bisa memuat data sampai project di-*restore* manual dari dashboard Supabase.

Pencegahannya: [`vercel.json`](vercel.json) mendaftarkan **Vercel Cron** yang memanggil
[`/api/keepalive`](server/api/keepalive.get.ts) setiap hari pukul 01.00 UTC (09.00 WITA).
Endpoint itu menjalankan query kecil ke tabel `settings`, cukup untuk dihitung sebagai aktivitas.

- Cron hanya berjalan di deployment **Production** Vercel (bukan lokal / preview).
- Dengan `CRON_SECRET` di-set, permintaan tanpa header yang benar ditolak (401).
- Cek riwayat run di Vercel → project → **Settings → Cron Jobs** / **Logs**. Run yang gagal
  (database tidak terjangkau) tercatat sebagai error 503.
- Bila project terlanjur di-pause: Supabase Dashboard → project → **Restore**.

---

## Struktur

```
app/
├── assets/css/main.css     # token tema (warna, font, radius) — ubah di sini untuk rebrand
├── components/             # ui/ (design system), layout/, admin/, komponen halaman
├── composables/            # useSettings (profil kelurahan), usePosts, useMedia, useDraftImage
├── config/                 # site (navigasi/footer), layanan, landmark, penduduk, posko, potensi
├── pages/                  # halaman publik + /admin/**
├── utils/                  # format, geoImport (GeoJSON/SHP), landmarkMap, icons
└── types/                  # tipe baris tabel + tipe Database supabase-js
server/routes/              # robots.txt, sitemap.xml
server/api/keepalive.get.ts  # dipanggil Vercel Cron harian agar Supabase tidak di-pause
vercel.json                  # jadwal cron
supabase/schema.sql         # skema + RLS + fungsi + seed — jalankan di SQL Editor
```

### Kustomisasi

- **Warna / font**: `app/assets/css/main.css`. Palet hanya Merah–Putih; satu font (Plus Jakarta Sans, di-host sendiri).
- **Menu navigasi & footer**: `app/config/site.ts`.
- **Kategori landmark**: `app/config/landmark.ts`. **Kategori pengaduan**: `app/config/layanan.ts`.
- **Isi profil, kontak, jenis surat, data penduduk**: dari `/admin`.

---

## Catatan keamanan

- Admin = email di tabel `admins` (fungsi `is_admin()`); semua kebijakan tulis memakainya.
- Formulir publik tidak bisa menulis langsung ke tabel; hanya lewat fungsi SQL yang memvalidasi
  dan membatasi jumlah kiriman. Cek status tidak mengembalikan nama/nomor HP pemohon.
- Konten rich text ditampilkan dengan `v-html`. Aman karena hanya admin yang bisa menulisnya.
  Jika kelak menambah input publik yang menghasilkan HTML, tambahkan sanitasi.
- NIK tidak dikumpulkan dari formulir publik.
