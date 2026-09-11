# Website Desa

Website desa sederhana: **Nuxt 3** di frontend, **Supabase** untuk semua kebutuhan
backend (database PostgreSQL, autentikasi admin, dan penyimpanan gambar).

Fitur:

- **Profil Desa** — identitas, kontak, data desa, visi & misi, sejarah, perangkat desa
- **Berita** & **Pengumuman** — editor rich text, gambar sampul, status draft/terbit
- **Galeri Foto** — unggah banyak foto, lightbox
- **Kontak** — info + peta + form pesan yang masuk ke dashboard admin

Semua konten dikelola dari `/admin` (login Supabase Auth).

---

## Teknologi

| Bagian | Pilihan |
|---|---|
| Framework | Nuxt 3 (Vue 3, TypeScript) |
| Styling | Tailwind CSS (token warna/font di `app/assets/css/main.css`) |
| Database | Supabase PostgreSQL (query langsung dari client + Row Level Security) |
| Auth | Supabase Auth (email + password) via `@nuxtjs/supabase` |
| Storage | Supabase Storage, bucket publik `media` |
| Editor | Tiptap (WYSIWYG) |

Tidak ada folder `server/` — tidak ada API backend sendiri. Keamanan ditegakkan
oleh kebijakan RLS di Supabase (`supabase/schema.sql`).

---

## Setup

### 1. Buat project Supabase

1. Buat project baru di <https://supabase.com>.
2. Buka **SQL Editor** → tempel seluruh isi [`supabase/schema.sql`](supabase/schema.sql) → **Run**.
   Ini membuat tabel, kebijakan RLS, bucket Storage `media`, dan satu baris data contoh.
3. Buka **Authentication → Users → Add user**, buat akun admin (email + password).
   Aktifkan "Auto Confirm User".
4. Buka **Project Settings → API**, salin **Project URL** dan **anon public key**.

### 2. Konfigurasi environment

```bash
cp .env.example .env
```

Isi `.env`:

```
APP_NAME="Website Desa Contoh"
NUXT_PUBLIC_SITE_URL="http://localhost:3000"
SUPABASE_URL="https://xxxx.supabase.co"
SUPABASE_KEY="eyJhbGciOi..."   # anon public key
```

### 3. Jalankan

```bash
npm install
npm run dev          # http://localhost:3000  ·  admin di /admin
```

---

## Perintah

| Perintah | Fungsi |
|---|---|
| `npm run dev` | Mode pengembangan |
| `npm run build` | Build produksi (`.output/`) |
| `npm run preview` | Pratinjau hasil build |
| `npm run typecheck` | Cek tipe TypeScript |

Deploy: Nitro otomatis mendeteksi target (Vercel, Netlify, Node). Set env var
yang sama di dashboard hosting.

---

## Struktur

```
app/
├── assets/css/main.css     # token tema (warna, font, radius) — ubah di sini untuk rebrand
├── components/
│   ├── ui/                  # design system (Button, Card, Modal, ...)
│   ├── layout/              # TopBar, SiteHeader, SiteFooter
│   ├── admin/               # Sidebar, PageHeader, PostManager, PostEditor
│   ├── PostListView / PostDetailView / RichText / RichTextEditor
├── composables/
│   ├── useSettings.ts       # baris `settings` (profil desa) dari Supabase
│   ├── usePosts.ts          # query berita/pengumuman
│   └── useMedia.ts          # upload/hapus gambar ke Storage
├── config/site.ts           # navigasi + footer (statis)
├── pages/                    # halaman publik + /admin/**
└── types/database.ts        # tipe baris tabel

supabase/schema.sql          # skema + RLS + seed — jalankan di SQL Editor
```

### Kustomisasi

- **Warna / font / radius**: `app/assets/css/main.css` (variabel CSS di `:root`).
- **Menu navigasi & footer**: `app/config/site.ts`.
- **Isi profil desa, kontak, data, perangkat**: dari `/admin/profil`.

---

## Catatan keamanan

- Konten rich text ditampilkan dengan `v-html`. Aman karena hanya admin yang login
  yang bisa menulis. Jika kelak menambah input publik yang menghasilkan HTML,
  tambahkan sanitasi (mis. `isomorphic-dompurify`).
- Validasi form dilakukan seperlunya di sisi client; RLS Supabase adalah lapisan
  penegak sebenarnya untuk siapa yang boleh membaca/menulis.
