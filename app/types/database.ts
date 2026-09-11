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
