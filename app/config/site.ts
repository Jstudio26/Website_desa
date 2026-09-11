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
  { id: 'profil', label: 'Profil Desa', url: '/profil', children: [] },
  { id: 'berita', label: 'Berita', url: '/berita', children: [] },
  { id: 'pengumuman', label: 'Pengumuman', url: '/pengumuman', children: [] },
  { id: 'galeri', label: 'Galeri', url: '/galeri', children: [] },
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
    title: 'Desa',
    links: [
      { label: 'Profil Desa', url: '/profil' },
      { label: 'Kontak', url: '/kontak' },
    ],
  },
]

/** {village} and {year} are replaced at render time. */
export const FOOTER_BOTTOM_TEXT = '© {year} {village}. Seluruh hak cipta dilindungi.'
export const FOOTER_DESCRIPTION =
  'Portal informasi resmi desa. Sarana komunikasi antara pemerintah desa dan masyarakat.'

export const SITE_LOCALE = 'id-ID'
