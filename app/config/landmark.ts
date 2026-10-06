/**
 * Kategori landmark / fasilitas publik di peta. `icon` = nama ikon di utils/icons.ts,
 * `keywords` = kata yang dipakai menebak kategori dari nama/atribut saat import SHP.
 * Kategori yang tidak dikenal (mis. sudah dihapus dari daftar ini) tampil sebagai "Lainnya".
 */
export const LANDMARK_CATEGORIES = [
  { value: 'ibadah', label: 'Tempat Ibadah', icon: 'church', keywords: ['gereja', 'gmim', 'gpdi', 'kgpm', 'gmahk', 'paroki', 'katolik', 'masjid', 'mesjid', 'musholla', 'mushola', 'kapel', 'pura', 'vihara', 'klenteng', 'ibadah', 'jemaat'] },
  { value: 'pendidikan', label: 'Pendidikan', icon: 'graduation', keywords: ['sekolah', ' sd ', 'smp', 'sma', 'smk', ' tk ', 'paud', 'kampus', 'universitas', 'pendidikan', 'madrasah'] },
  { value: 'kesehatan', label: 'Kesehatan', icon: 'health', keywords: ['puskesmas', 'pustu', 'posyandu', 'klinik', 'rumah sakit', ' rs ', 'apotek', 'kesehatan', 'bidan'] },
  { value: 'pemerintahan', label: 'Pemerintahan', icon: 'building', keywords: ['kantor', 'kelurahan', 'kecamatan', 'pemerintah', 'balai', 'polsek', 'koramil', 'pos ronda'] },
  { value: 'olahraga', label: 'Olahraga', icon: 'trophy', keywords: ['lapangan', 'stadion', ' gor ', 'olahraga', 'sport'] },
  { value: 'usaha', label: 'Pasar & Usaha', icon: 'store', keywords: ['pasar', 'toko', 'warung', 'umkm', 'usaha', 'kios', 'minimarket', 'bank'] },
  { value: 'wisata', label: 'Wisata', icon: 'mountain', keywords: ['wisata', 'taman', 'danau', 'bukit', 'air terjun', 'monumen', 'tugu'] },
  { value: 'lainnya', label: 'Lainnya', icon: 'mapPin', keywords: [] as string[] },
] as const

export type LandmarkCategory = typeof LANDMARK_CATEGORIES[number]['value']

export function landmarkCategory(value: string | null | undefined) {
  return LANDMARK_CATEGORIES.find((c) => c.value === value) ?? LANDMARK_CATEGORIES[LANDMARK_CATEGORIES.length - 1]!
}

/** Best guess from free text (feature name / "jenis" attribute); falls back to "lainnya". */
export function guessLandmarkCategory(text: string): LandmarkCategory {
  const t = ` ${text.toLowerCase()} `
  return LANDMARK_CATEGORIES.find((c) => c.keywords.some((k) => t.includes(k)))?.value ?? 'lainnya'
}
