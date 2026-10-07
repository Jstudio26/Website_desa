/**
 * Keep-alive: Supabase (paket gratis) mem-pause project setelah 7 hari tanpa aktivitas.
 * Vercel Cron (lihat vercel.json) memanggil endpoint ini sekali sehari; endpoint menjalankan
 * query sungguhan ke database supaya terhitung sebagai aktivitas.
 *
 * Bila env CRON_SECRET di-set, Vercel otomatis mengirim `Authorization: Bearer <CRON_SECRET>`
 * dan permintaan lain ditolak, sehingga endpoint tidak bisa dipanggil sembarang orang.
 */
export default defineEventHandler(async (event) => {
  const secret = process.env.CRON_SECRET
  if (secret && getHeader(event, 'authorization') !== `Bearer ${secret}`) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const { url, key } = useRuntimeConfig(event).public.supabase as { url: string, key: string }
  setHeader(event, 'Cache-Control', 'no-store')
  try {
    await $fetch(`${url}/rest/v1/settings`, {
      query: { select: 'id', limit: 1 },
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    })
    return { ok: true, at: new Date().toISOString() }
  }
  catch (err) {
    // 503 membuat run cron tercatat gagal di dashboard Vercel, jadi masalahnya kelihatan.
    console.error('[keepalive] Supabase query failed', err)
    throw createError({ statusCode: 503, statusMessage: 'Database tidak dapat dihubungi' })
  }
})
