-- ============================================================================
--  Website Desa - skema Supabase
--  Jalankan seluruh isi file ini di:  Supabase Dashboard -> SQL Editor -> Run
--  Aman dijalankan ulang (idempotent).
-- ============================================================================

-- ----------------------------------------------------------------------------
--  TABEL
-- ----------------------------------------------------------------------------

-- Profil desa: SATU baris (id = 1), semua field disimpan di kolom jsonb `data`.
create table if not exists public.settings (
  id         int primary key default 1,
  data       jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  constraint settings_singleton check (id = 1)
);

-- Perangkat desa (ditampilkan di halaman Profil).
create table if not exists public.officials (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  position      text not null,
  photo_url     text,
  display_order int not null default 0,
  created_at    timestamptz not null default now()
);

-- Berita + Pengumuman (satu tabel, dibedakan kolom `type`).
create table if not exists public.posts (
  id           uuid primary key default gen_random_uuid(),
  type         text not null check (type in ('berita', 'pengumuman')),
  title        text not null,
  slug         text not null unique,
  excerpt      text,
  content      text,
  cover_url    text,
  published    boolean not null default false,
  published_at timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists posts_list_idx
  on public.posts (type, published, published_at desc);

-- Galeri foto.
create table if not exists public.gallery (
  id            uuid primary key default gen_random_uuid(),
  title         text,
  caption       text,
  image_url     text not null,
  display_order int not null default 0,
  created_at    timestamptz not null default now()
);

-- Pesan dari form kontak publik.
create table if not exists public.messages (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  email      text,
  phone      text,
  message    text not null,
  is_read    boolean not null default false,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
--  ROW LEVEL SECURITY
--  Pola: publik boleh BACA konten, hanya user login (admin) yang boleh TULIS.
-- ----------------------------------------------------------------------------

alter table public.settings  enable row level security;
alter table public.officials enable row level security;
alter table public.posts     enable row level security;
alter table public.gallery   enable row level security;
alter table public.messages  enable row level security;

-- settings ---------------------------------------------------------------
drop policy if exists "settings read"  on public.settings;
drop policy if exists "settings write" on public.settings;
create policy "settings read"  on public.settings for select to anon, authenticated using (true);
create policy "settings write" on public.settings for all    to authenticated using (true) with check (true);

-- officials --------------------------------------------------------------
drop policy if exists "officials read"  on public.officials;
drop policy if exists "officials write" on public.officials;
create policy "officials read"  on public.officials for select to anon, authenticated using (true);
create policy "officials write" on public.officials for all    to authenticated using (true) with check (true);

-- posts ----------------------------------------------------------------
drop policy if exists "posts read public" on public.posts;
drop policy if exists "posts read admin"  on public.posts;
drop policy if exists "posts write"       on public.posts;
create policy "posts read public" on public.posts for select to anon          using (published = true);
create policy "posts read admin"  on public.posts for select to authenticated using (true);
create policy "posts write"       on public.posts for all    to authenticated using (true) with check (true);

-- gallery -------------------------------------------------------------
drop policy if exists "gallery read"  on public.gallery;
drop policy if exists "gallery write" on public.gallery;
create policy "gallery read"  on public.gallery for select to anon, authenticated using (true);
create policy "gallery write" on public.gallery for all    to authenticated using (true) with check (true);

-- messages ---------------------------------------------------------------
drop policy if exists "messages insert" on public.messages;
drop policy if exists "messages admin"  on public.messages;
create policy "messages insert" on public.messages for insert to anon, authenticated with check (true);
create policy "messages admin"  on public.messages for all    to authenticated using (true) with check (true);

-- ----------------------------------------------------------------------------
--  STORAGE  (bucket publik `media` untuk semua gambar)
-- ----------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do update set public = true;

drop policy if exists "media read"   on storage.objects;
drop policy if exists "media write"  on storage.objects;
drop policy if exists "media update" on storage.objects;
drop policy if exists "media delete" on storage.objects;
create policy "media read"   on storage.objects for select to anon, authenticated using (bucket_id = 'media');
create policy "media write"  on storage.objects for insert to authenticated with check (bucket_id = 'media');
create policy "media update" on storage.objects for update to authenticated using (bucket_id = 'media');
create policy "media delete" on storage.objects for delete to authenticated using (bucket_id = 'media');

-- ----------------------------------------------------------------------------
--  SEED  (contoh data - aman, tidak menyebut desa nyata)
-- ----------------------------------------------------------------------------

insert into public.settings (id, data) values (1, jsonb_build_object(
  'villageName',      'Nama Desa',
  'tagline',          'Desa yang tumbuh bersama budaya, alam, dan masyarakat.',
  'shortDescription', 'Portal informasi resmi pemerintah desa. Temukan berita, pengumuman, galeri, dan profil desa dalam satu tempat.',
  'logoUrl',          '',
  'heroImageUrl',     '',
  'history',          '<p>Tuliskan sejarah singkat desa di sini melalui menu Admin -> Profil Desa.</p>',
  'vision',           'Mewujudkan desa yang mandiri, sejahtera, dan berbudaya.',
  'mission',          jsonb_build_array('Meningkatkan pelayanan publik', 'Mendorong ekonomi masyarakat', 'Melestarikan lingkungan dan budaya'),
  'address',          'Kantor Desa',
  'phone',            '',
  'email',            '',
  'whatsapp',         '',
  'mapEmbedUrl',      '',
  'population',        null,
  'households',        null,
  'hamlets',           null,
  'areaKm2',           null,
  'district',          'Nama Kecamatan',
  'regency',           'Nama Kabupaten',
  'province',          'Nama Provinsi',
  'social',            jsonb_build_object('instagram', '', 'facebook', '', 'youtube', '', 'tiktok', '')
))
on conflict (id) do nothing;
