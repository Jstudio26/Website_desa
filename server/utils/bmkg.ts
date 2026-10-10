import { classifyWeather, isNightHour } from '#shared/weather'
import type { WeatherLocation, WeatherPayload, WeatherSlot } from '#shared/weather'

/**
 * Prakiraan cuaca BMKG (https://data.bmkg.go.id/prakiraan-cuaca/).
 * Kode wilayah tingkat IV Kelurahan Matani Tiga, Kec. Tomohon Tengah, Kota Tomohon —
 * diverifikasi: API mengembalikan lokasi.desa = "Matani Tiga".
 */
export const BMKG_ADM4 = '71.73.02.1017'
const ENDPOINT = 'https://api.bmkg.go.id/publik/prakiraan-cuaca'
const DEFAULT_TZ = 'Asia/Makassar'

/** BMKG memperbarui data 2× sehari; 30 menit cukup segar dan jauh di bawah batas 60 req/menit. */
const TTL_MS = 30 * 60_000
/** Respons kosong disimpan sebentar saja supaya cepat pulih bila BMKG sedang memperbarui. */
const EMPTY_TTL_MS = 5 * 60_000
/** Setelah gagal, tunggu sebentar sebelum mencoba BMKG lagi (data lama tetap dikirim). */
const RETRY_AFTER_FAIL_MS = 2 * 60_000
/** Data simpanan lebih tua dari ini tidak lagi dikirim saat BMKG gagal. */
const MAX_STALE_MS = 12 * 60 * 60_000
const TIMEOUT_MS = 7000

type Raw = Record<string, unknown>

const isObj = (v: unknown): v is Raw => typeof v === 'object' && v !== null && !Array.isArray(v)
const str = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim() : null)
function num(v: unknown): number | null {
  const n = typeof v === 'string' && v.trim() ? Number(v) : v
  return typeof n === 'number' && Number.isFinite(n) ? n : null
}

function validTimeZone(tz: string | null): string {
  if (!tz) return DEFAULT_TZ
  try {
    new Intl.DateTimeFormat('en', { timeZone: tz })
    return tz
  }
  catch {
    return DEFAULT_TZ
  }
}

/** Waktu UTC: `datetime` ISO ("…Z") atau `utc_datetime` ("YYYY-MM-DD HH:mm:ss", UTC). */
function parseUtc(item: Raw): number | null {
  const iso = str(item.datetime)
  if (iso) {
    const t = Date.parse(/[zZ]|[+-]\d\d:?\d\d$/.test(iso) ? iso : `${iso}Z`)
    if (Number.isFinite(t)) return t
  }
  const utc = str(item.utc_datetime)
  if (utc) {
    const t = Date.parse(`${utc.replace(' ', 'T')}Z`)
    if (Number.isFinite(t)) return t
  }
  return null
}

const LOCAL_RE = /^(\d{4}-\d{2}-\d{2})[ T](\d{2}):(\d{2})/

/** Tanggal/jam lokal: pakai `local_datetime` BMKG bila valid, kalau tidak hitung dari UTC + zona waktu. */
function localParts(item: Raw, t: number, tz: string) {
  const m = str(item.local_datetime)?.match(LOCAL_RE)
  if (m) return { date: m[1]!, hour: Number(m[2]), minute: m[3]! }
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
    }).formatToParts(new Date(t)).map((p) => [p.type, p.value]),
  )
  return { date: `${parts.year}-${parts.month}-${parts.day}`, hour: Number(parts.hour), minute: String(parts.minute) }
}

function normalizeSlot(item: unknown, tz: string): WeatherSlot | null {
  if (!isObj(item)) return null
  const t = parseUtc(item)
  if (t == null) return null
  const local = localParts(item, t, tz)
  const code = num(item.weather)
  const description = str(item.weather_desc)
  return {
    time: new Date(t).toISOString(),
    localDate: local.date,
    localTime: `${String(local.hour).padStart(2, '0')}:${local.minute}`,
    localHour: local.hour,
    isNight: isNightHour(local.hour),
    temp: num(item.t),
    humidity: num(item.hu),
    windSpeed: num(item.ws),
    windFrom: str(item.wd),
    windDeg: num(item.wd_deg),
    cloudCover: num(item.tcc),
    precipitation: num(item.tp),
    code,
    description,
    condition: classifyWeather(code, description, str(item.weather_desc_en)),
  }
}

