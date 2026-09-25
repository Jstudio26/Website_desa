<script setup lang="ts">
import type { Database } from '~/types/supabase'
import type { GalleryItem } from '~/types/database'

definePageMeta({ layout: 'admin' })

const supabase = useSupabaseClient<Database>()
const toast = useToast()
const { upload, remove: removeMedia } = useMedia()

const { data: items, pending, refresh } = await useAsyncData('admin-galeri', async () => {
  const { data, error } = await supabase
    .from('gallery')
    .select('*')
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as GalleryItem[]
})

const uploading = ref(false)
async function onFiles(e: Event) {
  const files = Array.from((e.target as HTMLInputElement).files ?? [])
  ;(e.target as HTMLInputElement).value = ''
  if (!files.length) return
  uploading.value = true
  let ok = 0
  try {
    for (const file of files) {
      try {
        const url = await upload(file, 'galeri')
        const { error } = await supabase.from('gallery').insert({ image_url: url, title: file.name.replace(/\.[^.]+$/, '') })
        if (error) throw error
        ok++
      }
      catch (err) {
        toast.error(`Gagal: ${file.name}`, err instanceof Error ? err.message : '')
      }
    }
    if (ok) toast.success(`${ok} foto diunggah`)
    refresh()
  }
  finally {
    uploading.value = false
  }
}

const editItem = ref<GalleryItem | null>(null)
const editForm = reactive({ title: '', caption: '', display_order: 0 })
const modalOpen = ref(false)
function openEdit(it: GalleryItem) {
  editItem.value = it
  editForm.title = it.title ?? ''
  editForm.caption = it.caption ?? ''
  editForm.display_order = it.display_order
  modalOpen.value = true
}
async function saveEdit() {
  if (!editItem.value) return
  const { error } = await supabase.from('gallery').update({
    title: editForm.title.trim() || null,
    caption: editForm.caption.trim() || null,
    display_order: Number(editForm.display_order) || 0,
  }).eq('id', editItem.value.id)
  if (error) { toast.error('Gagal menyimpan', error.message); return }
  toast.success('Tersimpan')
  modalOpen.value = false
  refresh()
}

const confirmId = ref<string | null>(null)
async function removeItem() {
  const it = items.value?.find((x) => x.id === confirmId.value)
  if (!it) return
  const { error } = await supabase.from('gallery').delete().eq('id', it.id)
  if (error) { toast.error('Gagal menghapus', error.message); confirmId.value = null; return }
  await removeMedia(it.image_url)
  toast.success('Foto dihapus')
  confirmId.value = null
  refresh()
}

useHead({ title: 'Galeri' })
</script>

<template>
  <div>
    <AdminPageHeader title="Galeri" description="Kelola foto kegiatan kelurahan.">
      <template #actions>
        <label class="inline-flex cursor-pointer items-center gap-2 rounded-theme bg-primary px-5 py-2.5 text-sm font-medium text-white hover:brightness-110">
          <AppIcon :name="uploading ? 'clock' : 'upload'" :size="15" />
          {{ uploading ? 'Mengunggah…' : 'Unggah Foto' }}
          <input type="file" accept="image/*" multiple class="hidden" :disabled="uploading" @change="onFiles">
        </label>
      </template>
    </AdminPageHeader>

    <div v-if="pending" class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      <UiSkeleton v-for="i in 8" :key="i" class="aspect-square" />
    </div>

    <div v-else-if="items && items.length" class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      <div v-for="it in items" :key="it.id" class="group overflow-hidden rounded-theme border border-line bg-surface">
        <div class="relative aspect-square bg-surface-muted">
          <img :src="it.image_url" :alt="it.title || ''" class="h-full w-full object-cover">
          <div class="absolute inset-0 flex items-center justify-center gap-2 bg-black/40 opacity-0 transition group-hover:opacity-100">
            <button class="grid h-9 w-9 place-items-center rounded-full bg-white text-ink hover:bg-surface-muted" @click="openEdit(it)">
              <AppIcon name="edit" :size="15" />
            </button>
            <button class="grid h-9 w-9 place-items-center rounded-full bg-white text-red-600 hover:bg-surface-muted" @click="confirmId = it.id">
              <AppIcon name="trash" :size="15" />
            </button>
          </div>
        </div>
        <p class="truncate px-3 py-2 text-xs text-ink-muted">{{ it.title || 'Tanpa judul' }}</p>
      </div>
    </div>

    <UiEmptyState v-else title="Belum ada foto" message="Unggah foto pertama untuk galeri kelurahan." />

    <UiModal v-model:open="modalOpen" title="Ubah Foto" size="md">
      <div v-if="editItem" class="space-y-4">
        <img :src="editItem.image_url" alt="" class="max-h-52 w-full rounded-theme object-contain">
        <UiInput v-model="editForm.title" label="Judul" />
        <UiTextarea v-model="editForm.caption" label="Keterangan" :rows="2" />
        <UiInput v-model="editForm.display_order" label="Urutan" type="number" hint="Angka kecil tampil lebih dulu." />
      </div>
      <template #footer>
        <div class="flex justify-end gap-2">
          <UiButton variant="ghost" size="sm" @click="modalOpen = false">Batal</UiButton>
          <UiButton size="sm" @click="saveEdit">Simpan</UiButton>
        </div>
      </template>
    </UiModal>

    <UiConfirmDialog
      :open="!!confirmId"
      danger
      title="Hapus foto"
      message="Foto akan dihapus permanen."
      confirm-label="Hapus"
      @update:open="confirmId = null"
      @confirm="removeItem"
    />
  </div>
</template>
