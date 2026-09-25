-- ============================================================================
--  Website Desa - skema Supabase
--  Jalankan seluruh isi file ini di:  Supabase Dashboard -> SQL Editor -> Run
--  Aman dijalankan ulang (idempotent).
-- ============================================================================

-- ----------------------------------------------------------------------------
--  TABEL
-- ----------------------------------------------------------------------------

-- Profil kelurahan: SATU baris (id = 1), semua field disimpan di kolom jsonb `data`.
create table if not exists public.settings (
  id         int primary key default 1,
  data       jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  constraint settings_singleton check (id = 1)
);

-- Perangkat kelurahan (ditampilkan di halaman Profil).
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

-- Organisasi kemasyarakatan: satu baris = satu unit (PIK-R, BKB, BKR, BKL,
-- POKJA Kampung KB, UPPKS, PKK Kelurahan, PKK POKJA I-IV, dst).
create table if not exists public.community_groups (
  id            uuid primary key default gen_random_uuid(),
  category      text not null,
  name          text not null,
  description   text,
  display_order int not null default 0,
  created_at    timestamptz not null default now()
);

-- Anggota / pengurus tiap unit organisasi.
create table if not exists public.community_group_members (
  id            uuid primary key default gen_random_uuid(),
  group_id      uuid not null references public.community_groups (id) on delete cascade,
  name          text not null,
  role          text not null,
  note          text,
  display_order int not null default 0
);
create index if not exists community_group_members_group_idx
  on public.community_group_members (group_id, display_order);

-- Lingkungan: batas wilayah (GeoJSON) untuk peta interaktif.
create table if not exists public.neighborhoods (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  color         text not null default '#DC2626',
  population    int,
  head_name     text,
  head_phone    text,
  boundary      jsonb,
  center_lat    double precision,
  center_lng    double precision,
  display_order int not null default 0,
  created_at    timestamptz not null default now()
);

-- RT di dalam satu lingkungan.
create table if not exists public.neighborhood_rts (
  id            uuid primary key default gen_random_uuid(),
  neighborhood_id uuid not null references public.neighborhoods (id) on delete cascade,
  rt_number     text not null,
  head_name     text,
  phone         text,
  display_order int not null default 0
);
create index if not exists neighborhood_rts_neighborhood_idx
  on public.neighborhood_rts (neighborhood_id, display_order);

