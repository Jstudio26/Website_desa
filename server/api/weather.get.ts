import { getBmkgWeather } from '../utils/bmkg'

/**
 * Prakiraan cuaca BMKG untuk Kelurahan Matani Tiga, sudah dinormalisasi (lihat shared/weather.ts).
 * Pengunjung tidak pernah memanggil BMKG langsung: ada cache memori di server (30 menit) dan
 * header Cache-Control supaya CDN Vercel ikut menyimpan respons.
 */
export default defineEventHandler(async (event) => {
  try {
    const payload = await getBmkgWeather()
    setHeader(
      event,
      'Cache-Control',
      payload.stale || !payload.slots.length
        ? 'public, max-age=60, s-maxage=120'
        : 'public, max-age=300, s-maxage=1800, stale-while-revalidate=3600',
    )
    return payload
  }
  catch {
    setHeader(event, 'Cache-Control', 'no-store')
    throw createError({ statusCode: 502, statusMessage: 'Data prakiraan cuaca BMKG tidak dapat diambil' })
  }
})
