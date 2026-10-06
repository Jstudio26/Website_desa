-- ============================================================================
--  Website Desa - skema Supabase
--  Jalankan seluruh isi file ini di:  Supabase Dashboard -> SQL Editor -> Run
--  Aman dijalankan ulang (idempotent).
-- ============================================================================

-- ----------------------------------------------------------------------------
--  FUNGSI BANTU
-- ----------------------------------------------------------------------------

-- Kode tiket yang dibagikan ke warga untuk cek status, mis. SR-4F09A2C1 / PG-...
create or replace function public.new_ticket_code(prefix text)
returns text language sql volatile set search_path = ''
as $$ select prefix || '-' || upper(substr(md5(gen_random_uuid()::text), 1, 8)) $$;

-- Nomor HP ke satu bentuk (hanya angka, 62xxx -> 0xxx) supaya "0812-..." dan "+62 812..." dianggap sama.
create or replace function public.normalize_phone(p text)
returns text language sql immutable set search_path = ''
as $$ select regexp_replace(regexp_replace(coalesce(p, ''), '\D', '', 'g'), '^62', '0') $$;

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

-- Landmark & fasilitas publik (titik di peta). Titik biasanya diimpor dari SHP,
-- lalu admin melengkapi info (kategori, deskripsi, foto) lewat Admin -> Landmark.
create table if not exists public.landmarks (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  category      text not null default 'lainnya',
  description   text,
  address       text,
  photo_url     text,
  lat           double precision not null,
  lng           double precision not null,
  created_at    timestamptz not null default now()
);

