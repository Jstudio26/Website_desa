import type { SettingsData } from '~/types/database'
import type { Database } from '~/types/supabase'

export const DEFAULT_SETTINGS: SettingsData = {
  villageName: 'Nama Kelurahan',
  tagline: 'Kelurahan yang tumbuh bersama budaya, alam, dan masyarakat.',
  shortDescription:
    'Portal informasi resmi pemerintah kelurahan. Temukan berita, pengumuman, galeri, dan profil kelurahan dalam satu tempat.',
  logoUrl: '',
  heroImageUrl: '',
  history: '<p>Tuliskan sejarah singkat kelurahan di sini melalui menu Admin → Profil Kelurahan.</p>',
  vision: 'Mewujudkan kelurahan yang mandiri, sejahtera, dan berbudaya.',
  mission: [
    'Meningkatkan pelayanan publik',
    'Mendorong ekonomi masyarakat',
    'Melestarikan lingkungan dan budaya',
  ],
  address: 'Kantor Kelurahan',
  phone: '',
  email: '',
  whatsapp: '',
  mapEmbedUrl: '',
  population: null,
  households: null,
  hamlets: null,
  areaKm2: null,
  district: 'Nama Kecamatan',
  regency: 'Nama Kabupaten',
  province: 'Nama Provinsi',
  social: { instagram: '', facebook: '', youtube: '', tiktok: '' },
  demographics: {
    balita0_11: null,
    balita1_2: null,
    balita2_3: null,
    balita3_4: null,
    balita4_5: null,
    ibuHamil: null,
    lansia60_69: null,
    lansia70_79: null,
    lansia80Plus: null,
  },
  mapCenter: { lat: null, lng: null, zoom: 13 },
}

/**
 * Village profile stored as a single row in Supabase `settings` (id = 1).
 * Fetched once per request (SSR) and shared via the `settings` asyncData key.
 */
export function useSettings() {
  const supabase = useSupabaseClient<Database>()

  const { data, refresh, pending } = useAsyncData(
    'settings',
    async () => {
      try {
        const { data, error } = await supabase
          .from('settings')
          .select('data')
          .eq('id', 1)
          .maybeSingle()
        if (error) return DEFAULT_SETTINGS
        return { ...DEFAULT_SETTINGS, ...((data?.data as Partial<SettingsData>) ?? {}) }
      }
      catch {
        return DEFAULT_SETTINGS
      }
    },
    { default: () => DEFAULT_SETTINGS },
  )

  const settings = computed<SettingsData>(() => data.value ?? DEFAULT_SETTINGS)
  return { settings, refresh, pending }
}
