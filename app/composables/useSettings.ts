import type { SupabaseClient } from '@supabase/supabase-js'
import type { PoskoInfo, PotensiAspect, PotensiProfile, SettingsData } from '~/types/database'
import { DEFAULT_POTENSI_PROFILE } from '~/config/potensiProfile'
import { DEFAULT_LETTER_TYPES } from '~/config/layanan'
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
    male: null,
    female: null,
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
  ageDistribution: {},
  potensi: [],
  potensiProfile: DEFAULT_POTENSI_PROFILE,
  posko: {
    title: 'Posko KKT 149 Matani Tiga 2026',
    university: 'Universitas Sam Ratulangi',
    period: '',
    intro: 'Posko Kuliah Kerja Terpadu (KKT) 149 Universitas Sam Ratulangi di Kelurahan Matani Tiga, tahun 2026.',
    structure: {},
    programs: [],
  },
  mapCenter: { lat: null, lng: null, zoom: 13 },
  officeHours: '',
  letterTypes: DEFAULT_LETTER_TYPES,
}

/** Fill any keys an older stored `posko` object is missing. */
export function withPoskoDefaults(posko: Partial<PoskoInfo> | undefined): PoskoInfo {
  return {
    ...DEFAULT_SETTINGS.posko,
    ...posko,
    structure: posko?.structure ?? {},
    programs: posko?.programs ?? [],
  }
}

/** Fill any keys an older stored `potensiProfile` object is missing. */
export function withPotensiProfileDefaults(p: Partial<PotensiProfile> | undefined): PotensiProfile {
  const d = DEFAULT_POTENSI_PROFILE
  const aspect = (a: Partial<PotensiAspect> | undefined, def: PotensiAspect): PotensiAspect => ({
    overview: a?.overview ?? def.overview,
    strengths: a?.strengths ?? def.strengths,
    weaknesses: a?.weaknesses ?? def.weaknesses,
  })
  return {
    summary: p?.summary ?? d.summary,
    highlights: p?.highlights ?? d.highlights,
    sdm: aspect(p?.sdm, d.sdm),
    sda: aspect(p?.sda, d.sda),
    support: { title: p?.support?.title ?? d.support.title, text: p?.support?.text ?? d.support.text },
    recommendations: p?.recommendations ?? d.recommendations,
    recommendationsNote: p?.recommendationsNote ?? d.recommendationsNote,
    sources: p?.sources ?? d.sources,
  }
}

/**
 * Save part of the settings row. Re-reads the stored row first and merges into it, so a
 * save from one admin page doesn't overwrite fields another page changed meanwhile.
 */
export async function patchSettings(
  supabase: SupabaseClient<Database>,
  update: (current: SettingsData) => Partial<SettingsData>,
) {
  const { data, error } = await supabase.from('settings').select('data').eq('id', 1).maybeSingle()
  if (error) throw error
  const current = { ...DEFAULT_SETTINGS, ...((data?.data as Partial<SettingsData>) ?? {}) }
  const next: SettingsData = { ...current, ...update(current) }
  const { error: saveError } = await supabase
    .from('settings')
    .update({ data: next, updated_at: new Date().toISOString() })
    .eq('id', 1)
  if (saveError) throw saveError
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
