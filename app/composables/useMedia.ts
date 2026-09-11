const BUCKET = 'media'
const MAX_BYTES = 5 * 1024 * 1024
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

/** Upload / delete images in the public Supabase `media` bucket. */
export function useMedia() {
  const supabase = useSupabaseClient()

  async function upload(file: File, folder = 'umum'): Promise<string> {
    if (!ALLOWED.includes(file.type)) throw new Error('Format gambar harus JPG, PNG, WEBP, atau GIF.')
    if (file.size > MAX_BYTES) throw new Error('Ukuran gambar maksimal 5 MB.')

    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '')
    const path = `${folder}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`

    const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
      cacheControl: '31536000',
      contentType: file.type,
      upsert: false,
    })
    if (error) throw new Error(error.message)

    return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl
  }

  /** Best-effort removal; ignores errors (e.g. file already gone). */
  async function remove(publicUrl: string | null | undefined): Promise<void> {
    if (!publicUrl) return
    const marker = `/object/public/${BUCKET}/`
    const idx = publicUrl.indexOf(marker)
    if (idx === -1) return
    const path = decodeURIComponent(publicUrl.slice(idx + marker.length))
    await supabase.storage.from(BUCKET).remove([path]).catch(() => {})
  }

  return { upload, remove }
}
