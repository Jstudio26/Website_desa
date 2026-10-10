import { SITE_LOCALE } from '~/config/site'

/**
 * Format tampilan data cuaca. Semua tanggal/jam memakai zona waktu LOKASI prakiraan
 * (dari BMKG), bukan zona waktu perangkat pengunjung.
 */

const TZ_ABBR: Record<string, string> = {
  'Asia/Jakarta': 'WIB',
  'Asia/Pontianak': 'WIB',
  'Asia/Makassar': 'WITA',
  'Asia/Jayapura': 'WIT',
}

export const tzAbbr = (tz: string) => TZ_ABBR[tz] ?? tz

/** '13:00' → '13.00' (penulisan jam baku Indonesia). */
export const formatClock = (hhmm: string) => hhmm.replace(':', '.')

/** Tanggal kalender 'YYYY-MM-DD' (sudah lokal) → teks; dihitung di UTC agar tidak bergeser. */
export function formatLocalDate(date: string, opts: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'short' }): string {
  const [y, m, d] = date.split('-').map(Number)
  if (!y || !m || !d) return date
  return new Intl.DateTimeFormat(SITE_LOCALE, { ...opts, timeZone: 'UTC' }).format(new Date(Date.UTC(y, m - 1, d)))
}

/** Tanggal kalender hari ini di zona waktu `tz`, format 'YYYY-MM-DD'. */
export function todayIn(tz: string, now: number): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(now))
}

export function addDays(date: string, days: number): string {
  const [y, m, d] = date.split('-').map(Number)
  return new Date(Date.UTC(y ?? 1970, (m ?? 1) - 1, (d ?? 1) + days)).toISOString().slice(0, 10)
}

/** Waktu ISO → '9 Okt, 08.00 WITA' di zona waktu lokasi. */
export function formatInstant(iso: string, tz: string): string {
  const parts = new Intl.DateTimeFormat(SITE_LOCALE, {
    timeZone: tz, day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(new Date(iso))
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? ''
  return `${get('day')} ${get('month')}, ${get('hour')}.${get('minute')} ${tzAbbr(tz)}`
}

export function formatDecimal(value: number, maxFraction = 1): string {
  return new Intl.NumberFormat(SITE_LOCALE, { maximumFractionDigits: maxFraction }).format(value)
}

const COMPASS: Record<string, string> = {
  N: 'Utara', NNE: 'Utara–Timur Laut', NE: 'Timur Laut', ENE: 'Timur–Timur Laut',
  E: 'Timur', ESE: 'Timur–Tenggara', SE: 'Tenggara', SSE: 'Selatan–Tenggara',
  S: 'Selatan', SSW: 'Selatan–Barat Daya', SW: 'Barat Daya', WSW: 'Barat–Barat Daya',
  W: 'Barat', WNW: 'Barat–Barat Laut', NW: 'Barat Laut', NNW: 'Utara–Barat Laut',
}
const EIGHT = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'] as const

/** Arah angin BMKG (`wd` = arah asal angin) → nama arah Indonesia. */
export function windDirection(code: string | null, deg: number | null): string | null {
  if (code && COMPASS[code.toUpperCase()]) return COMPASS[code.toUpperCase()]!
  if (deg == null) return null
  const i = Math.round((((deg % 360) + 360) % 360) / 45) % 8
  return COMPASS[EIGHT[i]!] ?? null
}

/** Jam lokal → bagian hari. */
export function dayPart(hour: number): string {
  if (hour < 5) return 'Dini hari'
  if (hour < 11) return 'Pagi'
  if (hour < 15) return 'Siang'
  if (hour < 18) return 'Sore'
  return 'Malam'
}
