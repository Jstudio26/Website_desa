const BUCKET = 'media'
const MAX_BYTES = 5 * 1024 * 1024
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

/**
 * Downscale to fit `max`×`max` px and re-encode as WebP (keeps transparency).
 * Returns the original when it is already small enough, is a GIF (may be animated),
 * or the browser cannot decode it.
 */
async function shrink(file: File, max: number): Promise<File> {
  if (file.type === 'image/gif') return file
  const bitmap = await createImageBitmap(file).catch(() => null)
  if (!bitmap) return file
  const scale = max / Math.max(bitmap.width, bitmap.height)
  if (scale >= 1) {
    bitmap.close()
    return file
  }
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  canvas.getContext('2d')?.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/webp', 0.9))
  if (!blob || blob.type !== 'image/webp') return file
  return new File([blob], file.name.replace(/\.[^.]+$/, '') + '.webp', { type: 'image/webp' })
}

/** Upload / delete images in the public Supabase `media` bucket. */
export function useMedia() {
  const supabase = useSupabaseClient()

  /**
   * `opts.maxSize`: downscale the longest side to this many px first (e.g. a logo shown at 32px,
   * or a phone photo). The 5 MB limit is checked after shrinking, so big phone photos still fit.
   */
  async function upload(file: File, folder = 'umum', opts: { maxSize?: number } = {}): Promise<string> {
    if (!ALLOWED.includes(file.type)) throw new Error('Format gambar harus JPG, PNG, WEBP, atau GIF.')
    if (opts.maxSize) file = await shrink(file, opts.maxSize)
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
