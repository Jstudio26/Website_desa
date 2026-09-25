/**
 * Static site configuration: navigation + footer.
 * Village identity (name, contact, socials, stats) is editable from the admin
 * panel and lives in the Supabase `settings` table - see composables/useSettings.
 */

export interface NavItem {
  id: string
  label: string
  url: string
  children: { id: string, label: string, url: string }[]
}

export const NAV: NavItem[] = [
  { id: 'home', label: 'Beranda', url: '/', children: [] },
  {
    id: 'kelurahan',
    label: 'Kelurahan',
    url: '/profil',
    children: [
      { id: 'profil', label: 'Profil Kelurahan', url: '/profil' },
      { id: 'data-penduduk', label: 'Data Penduduk', url: '/data-penduduk' },
      { id: 'organisasi', label: 'Organisasi', url: '/organisasi' },
      { id: 'peta', label: 'Peta Wilayah', url: '/peta' },
    ],
  },
  { id: 'berita', label: 'Berita', url: '/berita', children: [] },
  { id: 'pengumuman', label: 'Pengumuman', url: '/pengumuman', children: [] },
  { id: 'galeri', label: 'Galeri', url: '/galeri', children: [] },
  {
    id: 'layanan',
    label: 'Layanan',
    url: '/layanan-surat',
    children: [
      { id: 'layanan-surat', label: 'Layanan Surat', url: '/layanan-surat' },
      { id: 'pengaduan', label: 'Pengaduan', url: '/pengaduan' },
    ],
  },
]

export const FOOTER_COLUMNS: { title: string, links: { label: string, url: string }[] }[] = [
  {
    title: 'Informasi',
    links: [
      { label: 'Berita', url: '/berita' },
      { label: 'Pengumuman', url: '/pengumuman' },
      { label: 'Galeri', url: '/galeri' },
    ],
  },
  {
    title: 'Kelurahan',
    links: [
      { label: 'Profil Kelurahan', url: '/profil' },
      { label: 'Data Penduduk', url: '/data-penduduk' },
      { label: 'Organisasi', url: '/organisasi' },
      { label: 'Peta Wilayah', url: '/peta' },
    ],
  },
  {
    title: 'Layanan',
    links: [
      { label: 'Layanan Surat', url: '/layanan-surat' },
      { label: 'Pengaduan', url: '/pengaduan' },
      { label: 'Kontak', url: '/kontak' },
    ],
  },
]

/** {village} and {year} are replaced at render time. */
export const FOOTER_BOTTOM_TEXT = '© {year} {village}. Seluruh hak cipta dilindungi.'
export const FOOTER_DESCRIPTION =
  'Portal informasi resmi kelurahan. Sarana komunikasi antara pemerintah kelurahan dan masyarakat.'

export const SITE_LOCALE = 'id-ID'
