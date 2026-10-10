import type { WeatherPayload, WeatherSlot } from '#shared/weather'
import { addDays, todayIn } from '~/utils/weatherFormat'

/** BMKG memberi prakiraan per 3 jam: satu slot mewakili ±90 menit di sekitar waktunya. */
const HALF_SLOT_MS = 90 * 60_000
/** BMKG memperbarui 2× sehari; prakiraan yang dibuat > 24 jam lalu dianggap belum diperbarui. */
const OUTDATED_MS = 24 * 60 * 60_000
/** Tab yang dibiarkan terbuka lama mengambil ulang data saat kembali dilihat. */
const REFETCH_AFTER_MS = 30 * 60_000

export interface WeatherDay {
  date: string
  /** 0 = hari ini, 1 = besok, … (berdasarkan tanggal di zona waktu lokasi). */
  offset: number
  slots: WeatherSlot[]
  /** Dihitung dari slot per 3 jam yang tersedia, bukan ringkasan harian BMKG. */
  min: number | null
  max: number | null
}

export type WeatherState = 'loading' | 'error' | 'empty' | 'expired' | 'ready'

/**
 * Prakiraan BMKG untuk beranda. Diambil di browser (server: false) supaya render halaman
 * tidak menunggu BMKG; /api/weather sendiri di-cache di server & CDN.
 */
export function useWeather() {
  const { data, status, error, refresh } = useFetch<WeatherPayload>('/api/weather', {
    key: 'bmkg-weather',
    server: false,
    lazy: true,
  })

  const now = ref(Date.now())
  let loadedAt = Date.now()
  watch(data, () => { loadedAt = Date.now() })

  if (import.meta.client) {
    // Slot "terkini" ikut bergeser bila halaman dibiarkan terbuka.
    useIntervalFn(() => { now.value = Date.now() }, 60_000)
    const visibility = useDocumentVisibility()
    watch(visibility, (v) => {
      if (v !== 'visible') return
      now.value = Date.now()
      if (data.value && Date.now() - loadedAt > REFETCH_AFTER_MS) refresh()
    })
  }

  const timezone = computed(() => data.value?.location.timezone ?? 'Asia/Makassar')

  /** Slot yang belum lewat, urut waktu (server sudah mengurutkan; diurutkan ulang untuk jaga-jaga). */
  const upcoming = computed(() =>
    (data.value?.slots ?? [])
      .filter((s) => Date.parse(s.time) + HALF_SLOT_MS > now.value)
      .sort((a, b) => Date.parse(a.time) - Date.parse(b.time)),
  )

  /**
   * Prakiraan terdekat dengan waktu sekarang menurut timestamp — bukan sekadar indeks pertama.
   * `isUpcoming` bila slot pertama yang tersedia masih di depan (> 90 menit lagi).
   */
  const current = computed<{ slot: WeatherSlot, isUpcoming: boolean } | null>(() => {
    let best: WeatherSlot | null = null
    let bestDiff = Infinity
    for (const s of upcoming.value) {
      const diff = Math.abs(Date.parse(s.time) - now.value)
      if (diff < bestDiff) { best = s; bestDiff = diff }
    }
    if (!best) return null
    return { slot: best, isUpcoming: bestDiff > HALF_SLOT_MS }
  })

  const next = computed(() => {
    const c = current.value?.slot
    if (!c) return []
    return upcoming.value.filter((s) => s.time > c.time).slice(0, 4)
  })

  const days = computed<WeatherDay[]>(() => {
    const today = todayIn(timezone.value, now.value)
    const groups = new Map<string, WeatherSlot[]>()
    for (const s of upcoming.value) {
      const list = groups.get(s.localDate) ?? []
      list.push(s)
      groups.set(s.localDate, list)
    }
    return [...groups.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(0, 3)
      .map(([date, slots]) => {
        const temps = slots.map((s) => s.temp).filter((t): t is number => t != null)
        let offset = 0
        while (offset < 7 && addDays(today, offset) !== date) offset++
        return {
          date,
          offset: offset < 7 ? offset : -1,
          slots,
          min: temps.length ? Math.min(...temps) : null,
          max: temps.length ? Math.max(...temps) : null,
        }
      })
  })

  const state = computed<WeatherState>(() => {
    if (data.value) {
      if (!data.value.slots.length) return 'empty'
      return current.value ? 'ready' : 'expired'
    }
    if (error.value) return 'error'
    return 'loading'
  })

  const isOutdated = computed(() => {
    const a = data.value?.analysisDate
    return !!a && now.value - Date.parse(a) > OUTDATED_MS
  })

  return { data, status, error, refresh, now, timezone, current, next, days, state, isOutdated }
}
