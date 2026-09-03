/**
 * Central configuration contracts for the Village Website Platform.
 * Everything here is editable from the Admin Dashboard and persisted in
 * `village_settings` / `theme_settings` / `feature_flags`.
 * NOTHING in these shapes should ever be hardcoded in components.
 */

export interface VillageContact {
  address: string
  phone: string
  email: string
  whatsapp: string
  mapEmbedUrl: string
  emergencyContacts: { label: string, number: string }[]
}

export interface VillageSocialMedia {
  instagram: string
  facebook: string
  youtube: string
  tiktok: string
  twitter: string
}

export interface VillageConfig {
  villageName: string
  district: string       // kecamatan
  regency: string        // kabupaten/kota
  province: string
  postalCode: string

  logo: string
  logoDark: string
  favicon: string

  tagline: string
  shortDescription: string

  // geo / profile
  areaKm2: number | null
  population: number | null
  households: number | null   // jumlah KK
  hamlets: number | null      // jumlah dusun
  latitude: number | null
  longitude: number | null

  contact: VillageContact
  socialMedia: VillageSocialMedia

  // homepage macro layout preset id (resolved by the section renderer)
  homepageLayout: string
  heroStyle: string
}

export type ThemeMode = 'light' | 'dark' | 'system'
export type ButtonStyle = 'solid' | 'outline' | 'soft' | 'ghost'
export type CardStyle = 'raised' | 'bordered' | 'flat'

export interface ThemeConfig {
  colors: {
    primary: string       // hex
    secondary: string
    accent: string
    surface: string
    surfaceMuted: string
    ink: string
    inkMuted: string
    line: string
    // dark-mode overrides (optional)
    darkSurface: string
    darkSurfaceMuted: string
    darkInk: string
    darkInkMuted: string
    darkLine: string
  }
  typography: {
    fontHeading: string   // font-family stack
    fontBody: string
    fontScale: number     // 0.9 - 1.15
    googleFonts: string[] // e.g. ["Playfair Display:wght@500;700", "Plus Jakarta Sans:wght@400;500;600"]
  }
  layout: {
    containerWidth: string  // e.g. "1200px"
    radius: string          // e.g. "0.75rem"
    buttonStyle: ButtonStyle
    cardStyle: CardStyle
  }
  mode: ThemeMode
  // Cultural / local identity
  identity: {
    pattern: string          // url or preset key ('batik' | 'none' | custom image)
    patternOpacity: number
    ornamentImage: string
    heroAccentImage: string
  }
}

export const FEATURE_FLAGS = [
  'enableNews',
  'enableAnnouncements',
  'enableEvents',
  'enableUMKM',
  'enableTourism',
  'enableGallery',
  'enableTransparency',
  'enableDigitalServices',
  'enableStatistics',
  'enableGovernment',
  'enableKKTDeveloperPage',
] as const
export type FeatureFlag = (typeof FEATURE_FLAGS)[number]
export type FeatureFlags = Record<FeatureFlag, boolean>

export interface FooterConfig {
  description: string
  showCredit: boolean
  creditText: string
  programName: string
  showDeveloperLink: boolean
  developerLinkLabel: string
  developerLinkUrl: string
  bottomText: string       // e.g. "© {year} Desa {name}"
  columns: FooterColumn[]
}
export interface FooterColumn {
  title: string
  links: { label: string, url: string }[]
}

/** The full resolved config delivered to the client in one payload. */
export interface SiteConfig {
  village: VillageConfig
  theme: ThemeConfig
  features: FeatureFlags
  footer: FooterConfig
  navigation: MenuTree[]
}

export interface MenuTree {
  id: string
  label: string
  url: string
  icon: string | null
  target: '_self' | '_blank'
  visible: boolean
  order: number
  children: MenuTree[]
}
