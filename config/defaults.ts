/**
 * Platform defaults. These seed a brand-new install and act as safe fallbacks
 * when a settings row is missing. They are NOT authoritative at runtime -
 * the Admin Dashboard values in the database always win.
 *
 * Nothing here names a specific real village; it is deliberately generic so the
 * same source code can be reused for any desa.
 */
import type {
  VillageConfig,
  ThemeConfig,
  FeatureFlags,
  FooterConfig,
} from '../shared/types/config'

export const DEFAULT_VILLAGE: VillageConfig = {
  villageName: 'Nama Desa',
  district: 'Nama Kecamatan',
  regency: 'Nama Kabupaten',
  province: 'Nama Provinsi',
  postalCode: '00000',
  logo: '',
  logoDark: '',
  favicon: '',
  tagline: 'Desa yang tumbuh bersama budaya, alam, dan masyarakat.',
  shortDescription:
    'Portal informasi resmi pemerintah desa. Temukan berita, layanan, potensi, dan data desa dalam satu tempat.',
  areaKm2: null,
  population: null,
  households: null,
  hamlets: null,
  latitude: null,
  longitude: null,
  contact: {
    address: 'Kantor Desa',
    phone: '',
    email: '',
    whatsapp: '',
    mapEmbedUrl: '',
    emergencyContacts: [
      { label: 'Kepala Desa', number: '' },
      { label: 'Puskesmas', number: '' },
      { label: 'Polsek', number: '' },
    ],
  },
  socialMedia: { instagram: '', facebook: '', youtube: '', tiktok: '', twitter: '' },
  homepageLayout: 'immersive',
  heroStyle: 'fullscreen-image',
}

export const DEFAULT_THEME: ThemeConfig = {
  colors: {
    primary: '#155e75',
    secondary: '#064e3b',
    accent: '#ca8a04',
    surface: '#ffffff',
    surfaceMuted: '#f6f6f4',
    ink: '#18181b',
    inkMuted: '#52525b',
    line: '#e4e4e0',
    darkSurface: '#0c0f14',
    darkSurfaceMuted: '#161b22',
    darkInk: '#ededeb',
    darkInkMuted: '#a1a1aa',
    darkLine: '#272d36',
  },
  typography: {
    fontHeading: "'Playfair Display', ui-serif, Georgia, serif",
    fontBody: "'Plus Jakarta Sans', ui-sans-serif, system-ui, sans-serif",
    fontScale: 1,
    googleFonts: [
      'Playfair Display:wght@500;600;700',
      'Plus Jakarta Sans:wght@400;500;600;700',
    ],
  },
  layout: {
    containerWidth: '1200px',
    radius: '0.75rem',
    buttonStyle: 'solid',
    cardStyle: 'raised',
  },
  mode: 'system',
  identity: {
    pattern: 'batik',
    patternOpacity: 0.06,
    ornamentImage: '',
    heroAccentImage: '',
  },
}

/** A few ready-made palettes an admin can one-click apply. */
export const THEME_PRESETS: Record<string, Partial<ThemeConfig['colors']> & { label: string }> = {
  ocean: { label: 'Samudra (Biru)', primary: '#155e75', secondary: '#0e7490', accent: '#f59e0b' },
  forest: { label: 'Rimba (Hijau)', primary: '#166534', secondary: '#15803d', accent: '#ca8a04' },
  volcano: { label: 'Vulkanik (Merah bata)', primary: '#9a3412', secondary: '#b45309', accent: '#0f766e' },
  royal: { label: 'Raja (Ungu)', primary: '#5b21b6', secondary: '#6d28d9', accent: '#d97706' },
  earth: { label: 'Bumi (Cokelat)', primary: '#78350f', secondary: '#92400e', accent: '#4d7c0f' },
}

export const DEFAULT_FEATURES: FeatureFlags = {
  enableNews: true,
  enableAnnouncements: true,
  enableEvents: true,
  enableUMKM: true,
  enableTourism: true,
  enableGallery: true,
  enableTransparency: true,
  enableDigitalServices: true,
  enableStatistics: true,
  enableGovernment: true,
  enableKKTDeveloperPage: true,
}

