/**
 * Hand-written row types mirroring supabase/schema.sql.
 * Declared as `type` (not `interface`) so they satisfy supabase-js's
 * `Record<string, unknown>` table constraint.
 */

export type PotensiCategory = 'sdm' | 'sda'
export type PotensiItem = {
  id: string
  category: PotensiCategory
  title: string
  description: string
  imageUrl: string
}

/** One person in the posko structure. `detail` = prodi/fakultas for students, NIP/unit for staff. */
/** Kekuatan & kelemahan satu aspek (SDM atau SDA). `overview`: paragraf dipisah baris kosong. */
export type PotensiAspect = { overview: string, strengths: string[], weaknesses: string[] }
export type PotensiProfile = {
  summary: string
  /** Angka kunci di bawah ringkasan, mis. { value: '2.207', label: 'Jiwa penduduk' }. */
  highlights: { value: string, label: string }[]
  sdm: PotensiAspect
  sda: PotensiAspect
  /** Bagian tambahan sesudah SDM & SDA (mis. potensi wilayah sebagai pendukung). */
  support: { title: string, text: string }
  recommendations: string[]
  recommendationsNote: string
  /** Satu sumber per baris. */
  sources: string
}

export type PoskoPerson = { id: string, name: string, detail: string, photoUrl: string }
export type ProgramStatus = 'rencana' | 'berjalan' | 'selesai'
export type PoskoProgram = { id: string, title: string, description: string, status: ProgramStatus }
export type PoskoInfo = {
  title: string
  university: string
  period: string
  intro: string
  /** People per position, key = POSKO_POSITIONS[].key (config/posko.ts). */
  structure: Partial<Record<string, PoskoPerson[]>>
  programs: PoskoProgram[]
}

export type SettingsData = {
  villageName: string
  tagline: string
  shortDescription: string
  logoUrl: string
  heroImageUrl: string
  history: string // HTML
  vision: string
  mission: string[]
  address: string
  phone: string
  email: string
  whatsapp: string
  mapEmbedUrl: string
  population: number | null
  households: number | null
  hamlets: number | null
  areaKm2: number | null
  district: string
  regency: string
  province: string
  social: {
    instagram: string
    facebook: string
    youtube: string
    tiktok: string
  }
  demographics: {
    male: number | null
    female: number | null
    balita0_11: number | null
    balita1_2: number | null
    balita2_3: number | null
    balita3_4: number | null
    balita4_5: number | null
    ibuHamil: number | null
    lansia60_69: number | null
    lansia70_79: number | null
    lansia80Plus: number | null
  }
  /** Jumlah penduduk per kelompok umur 5 tahunan, key = AGE_BANDS (config/penduduk.ts). */
  ageDistribution: Partial<Record<string, { male: number | null, female: number | null }>>
  /** Halaman Potensi Kelurahan (SDM & SDA): kartu potensi unggulan… */
  potensi: PotensiItem[]
  /** …dan uraian kajiannya (ringkasan, kekuatan/kelemahan, rekomendasi). */
  potensiProfile: PotensiProfile
  /** Halaman Posko KKT. */
  posko: PoskoInfo
  mapCenter: {
    lat: number | null
    lng: number | null
    zoom: number
  }
  /** Jam pelayanan kantor, satu baris per hari/rentang (mis. "Senin–Jumat: 08.00–15.00"). */
  officeHours: string
  /** Jenis surat di halaman Layanan Surat beserta persyaratannya (diatur admin). */
  letterTypes: LetterTypeConfig[]
}

export type LetterTypeConfig = {
  name: string
  /** Satu persyaratan per baris. */
  requirements: string
  /** Perkiraan lama proses, mis. "1 hari kerja". Kosong = tidak ditampilkan. */
  duration: string
}

/** Hasil fungsi database cek_status(kode). */
export type TicketStatus =
  | {
    kind: 'surat'
    code: string
    title: string
    status: LetterRequestStatus
    created_at: string
    updated_at: string
    events: { status: LetterRequestStatus, note: string | null, at: string }[]
  }
  | {
    kind: 'pengaduan'
    code: string
    title: string
    status: ComplaintStatus
    response: string | null
    created_at: string
    updated_at: string
  }

export type Official = {
  id: string
  name: string
  position: string
  photo_url: string | null
  display_order: number
  created_at: string
}

export type PostType = 'berita' | 'pengumuman'

export type Post = {
  id: string
  type: PostType
  title: string
  slug: string
  excerpt: string | null
  content: string | null
  cover_url: string | null
  published: boolean
  published_at: string | null
  created_at: string
  updated_at: string
}

export type GalleryItem = {
  id: string
  title: string | null
  caption: string | null
  image_url: string
  display_order: number
  created_at: string
}

export type Message = {
  id: string
  name: string
  email: string | null
  phone: string | null
  message: string
  is_read: boolean
  created_at: string
}

export type CommunityGroup = {
  id: string
  category: string
  name: string
  description: string | null
  display_order: number
  created_at: string
}

export type CommunityGroupMember = {
  id: string
  group_id: string
  name: string
  role: string
  note: string | null
  display_order: number
}

export type CommunityGroupWithMembers = CommunityGroup & {
  community_group_members: CommunityGroupMember[]
}

/** GeoJSON Polygon/MultiPolygon geometry, as drawn in the admin map editor. */
export type NeighborhoodBoundary = {
  type: 'Polygon' | 'MultiPolygon'
  coordinates: number[][][] | number[][][][]
}

export type Neighborhood = {
  id: string
  name: string
  color: string
  population: number | null
  head_name: string | null
  head_phone: string | null
  boundary: NeighborhoodBoundary | null
  center_lat: number | null
  center_lng: number | null
  display_order: number
  created_at: string
}

export type NeighborhoodRt = {
  id: string
  neighborhood_id: string
  rt_number: string
  head_name: string | null
  phone: string | null
  display_order: number
}

/** Titik landmark / fasilitas publik. `category` = value di config/landmark.ts. */
export type Landmark = {
  id: string
  name: string
  category: string
  description: string | null
  address: string | null
  photo_url: string | null
  lat: number
  lng: number
  created_at: string
}

export type LetterRequestStatus = 'diajukan' | 'diproses' | 'selesai' | 'ditolak'

export type LetterRequest = {
  id: string
  /** Kode tiket untuk cek status, mis. SR-4F09A2C1. */
  code: string
  type: string
  name: string
  /** Tidak lagi dikumpulkan; hanya ada pada permohonan lama. */
  nik: string | null
  phone: string
  address: string | null
  purpose: string | null
  status: LetterRequestStatus
  note: string | null
  created_at: string
  updated_at: string
}

/** Riwayat status permohonan, dicatat otomatis oleh trigger database. */
export type LetterRequestEvent = {
  id: number
  request_id: string
  status: LetterRequestStatus
  note: string | null
  created_at: string
}

export type ComplaintStatus = 'diterima' | 'diproses' | 'selesai'

export type Complaint = {
  id: string
  /** Kode tiket untuk cek status, mis. PG-4F09A2C1. */
  code: string
  name: string
  phone: string | null
  category: string
  location: string | null
  description: string
  photo_url: string | null
  status: ComplaintStatus
  response: string | null
  created_at: string
  updated_at: string
}
