/**
 * Model data prakiraan cuaca BMKG yang sudah dinormalisasi + klasifikasi kondisi.
 * Dipakai server (server/utils/bmkg.ts) dan komponen di app/ lewat alias `#shared/weather`.
 */

export type WeatherCondition =
  | 'clear'
  | 'partly-cloudy'
  | 'cloudy'
  | 'overcast'
  | 'haze'
  | 'fog'
  | 'light-rain'
  | 'moderate-rain'
  | 'heavy-rain'
  | 'thunderstorm'
  | 'unknown'

export interface WeatherSlot {
  /** Waktu prakiraan, ISO 8601 UTC. */
  time: string
  /** Tanggal & jam lokal lokasi (zona waktu BMKG), mis. '2026-10-09' dan '13:00'. */
  localDate: string
  localTime: string
  localHour: number
  isNight: boolean
  /** °C */
  temp: number | null
  /** % */
  humidity: number | null
  /** km/jam */
  windSpeed: number | null
  /** Arah angin DARI, kode kompas BMKG (N, NE, …). */
  windFrom: string | null
  windDeg: number | null
  /** Tutupan awan, % */
  cloudCover: number | null
  /** Curah hujan, mm */
  precipitation: number | null
  code: number | null
  /** Deskripsi resmi BMKG (Bahasa Indonesia). */
  description: string | null
  condition: WeatherCondition
}

export interface WeatherLocation {
  adm4: string
  name: string
  district: string | null
  city: string | null
  province: string | null
  timezone: string
}

export interface WeatherPayload {
  location: WeatherLocation
  /** Waktu produksi prakiraan oleh BMKG, ISO 8601 UTC. */
  analysisDate: string | null
  /** Kapan server terakhir berhasil mengambil data dari BMKG, ISO 8601 UTC. */
  fetchedAt: string
  /** true bila pembaruan terakhir gagal dan yang dikirim adalah data simpanan sebelumnya. */
  stale: boolean
  slots: WeatherSlot[]
}

/**
 * Patokan utama: deskripsi resmi BMKG, dicocokkan persis (setelah huruf kecil + spasi dirapikan).
 * Kode numerik tidak dijadikan patokan utama karena penomorannya sudah pernah berubah:
 * di XML lama 61 = "Hujan Sedang", di API saat ini 61 = "Hujan Ringan".
 */
const BY_DESCRIPTION: Record<string, WeatherCondition> = {
  'cerah': 'clear',
  'cerah berawan': 'partly-cloudy',
  'berawan': 'cloudy',
  'berawan tebal': 'overcast',
  'udara kabur': 'haze',
  'asap': 'haze',
  'kabut': 'fog',
  'hujan ringan': 'light-rain',
  'hujan lokal': 'light-rain',
  'hujan sedang': 'moderate-rain',
  'hujan lebat': 'heavy-rain',
  'hujan sangat lebat': 'heavy-rain',
  'hujan petir': 'thunderstorm',
  'hujan disertai petir': 'thunderstorm',
  // weather_desc_en
  'sunny': 'clear',
  'clear skies': 'clear',
  'partly cloudy': 'partly-cloudy',
  'mostly cloudy': 'cloudy',
  'overcast': 'overcast',
  'mist/haze': 'haze',
  'haze': 'haze',
  'smoke': 'haze',
  'fog': 'fog',
  'light rain': 'light-rain',
  'isolated shower': 'light-rain',
  'moderate rain': 'moderate-rain',
  'rain': 'moderate-rain',
  'heavy rain': 'heavy-rain',
  'thunderstorm': 'thunderstorm',
  'severe thunderstorm': 'thunderstorm',
}

/**
 * Cadangan bila deskripsi kosong/tidak dikenal. 0,1,2,3,10,61,63 terverifikasi dari respons
 * API (Okt 2026); sisanya dari tabel BMKG lama yang tidak bertentangan dengan data saat ini.
 */
const BY_CODE: Record<number, WeatherCondition> = {
  0: 'clear',
  1: 'clear',
  2: 'partly-cloudy',
  3: 'cloudy',
  4: 'overcast',
  5: 'haze',
  10: 'haze',
  45: 'fog',
  60: 'light-rain',
  61: 'light-rain',
  63: 'moderate-rain',
  80: 'light-rain',
  95: 'thunderstorm',
  97: 'thunderstorm',
}

/** Upaya terakhir untuk deskripsi baru; urutan penting (petir sebelum hujan, dst.). */
const KEYWORDS: [RegExp, WeatherCondition][] = [
  [/petir|thunder/, 'thunderstorm'],
  [/sangat lebat|lebat|heavy/, 'heavy-rain'],
  [/sedang|moderate/, 'moderate-rain'],
  [/hujan|gerimis|rain|shower|drizzle/, 'light-rain'],
  [/kabut|fog/, 'fog'],
  [/kabur|asap|haze|smoke|mist/, 'haze'],
  [/berawan tebal|overcast/, 'overcast'],
  [/cerah berawan|partly/, 'partly-cloudy'],
  [/berawan|cloud/, 'cloudy'],
  [/cerah|sunny|clear/, 'clear'],
]

const norm = (s: string | null | undefined) => (s ?? '').toLowerCase().replace(/\s+/g, ' ').trim()

export function classifyWeather(code: number | null, description: string | null, descriptionEn?: string | null): WeatherCondition {
  const id = norm(description)
  const en = norm(descriptionEn)
  const byDesc = BY_DESCRIPTION[id] ?? BY_DESCRIPTION[en]
  if (byDesc) return byDesc
  if (code != null && BY_CODE[code]) return BY_CODE[code]
  const text = `${id} ${en}`.trim()
  if (text) {
    for (const [re, condition] of KEYWORDS) if (re.test(text)) return condition
  }
  return 'unknown'
}

/** Tomohon ±1,3° LU: matahari terbit ~05.50 dan terbenam ~18.00 WITA sepanjang tahun. */
export function isNightHour(hour: number): boolean {
  return hour >= 18 || hour < 6
}
