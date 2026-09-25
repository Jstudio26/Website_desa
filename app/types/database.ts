/**
 * Hand-written row types mirroring supabase/schema.sql.
 * Declared as `type` (not `interface`) so they satisfy supabase-js's
 * `Record<string, unknown>` table constraint.
 */

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
  mapCenter: {
    lat: number | null
    lng: number | null
    zoom: number
  }
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

export type LetterRequestStatus = 'diajukan' | 'diproses' | 'selesai' | 'ditolak'

export type LetterRequest = {
  id: string
  type: string
  name: string
  nik: string
  phone: string
  address: string | null
  purpose: string | null
  status: LetterRequestStatus
  note: string | null
  created_at: string
  updated_at: string
}

export type ComplaintStatus = 'diterima' | 'diproses' | 'selesai'

export type Complaint = {
  id: string
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