-- Permohonan surat online (Domisili, Pengantar, SKTM, dst).
create table if not exists public.letter_requests (
  id         uuid primary key default gen_random_uuid(),
  type       text not null,
  name       text not null,
  nik        text not null,
  phone      text not null,
  address    text,
  purpose    text,
  status     text not null default 'diajukan' check (status in ('diajukan', 'diproses', 'selesai', 'ditolak')),
  note       text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists letter_requests_status_idx
  on public.letter_requests (status, created_at desc);

-- Pengaduan masyarakat.
create table if not exists public.complaints (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  phone       text,
  category    text not null,
  location    text,
  description text not null,
  photo_url   text,
  status      text not null default 'diterima' check (status in ('diterima', 'diproses', 'selesai')),
  response    text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists complaints_status_idx
  on public.complaints (status, created_at desc);

-- ----------------------------------------------------------------------------
--  ROW LEVEL SECURITY
--  Pola: publik boleh BACA konten, hanya user login (admin) yang boleh TULIS.
-- ----------------------------------------------------------------------------

alter table public.settings                 enable row level security;
alter table public.officials                enable row level security;
alter table public.posts                    enable row level security;
alter table public.gallery                  enable row level security;
alter table public.messages                 enable row level security;
alter table public.community_groups         enable row level security;
alter table public.community_group_members  enable row level security;
alter table public.neighborhoods            enable row level security;
alter table public.neighborhood_rts         enable row level security;
alter table public.letter_requests          enable row level security;
alter table public.complaints               enable row level security;

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

-- community_groups ---------------------------------------------------------
drop policy if exists "community_groups read"  on public.community_groups;
drop policy if exists "community_groups write" on public.community_groups;
create policy "community_groups read"  on public.community_groups for select to anon, authenticated using (true);
create policy "community_groups write" on public.community_groups for all    to authenticated using (true) with check (true);

-- community_group_members ---------------------------------------------------
drop policy if exists "community_group_members read"  on public.community_group_members;
drop policy if exists "community_group_members write" on public.community_group_members;
create policy "community_group_members read"  on public.community_group_members for select to anon, authenticated using (true);
create policy "community_group_members write" on public.community_group_members for all    to authenticated using (true) with check (true);

-- neighborhoods --------------------------------------------------------
drop policy if exists "neighborhoods read"  on public.neighborhoods;
drop policy if exists "neighborhoods write" on public.neighborhoods;
create policy "neighborhoods read"  on public.neighborhoods for select to anon, authenticated using (true);
create policy "neighborhoods write" on public.neighborhoods for all    to authenticated using (true) with check (true);

-- neighborhood_rts -----------------------------------------------------
drop policy if exists "neighborhood_rts read"  on public.neighborhood_rts;
drop policy if exists "neighborhood_rts write" on public.neighborhood_rts;
create policy "neighborhood_rts read"  on public.neighborhood_rts for select to anon, authenticated using (true);
create policy "neighborhood_rts write" on public.neighborhood_rts for all    to authenticated using (true) with check (true);

-- letter_requests --------------------------------------------------------
-- Berisi NIK & data pribadi warga -> TIDAK boleh dibaca publik, hanya admin.
drop policy if exists "letter_requests insert" on public.letter_requests;
drop policy if exists "letter_requests admin"  on public.letter_requests;
create policy "letter_requests insert" on public.letter_requests for insert to anon, authenticated with check (true);
create policy "letter_requests admin"  on public.letter_requests for all    to authenticated using (true) with check (true);

-- complaints ---------------------------------------------------------------
drop policy if exists "complaints insert" on public.complaints;
drop policy if exists "complaints admin"  on public.complaints;
create policy "complaints insert" on public.complaints for insert to anon, authenticated with check (true);
create policy "complaints admin"  on public.complaints for all    to authenticated using (true) with check (true);

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
drop policy if exists "media write anon pengaduan" on storage.objects;
create policy "media read"   on storage.objects for select to anon, authenticated using (bucket_id = 'media');
create policy "media write"  on storage.objects for insert to authenticated with check (bucket_id = 'media');
create policy "media update" on storage.objects for update to authenticated using (bucket_id = 'media');
create policy "media delete" on storage.objects for delete to authenticated using (bucket_id = 'media');

-- Formulir Pengaduan (halaman publik) mengunggah foto tanpa login, jadi anon
-- boleh menulis file HANYA ke folder pengaduan/ - bukan seluruh bucket.
create policy "media write anon pengaduan" on storage.objects
  for insert to anon
  with check (bucket_id = 'media' and (storage.foldername(name))[1] = 'pengaduan');

-- ----------------------------------------------------------------------------
--  SEED  (data awal untuk Kelurahan Matani Tiga - dapat diubah lewat Admin)
-- ----------------------------------------------------------------------------

insert into public.settings (id, data) values (1, jsonb_build_object(
  'villageName',      'Kelurahan Matani Tiga',
  'tagline',          'Kelurahan yang tumbuh bersama budaya, alam, dan masyarakat.',
  'shortDescription', 'Portal informasi resmi pemerintah kelurahan. Temukan berita, pengumuman, galeri, dan profil kelurahan dalam satu tempat.',
  'logoUrl',          '',
  'heroImageUrl',     '',
  'history',          '<p>Tuliskan sejarah singkat kelurahan di sini melalui menu Admin -> Profil Kelurahan.</p>',
  'vision',           'Mewujudkan kelurahan yang mandiri, sejahtera, dan berbudaya.',
  'mission',          jsonb_build_array('Meningkatkan pelayanan publik', 'Mendorong ekonomi masyarakat', 'Melestarikan lingkungan dan budaya'),
  'address',          'Kantor Kelurahan Matani Tiga',
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
  'social',            jsonb_build_object('instagram', '', 'facebook', '', 'youtube', '', 'tiktok', ''),
  'demographics',      jsonb_build_object(
    'balita0_11',  null, 'balita1_2',   null, 'balita2_3', null,
    'balita3_4',   null, 'balita4_5',   null, 'ibuHamil',  null,
    'lansia60_69', null, 'lansia70_79', null, 'lansia80Plus', null
  ),
  'mapCenter',         jsonb_build_object('lat', null, 'lng', null, 'zoom', 13)
))
on conflict (id) do nothing;

-- ----------------------------------------------------------------------------
--  SEED - Organisasi kemasyarakatan
--  Struktur unit sesuai program KKN UNIMA 2022 (PIK-R, BKB, BKR, BKL, POKJA
--  Kampung KB, UPPKS, PKK). Data pengurus/anggota diisi lewat Admin -> Organisasi.
-- ----------------------------------------------------------------------------

do $$
begin
  if not exists (select 1 from public.community_groups) then
    insert into public.community_groups (category, name, description, display_order) values
      ('Kampung KB', 'PIK-R (Pusat Informasi dan Konseling Remaja)', 'Wadah kegiatan program penyiapan kehidupan berkeluarga bagi remaja.', 1),
      ('Kampung KB', 'BKB (Bina Keluarga Balita)', 'Kelompok kegiatan yang membina orang tua dalam pengasuhan dan tumbuh kembang balita.', 2),
      ('Kampung KB', 'BKR (Bina Keluarga Remaja)', 'Kelompok kegiatan yang membina keluarga dalam pembinaan tumbuh kembang remaja.', 3),
      ('Kampung KB', 'BKL (Bina Keluarga Lansia)', 'Kelompok kegiatan yang membina keluarga yang memiliki lanjut usia.', 4),
      ('Kampung KB', 'POKJA Kampung KB', 'Kelompok kerja pelaksana program Kampung Keluarga Berkualitas.', 5),
      ('Kampung KB', 'UPPKS (Usaha Peningkatan Pendapatan Keluarga Sejahtera)', 'Kelompok usaha ekonomi produktif anggota keluarga sejahtera.', 6),
      ('PKK', 'TP-PKK Kelurahan Matani Tiga', 'Tim Penggerak Pemberdayaan dan Kesejahteraan Keluarga tingkat kelurahan.', 7),
      ('PKK', 'PKK POKJA I', 'Bidang penghayatan dan pengamalan Pancasila serta gotong royong.', 8),
      ('PKK', 'PKK POKJA II', 'Bidang pendidikan, keterampilan, dan pengembangan kehidupan berkoperasi.', 9),
      ('PKK', 'PKK POKJA III', 'Bidang pangan, sandang, dan perumahan tata laksana rumah tangga.', 10),
      ('PKK', 'PKK POKJA IV', 'Bidang kesehatan, kelestarian lingkungan hidup, dan perencanaan sehat.', 11);
  end if;
end $$;