export const DEFAULT_FOOTER: FooterConfig = {
  description:
    'Portal informasi resmi desa. Sarana komunikasi antara pemerintah desa dan masyarakat.',
  showCredit: true,
  creditText:
    'Website ini dikembangkan sebagai bagian dari Program Kerja Kuliah Kerja Terpadu (KKT).',
  programName: 'Kuliah Kerja Terpadu (KKT)',
  showDeveloperLink: true,
  developerLinkLabel: 'Tentang Tim Pengembang',
  developerLinkUrl: '/about-developer',
  bottomText: '© {year} {village}. Seluruh hak cipta dilindungi.',
  columns: [
    {
      title: 'Profil Desa',
      links: [
        { label: 'Sejarah', url: '/profil/sejarah' },
        { label: 'Visi & Misi', url: '/profil/visi-misi' },
        { label: 'Geografis', url: '/profil/geografis' },
        { label: 'Demografi', url: '/profil/demografi' },
      ],
    },
    {
      title: 'Pemerintahan',
      links: [
        { label: 'Struktur Organisasi', url: '/pemerintahan/struktur' },
        { label: 'Perangkat Desa', url: '/pemerintahan/perangkat' },
        { label: 'BPD', url: '/pemerintahan/bpd' },
      ],
    },
    {
      title: 'Informasi',
      links: [
        { label: 'Berita', url: '/berita' },
        { label: 'Pengumuman', url: '/pengumuman' },
        { label: 'Agenda', url: '/agenda' },
        { label: 'Transparansi', url: '/transparansi' },
      ],
    },
    {
      title: 'Layanan',
      links: [
        { label: 'Layanan Desa', url: '/layanan' },
        { label: 'Potensi Desa', url: '/potensi-desa' },
        { label: 'Galeri', url: '/galeri' },
        { label: 'Kontak', url: '/kontak' },
      ],
    },
  ],
}

/** Default navigation tree seeded on install (fully editable afterwards). */
export const DEFAULT_MENU: {
  label: string
  url: string
  icon?: string
  children?: { label: string, url: string }[]
}[] = [
  { label: 'Beranda', url: '/' },
  {
    label: 'Profil Desa',
    url: '/profil',
    children: [
      { label: 'Sejarah Desa', url: '/profil/sejarah' },
      { label: 'Visi & Misi', url: '/profil/visi-misi' },
      { label: 'Geografis', url: '/profil/geografis' },
      { label: 'Demografi', url: '/profil/demografi' },
      { label: 'Wilayah Administratif', url: '/profil/wilayah' },
    ],
  },
  {
    label: 'Pemerintahan',
    url: '/pemerintahan',
    children: [
      { label: 'Struktur Organisasi', url: '/pemerintahan/struktur' },
      { label: 'Perangkat Desa', url: '/pemerintahan/perangkat' },
      { label: 'BPD', url: '/pemerintahan/bpd' },
    ],
  },
  {
    label: 'Informasi',
    url: '/berita',
    children: [
      { label: 'Berita', url: '/berita' },
      { label: 'Pengumuman', url: '/pengumuman' },
      { label: 'Agenda', url: '/agenda' },
    ],
  },
  {
    label: 'Potensi Desa',
    url: '/potensi-desa',
    children: [
      { label: 'Wisata', url: '/potensi-desa/wisata' },
      { label: 'UMKM', url: '/potensi-desa/umkm' },
      { label: 'Produk Lokal', url: '/potensi-desa/produk' },
    ],
  },
  { label: 'Transparansi', url: '/transparansi' },
  { label: 'Layanan', url: '/layanan' },
  { label: 'Galeri', url: '/galeri' },
  { label: 'Kontak', url: '/kontak' },
]

export const SITE_LOCALE = 'id-ID'
export const SITE_TZ = 'Asia/Makassar'
