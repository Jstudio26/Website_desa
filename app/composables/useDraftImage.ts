/**
 * An image field inside an edit form. Uploads right away (so the preview is real), but
 * only deletes files from storage once the outcome is known: the replaced image after a
 * successful save, or a never-saved upload when the form is cancelled.
 */
export function useDraftImage(folder: string) {
  const { upload, remove } = useMedia()
  const toast = useToast()
  const url = ref('')
  const uploading = ref(false)
  let original = ''

  const dropUnsaved = () => {
    if (url.value && url.value !== original) remove(url.value)
  }

  /** Begin editing: `current` is the image already saved on the record ('' for new). */
  function start(current = '') {
    original = current
    url.value = current
  }

  async function pick(e: Event) {
    const input = e.target as HTMLInputElement
    const file = input.files?.[0]
    input.value = ''
    if (!file) return
    uploading.value = true
    try {
      const next = await upload(file, folder)
      dropUnsaved()
      url.value = next
    }
    catch (err) {
      toast.error('Gagal mengunggah', err instanceof Error ? err.message : '')
    }
    finally {
      uploading.value = false
    }
  }

  function clear() {
    dropUnsaved()
    url.value = ''
  }

  /** Call after the record was saved: removes the image that was replaced or cleared. */
  function commit() {
    if (original && original !== url.value) remove(original)
    original = url.value
  }

  /** Call when the form is cancelled: removes an upload that was never saved. */
  function discard() {
    dropUnsaved()
    url.value = original
  }

  return { url, uploading, start, pick, clear, commit, discard }
}