/** Ubah respons mentah BMKG menjadi WeatherPayload. Tahan terhadap field yang hilang/berubah bentuk. */
export function normalizeBmkg(raw: unknown, fetchedAt = new Date()): WeatherPayload {
  if (!isObj(raw)) throw new Error('Respons BMKG bukan objek JSON')
  const entries = Array.isArray(raw.data) ? raw.data.filter(isObj) : []
  const entry = entries.find((e) => Array.isArray(e.cuaca)) ?? entries[0]
  const lokasi = isObj(raw.lokasi) ? raw.lokasi : isObj(entry?.lokasi) ? entry.lokasi : {}

  // `lokasi.timezone` di level atas berisi nama IANA ("Asia/Makassar"); yang di dalam data berisi "+0800".
  const timezone = validTimeZone(str(lokasi.timezone))

  // `cuaca` berupa array per hari berisi array per 3 jam; tetap terima bila suatu saat jadi array datar.
  const flat = Array.isArray(entry?.cuaca) ? (entry.cuaca as unknown[]).flat() : []
  const byTime = new Map<string, WeatherSlot>()
  for (const item of flat) {
    const slot = normalizeSlot(item, timezone)
    if (slot) byTime.set(slot.time, slot)
  }
  const slots = [...byTime.values()].sort((a, b) => a.time.localeCompare(b.time))

  // analysis_date dalam UTC tanpa penanda zona; ambil yang terbaru di antara slot.
  let analysis: number | null = null
  for (const item of flat) {
    const a = isObj(item) ? str(item.analysis_date) : null
    const t = a ? Date.parse(/[zZ]$/.test(a) ? a : `${a}Z`) : Number.NaN
    if (Number.isFinite(t) && (analysis == null || t > analysis)) analysis = t
  }

  const location: WeatherLocation = {
    adm4: str(lokasi.adm4) ?? BMKG_ADM4,
    name: str(lokasi.desa) ?? 'Matani Tiga',
    district: str(lokasi.kecamatan),
    city: str(lokasi.kotkab),
    province: str(lokasi.provinsi),
    timezone,
  }

  return {
    location,
    analysisDate: analysis != null ? new Date(analysis).toISOString() : null,
    fetchedAt: fetchedAt.toISOString(),
    stale: false,
    slots,
  }
}

// ---------------- Cache per instance server ----------------
let cache: { payload: WeatherPayload, fetchedAt: number, expires: number } | null = null
let inflight: Promise<WeatherPayload> | null = null

async function fetchFresh(): Promise<WeatherPayload> {
  const raw = await $fetch<unknown>(ENDPOINT, {
    query: { adm4: BMKG_ADM4 },
    headers: { Accept: 'application/json' },
    timeout: TIMEOUT_MS,
    retry: 0,
  })
  return normalizeBmkg(raw)
}

/**
 * Data cuaca dengan cache memori + penggabungan permintaan bersamaan.
 * Bila BMKG gagal, data terakhir yang berhasil (maks. 12 jam) dikirim dengan `stale: true`.
 */
export function getBmkgWeather(): Promise<WeatherPayload> {
  const now = Date.now()
  if (cache && now < cache.expires) return Promise.resolve(cache.payload)
  if (inflight) return inflight

  inflight = fetchFresh()
    .then((payload) => {
      const t = Date.now()
      cache = { payload, fetchedAt: t, expires: t + (payload.slots.length ? TTL_MS : EMPTY_TTL_MS) }
      return payload
    })
    .catch((err: unknown) => {
      console.error('[weather] BMKG request failed:', err instanceof Error ? err.message : err)
      const t = Date.now()
      if (cache && t - cache.fetchedAt < MAX_STALE_MS) {
        cache = { ...cache, payload: { ...cache.payload, stale: true }, expires: t + RETRY_AFTER_FAIL_MS }
        return cache.payload
      }
      throw err
    })
    .finally(() => {
      inflight = null
    })
  return inflight
}