-- Permohonan surat online (Domisili, Pengantar, SKTM, dst).
-- NIK tidak lagi dikumpulkan dari formulir publik (kolom dibiarkan untuk data lama).
create table if not exists public.letter_requests (
  id         uuid primary key default gen_random_uuid(),
  code       text not null unique default public.new_ticket_code('SR'),
  type       text not null,
  name       text not null,
  nik        text,
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

-- Riwayat status permohonan (diisi otomatis oleh trigger) - tampil ke pemohon saat cek status.
create table if not exists public.letter_request_events (
  id         bigint generated always as identity primary key,
  request_id uuid not null references public.letter_requests (id) on delete cascade,
  status     text not null,
  note       text,
  created_at timestamptz not null default now()
);
create index if not exists letter_request_events_request_idx
  on public.letter_request_events (request_id, created_at);

-- Pengaduan masyarakat.
create table if not exists public.complaints (
  id          uuid primary key default gen_random_uuid(),
  code        text not null unique default public.new_ticket_code('PG'),
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

-- Admin: HANYA email di tabel ini yang boleh mengelola konten dan membaca data warga.
-- Sekadar punya akun Supabase / bisa login TIDAK cukup.
-- Tambah admin (jalankan di SQL Editor, ganti emailnya):
--   insert into public.admins (email) values ('email-admin@contoh.com') on conflict do nothing;
create table if not exists public.admins (
  email      text primary key,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
--  MIGRASI  (untuk database yang dibuat dengan versi skema sebelumnya)
-- ----------------------------------------------------------------------------

alter table public.letter_requests alter column nik drop not null;
alter table public.letter_requests add column if not exists code text default public.new_ticket_code('SR');
alter table public.complaints      add column if not exists code text default public.new_ticket_code('PG');
update public.letter_requests set code = public.new_ticket_code('SR') where code is null;
update public.complaints      set code = public.new_ticket_code('PG') where code is null;
alter table public.letter_requests alter column code set not null;
alter table public.complaints      alter column code set not null;
create unique index if not exists letter_requests_code_key on public.letter_requests (code);
create unique index if not exists complaints_code_key      on public.complaints (code);

-- ----------------------------------------------------------------------------
--  FUNGSI: hak admin, riwayat status, formulir publik, cek status
-- ----------------------------------------------------------------------------

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1
    from public.admins a
    join auth.users u on lower(u.email) = lower(a.email)
    where u.id = auth.uid() and u.email_confirmed_at is not null
  );
$$;
grant execute on function public.is_admin() to anon, authenticated;

create or replace function public.log_letter_request_event()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  if tg_op = 'INSERT' or new.status is distinct from old.status or new.note is distinct from old.note then
    insert into public.letter_request_events (request_id, status, note) values (new.id, new.status, new.note);
  end if;
  return new;
end
$$;
drop trigger if exists letter_request_events_log on public.letter_requests;
create trigger letter_request_events_log
  after insert or update on public.letter_requests
  for each row execute function public.log_letter_request_event();

-- Permohonan lama yang belum punya riwayat: catat status terakhirnya.
insert into public.letter_request_events (request_id, status, note, created_at)
select r.id, r.status, r.note, r.updated_at
from public.letter_requests r
where not exists (select 1 from public.letter_request_events e where e.request_id = r.id);

-- Formulir publik TIDAK menulis langsung ke tabel, tapi lewat fungsi di bawah:
-- isian divalidasi, jumlah kiriman dibatasi (anti-spam), dan kode tiket dikembalikan.

create or replace function public.ajukan_surat(
  p_type text, p_name text, p_phone text, p_address text default null, p_purpose text default null
)
returns text language plpgsql security definer set search_path = ''
as $$
declare
  v_phone text := public.normalize_phone(p_phone);
  v_code  text;
begin
  if length(trim(coalesce(p_name, ''))) < 2 or length(p_name) > 120 then
    raise exception 'Nama tidak valid.';
  end if;
  if length(v_phone) not between 9 and 15 then
    raise exception 'Nomor telepon/WA tidak valid.';
  end if;
  if length(trim(coalesce(p_type, ''))) = 0 or length(p_type) > 150 then
    raise exception 'Jenis surat tidak valid.';
  end if;
  if length(coalesce(p_address, '')) > 300 or length(coalesce(p_purpose, '')) > 1000 then
    raise exception 'Isian terlalu panjang.';
  end if;
  if (select count(*) from public.letter_requests
      where public.normalize_phone(phone) = v_phone and created_at > now() - interval '1 day') >= 5 then
    raise exception 'Nomor ini sudah mengirim 5 permohonan hari ini. Silakan hubungi kantor kelurahan.';
  end if;
  if (select count(*) from public.letter_requests where created_at > now() - interval '10 minutes') >= 30 then
    raise exception 'Sedang banyak permohonan masuk. Silakan coba lagi beberapa menit lagi.';
  end if;

  insert into public.letter_requests (type, name, phone, address, purpose)
  values (trim(p_type), trim(p_name), trim(p_phone), nullif(trim(p_address), ''), nullif(trim(p_purpose), ''))
  returning code into v_code;
  return v_code;
end
$$;

create or replace function public.kirim_pengaduan(
  p_name text, p_category text, p_description text,
  p_phone text default null, p_location text default null, p_photo_url text default null
)
returns text language plpgsql security definer set search_path = ''
as $$
declare
  v_phone text := public.normalize_phone(p_phone);
  v_code  text;
begin
  if length(trim(coalesce(p_name, ''))) < 2 or length(p_name) > 120 then
    raise exception 'Nama tidak valid.';
  end if;
  if length(trim(coalesce(p_description, ''))) < 10 or length(p_description) > 3000 then
    raise exception 'Uraian pengaduan minimal 10 dan maksimal 3000 karakter.';
  end if;
  if length(trim(coalesce(p_category, ''))) = 0 or length(p_category) > 100 then
    raise exception 'Kategori tidak valid.';
  end if;
  if v_phone <> '' and length(v_phone) not between 9 and 15 then
    raise exception 'Nomor telepon/WA tidak valid.';
  end if;
  if length(coalesce(p_location, '')) > 300 then
    raise exception 'Lokasi terlalu panjang.';
  end if;
  -- Foto hanya boleh dari folder pengaduan/ di bucket website ini.
  if p_photo_url is not null and p_photo_url !~ '/storage/v1/object/public/media/pengaduan/[^/]+$' then
    raise exception 'Foto tidak valid.';
  end if;
  if (select count(*) from public.complaints where created_at > now() - interval '10 minutes') >= 20 then
    raise exception 'Sedang banyak pengaduan masuk. Silakan coba lagi beberapa menit lagi.';
  end if;

  insert into public.complaints (name, phone, category, location, description, photo_url)
  values (trim(p_name), nullif(trim(p_phone), ''), trim(p_category), nullif(trim(p_location), ''), trim(p_description), p_photo_url)
  returning code into v_code;
  return v_code;
end
$$;

create or replace function public.kirim_pesan(
  p_name text, p_message text, p_email text default null, p_phone text default null
)
returns void language plpgsql security definer set search_path = ''
as $$
begin
  if length(trim(coalesce(p_name, ''))) < 2 or length(p_name) > 120 then
    raise exception 'Nama tidak valid.';
  end if;
  if length(trim(coalesce(p_message, ''))) < 5 or length(p_message) > 3000 then
    raise exception 'Pesan minimal 5 dan maksimal 3000 karakter.';
  end if;
  if length(coalesce(p_email, '')) > 200 or length(coalesce(p_phone, '')) > 30 then
    raise exception 'Isian terlalu panjang.';
  end if;
  if (select count(*) from public.messages where created_at > now() - interval '10 minutes') >= 20 then
    raise exception 'Sedang banyak pesan masuk. Silakan coba lagi beberapa menit lagi.';
  end if;
  insert into public.messages (name, email, phone, message)
  values (trim(p_name), nullif(trim(p_email), ''), nullif(trim(p_phone), ''), trim(p_message));
end
$$;

-- Cek status dengan kode tiket. Tidak mengembalikan nama/nomor HP pemohon.
create or replace function public.cek_status(p_code text)
returns jsonb language plpgsql stable security definer set search_path = ''
as $$
declare
  v_code text := upper(trim(coalesce(p_code, '')));
  r record;
begin
  if v_code like 'SR-%' then
    select id, type, status, created_at, updated_at into r from public.letter_requests where code = v_code;
    if not found then return null; end if;
    return jsonb_build_object(
      'kind', 'surat', 'code', v_code, 'title', r.type, 'status', r.status,
      'created_at', r.created_at, 'updated_at', r.updated_at,
      'events', coalesce((
        select jsonb_agg(jsonb_build_object('status', e.status, 'note', e.note, 'at', e.created_at) order by e.created_at)
        from public.letter_request_events e where e.request_id = r.id
      ), '[]'::jsonb)
    );
  elsif v_code like 'PG-%' then
    select category, status, response, created_at, updated_at into r from public.complaints where code = v_code;
    if not found then return null; end if;
    return jsonb_build_object(
      'kind', 'pengaduan', 'code', v_code, 'title', r.category, 'status', r.status,
      'response', r.response, 'created_at', r.created_at, 'updated_at', r.updated_at
    );
  end if;
  return null;
end
$$;

grant execute on function public.ajukan_surat(text, text, text, text, text)         to anon, authenticated;
grant execute on function public.kirim_pengaduan(text, text, text, text, text, text) to anon, authenticated;
grant execute on function public.kirim_pesan(text, text, text, text)                 to anon, authenticated;
grant execute on function public.cek_status(text)                                    to anon, authenticated;

-- ----------------------------------------------------------------------------
--  ROW LEVEL SECURITY
--  Pola: publik boleh BACA konten; hanya ADMIN (lihat tabel admins / is_admin())
--  yang boleh TULIS dan membaca data warga.
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
alter table public.landmarks                enable row level security;
alter table public.letter_requests          enable row level security;
alter table public.complaints               enable row level security;
alter table public.letter_request_events    enable row level security;
alter table public.admins                   enable row level security;

-- settings ---------------------------------------------------------------
drop policy if exists "settings read"  on public.settings;
drop policy if exists "settings write" on public.settings;
create policy "settings read"  on public.settings for select to anon, authenticated using (true);
create policy "settings write" on public.settings for all    to authenticated using (public.is_admin()) with check (public.is_admin());

-- officials --------------------------------------------------------------
drop policy if exists "officials read"  on public.officials;
drop policy if exists "officials write" on public.officials;
create policy "officials read"  on public.officials for select to anon, authenticated using (true);
create policy "officials write" on public.officials for all    to authenticated using (public.is_admin()) with check (public.is_admin());

-- posts ----------------------------------------------------------------
drop policy if exists "posts read public" on public.posts;
drop policy if exists "posts read admin"  on public.posts;
drop policy if exists "posts write"       on public.posts;
create policy "posts read public" on public.posts for select to anon, authenticated using (published = true);
create policy "posts read admin"  on public.posts for select to authenticated       using (public.is_admin());
create policy "posts write"       on public.posts for all    to authenticated using (public.is_admin()) with check (public.is_admin());

-- gallery -------------------------------------------------------------
drop policy if exists "gallery read"  on public.gallery;
drop policy if exists "gallery write" on public.gallery;
create policy "gallery read"  on public.gallery for select to anon, authenticated using (true);
create policy "gallery write" on public.gallery for all    to authenticated using (public.is_admin()) with check (public.is_admin());

-- messages ---------------------------------------------------------------
drop policy if exists "messages insert" on public.messages;
drop policy if exists "messages admin"  on public.messages;
create policy "messages admin"  on public.messages for all    to authenticated using (public.is_admin()) with check (public.is_admin());

-- community_groups ---------------------------------------------------------
drop policy if exists "community_groups read"  on public.community_groups;
drop policy if exists "community_groups write" on public.community_groups;
create policy "community_groups read"  on public.community_groups for select to anon, authenticated using (true);
create policy "community_groups write" on public.community_groups for all    to authenticated using (public.is_admin()) with check (public.is_admin());

-- community_group_members ---------------------------------------------------
drop policy if exists "community_group_members read"  on public.community_group_members;
drop policy if exists "community_group_members write" on public.community_group_members;
create policy "community_group_members read"  on public.community_group_members for select to anon, authenticated using (true);
create policy "community_group_members write" on public.community_group_members for all    to authenticated using (public.is_admin()) with check (public.is_admin());

-- neighborhoods --------------------------------------------------------
drop policy if exists "neighborhoods read"  on public.neighborhoods;
drop policy if exists "neighborhoods write" on public.neighborhoods;
create policy "neighborhoods read"  on public.neighborhoods for select to anon, authenticated using (true);
create policy "neighborhoods write" on public.neighborhoods for all    to authenticated using (public.is_admin()) with check (public.is_admin());

-- neighborhood_rts -----------------------------------------------------
drop policy if exists "neighborhood_rts read"  on public.neighborhood_rts;
drop policy if exists "neighborhood_rts write" on public.neighborhood_rts;
create policy "neighborhood_rts read"  on public.neighborhood_rts for select to anon, authenticated using (true);
create policy "neighborhood_rts write" on public.neighborhood_rts for all    to authenticated using (public.is_admin()) with check (public.is_admin());

-- landmarks --------------------------------------------------------------
drop policy if exists "landmarks read"  on public.landmarks;
drop policy if exists "landmarks write" on public.landmarks;
create policy "landmarks read"  on public.landmarks for select to anon, authenticated using (true);
create policy "landmarks write" on public.landmarks for all    to authenticated using (public.is_admin()) with check (public.is_admin());

-- letter_requests --------------------------------------------------------
-- Berisi data pribadi warga -> TIDAK boleh dibaca publik, hanya admin.
-- Warga mengirim lewat fungsi ajukan_surat / kirim_pengaduan / kirim_pesan (lihat di atas).
drop policy if exists "letter_requests insert" on public.letter_requests;
drop policy if exists "letter_requests admin"  on public.letter_requests;
create policy "letter_requests admin"  on public.letter_requests for all    to authenticated using (public.is_admin()) with check (public.is_admin());

-- complaints ---------------------------------------------------------------
drop policy if exists "complaints insert" on public.complaints;
drop policy if exists "complaints admin"  on public.complaints;
create policy "complaints admin"  on public.complaints for all    to authenticated using (public.is_admin()) with check (public.is_admin());

-- letter_request_events (diisi trigger; warga melihatnya lewat cek_status) ----
drop policy if exists "letter_request_events admin" on public.letter_request_events;
create policy "letter_request_events admin" on public.letter_request_events for select to authenticated using (public.is_admin());

-- admins (dikelola lewat SQL Editor) ----------------------------------------
drop policy if exists "admins read" on public.admins;
create policy "admins read" on public.admins for select to authenticated using (public.is_admin());

-- ----------------------------------------------------------------------------
--  STORAGE  (bucket publik `media` untuk semua gambar)
-- ----------------------------------------------------------------------------

-- Batas 5 MB & hanya gambar, juga untuk unggahan foto pengaduan tanpa login.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
on conflict (id) do update set
  public = true,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "media read"   on storage.objects;
drop policy if exists "media write"  on storage.objects;
drop policy if exists "media update" on storage.objects;
drop policy if exists "media delete" on storage.objects;
drop policy if exists "media write anon pengaduan" on storage.objects;
create policy "media read"   on storage.objects for select to anon, authenticated using (bucket_id = 'media');
create policy "media write"  on storage.objects for insert to authenticated with check (bucket_id = 'media' and public.is_admin());
create policy "media update" on storage.objects for update to authenticated using (bucket_id = 'media' and public.is_admin());
create policy "media delete" on storage.objects for delete to authenticated using (bucket_id = 'media' and public.is_admin());

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
