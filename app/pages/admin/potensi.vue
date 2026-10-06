<script setup lang="ts">
import type { Database } from '~/types/supabase'
import type { PotensiCategory, PotensiItem } from '~/types/database'
import { patchSettings, withPotensiProfileDefaults } from '~/composables/useSettings'

definePageMeta({ layout: 'admin' })

const supabase = useSupabaseClient<Database>()
const toast = useToast()
const { remove: removeMedia } = useMedia()
const { settings, refresh: refreshSettings } = useSettings()

const CATEGORIES: { value: PotensiCategory, label: string }[] = [
  { value: 'sdm', label: 'Sumber Daya Manusia (SDM)' },
  { value: 'sda', label: 'Sumber Daya Alam (SDA)' },
]

const items = computed(() => settings.value.potensi ?? [])
const grouped = computed(() => CATEGORIES.map((c) => ({ ...c, items: items.value.filter((p) => p.category === c.value) })))

async function saveList(list: PotensiItem[]) {
  await patchSettings(supabase, () => ({ potensi: list }))
  await refreshSettings()
}

// ---- Uraian (ringkasan, kekuatan/kendala, rekomendasi) -------------------
// Lists are edited as one item per line. Filled once, like the posko info form, so a
// card save (which refreshes settings) never wipes unsaved text here.
const lines = (list: string[]) => list.join('\n')
const toList = (text: string) => text.split('\n').map((l) => l.trim()).filter(Boolean)
// Angka kunci: one "nilai | keterangan" per line.
const highlightLines = (list: { value: string, label: string }[]) => list.map((h) => `${h.value} | ${h.label}`).join('\n')
const toHighlights = (text: string) => toList(text).map((line) => {
  const [value = '', ...rest] = line.split('|')
  return { value: value.trim(), label: rest.join('|').trim() }
}).filter((h) => h.value && h.label)

const initialProfile = withPotensiProfileDefaults(settings.value.potensiProfile)
const profileForm = reactive({
  summary: initialProfile.summary,
  highlights: highlightLines(initialProfile.highlights),
  sdmOverview: initialProfile.sdm.overview,
  sdmStrengths: lines(initialProfile.sdm.strengths),
  sdmWeaknesses: lines(initialProfile.sdm.weaknesses),
  sdaOverview: initialProfile.sda.overview,
  sdaStrengths: lines(initialProfile.sda.strengths),
  sdaWeaknesses: lines(initialProfile.sda.weaknesses),
  supportTitle: initialProfile.support.title,
  supportText: initialProfile.support.text,
  recommendations: lines(initialProfile.recommendations),
  recommendationsNote: initialProfile.recommendationsNote,
  sources: initialProfile.sources,
})
const savingProfile = ref(false)

async function saveProfile() {
  savingProfile.value = true
  try {
    const f = profileForm
    await patchSettings(supabase, () => ({
      potensiProfile: {
        summary: f.summary.trim(),
        highlights: toHighlights(f.highlights),
        sdm: { overview: f.sdmOverview.trim(), strengths: toList(f.sdmStrengths), weaknesses: toList(f.sdmWeaknesses) },
        sda: { overview: f.sdaOverview.trim(), strengths: toList(f.sdaStrengths), weaknesses: toList(f.sdaWeaknesses) },
        support: { title: f.supportTitle.trim(), text: f.supportText.trim() },
        recommendations: toList(f.recommendations),
        recommendationsNote: f.recommendationsNote.trim(),
        sources: toList(f.sources).join('\n'),
      },
    }))
    await refreshSettings()
    toast.success('Uraian potensi disimpan')
  }
  catch (err) {
    toast.error('Gagal menyimpan', err instanceof Error ? err.message : '')
  }
  finally {
    savingProfile.value = false
  }
}

// ---- Add / edit ----------------------------------------------------------
const modalOpen = ref(false)
const editingId = ref<string | null>(null)
const form = reactive({ category: 'sdm' as PotensiCategory, title: '', description: '' })
const image = useDraftImage('potensi')
const saving = ref(false)

function openNew(category: PotensiCategory = 'sdm') {
  editingId.value = null
  Object.assign(form, { category, title: '', description: '' })
  image.start()
  modalOpen.value = true
}
function openEdit(p: PotensiItem) {
  editingId.value = p.id
  Object.assign(form, { category: p.category, title: p.title, description: p.description })
  image.start(p.imageUrl)
  modalOpen.value = true
}

async function save() {
  if (!form.title.trim()) { toast.error('Judul potensi wajib diisi'); return }
  saving.value = true
  try {
    const row: PotensiItem = {
      id: editingId.value ?? crypto.randomUUID(),
      category: form.category,
      title: form.title.trim(),
      description: form.description.trim(),
      imageUrl: image.url.value,
    }
    const list = editingId.value
      ? items.value.map((p) => (p.id === editingId.value ? row : p))
      : [...items.value, row]
    await saveList(list)
    image.commit()
    toast.success('Potensi disimpan')
    modalOpen.value = false
  }
  catch (err) {
    toast.error('Gagal menyimpan', err instanceof Error ? err.message : '')
  }
  finally {
    saving.value = false
  }
}

function cancel() {
  image.discard()
  modalOpen.value = false
}

// ---- Delete --------------------------------------------------------------
const confirmId = ref<string | null>(null)
async function removeItem() {
  const target = items.value.find((p) => p.id === confirmId.value)
  confirmId.value = null
  if (!target) return
  try {
    await saveList(items.value.filter((p) => p.id !== target.id))
    removeMedia(target.imageUrl)
    toast.success('Potensi dihapus')
  }
  catch (err) {
    toast.error('Gagal menghapus', err instanceof Error ? err.message : '')
  }
}

useHead({ title: 'Potensi Kelurahan' })
</script>

<template>
  <div>
    <AdminPageHeader title="Potensi Kelurahan" description="Kelola uraian kajian serta kartu potensi unggulan SDM dan SDA.">
      <template #actions>
        <UiButton size="sm" @click="openNew()">
          <template #icon><AppIcon name="plus" :size="14" /></template> Tambah Potensi
        </UiButton>
      </template>
    </AdminPageHeader>

    <div class="space-y-6">
      <!-- Uraian potensi -->
      <section class="rounded-theme border border-line bg-surface p-5 sm:p-6">
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 class="font-heading text-lg font-semibold">Uraian Potensi</h2>
            <p class="mt-1 text-sm text-ink-muted">Teks kajian yang tampil di halaman Potensi. Pisahkan paragraf dengan baris kosong; untuk daftar, tulis satu poin per baris.</p>
          </div>
          <UiButton size="sm" variant="outline" to="/potensi">
            <template #icon><AppIcon name="eye" :size="14" /></template> Lihat Halaman
          </UiButton>
        </div>
        <div class="mt-5 space-y-5">
          <UiTextarea v-model="profileForm.summary" label="Ringkasan" :rows="5" />
          <UiTextarea
            v-model="profileForm.highlights"
            label="Angka kunci (satu per baris, format: nilai | keterangan)"
            placeholder="2.207 | Jiwa penduduk"
            :rows="4"
          />

          <div class="grid gap-5 lg:grid-cols-2">
            <div v-for="a in (['sdm', 'sda'] as const)" :key="a" class="space-y-4 rounded-theme border border-line p-4">
              <p class="text-sm font-semibold text-ink">{{ a === 'sdm' ? 'Sumber Daya Manusia (SDM)' : 'Sumber Daya Alam (SDA)' }}</p>
              <UiTextarea v-model="profileForm[a === 'sdm' ? 'sdmOverview' : 'sdaOverview']" label="Uraian" :rows="7" />
              <UiTextarea v-model="profileForm[a === 'sdm' ? 'sdmStrengths' : 'sdaStrengths']" label="Kekuatan (satu per baris, opsional)" :rows="4" />
              <UiTextarea v-model="profileForm[a === 'sdm' ? 'sdmWeaknesses' : 'sdaWeaknesses']" label="Kendala (satu per baris, opsional)" :rows="4" />
            </div>
          </div>

          <div class="space-y-4 rounded-theme border border-line p-4">
            <p class="text-sm font-semibold text-ink">Bagian pendukung (tampil setelah SDA)</p>
            <UiInput v-model="profileForm.supportTitle" label="Judul" />
            <UiTextarea v-model="profileForm.supportText" label="Uraian" :rows="7" />
          </div>

          <UiTextarea v-model="profileForm.recommendations" label="Rekomendasi (satu per baris, opsional)" :rows="4" />
          <UiTextarea v-model="profileForm.recommendationsNote" label="Catatan penutup rekomendasi" :rows="2" />
          <UiTextarea v-model="profileForm.sources" label="Sumber data (satu per baris)" :rows="3" />
          <UiButton size="sm" :loading="savingProfile" @click="saveProfile">Simpan Uraian</UiButton>
        </div>
      </section>

      <section v-for="g in grouped" :key="g.value" class="rounded-theme border border-line bg-surface p-5 sm:p-6">
        <div class="flex items-center justify-between gap-3">
          <h2 class="font-heading text-lg font-semibold">{{ g.label }}</h2>
          <UiButton variant="outline" size="sm" @click="openNew(g.value)">
            <template #icon><AppIcon name="plus" :size="14" /></template> Tambah
          </UiButton>
        </div>

        <div v-if="g.items.length" class="mt-4 divide-y divide-line">
          <div v-for="p in g.items" :key="p.id" class="flex items-center gap-3 py-3">
            <div class="h-12 w-16 shrink-0 overflow-hidden rounded-md bg-surface-muted">
              <img v-if="p.imageUrl" :src="p.imageUrl" alt="" class="h-full w-full object-cover">
              <div v-else class="grid h-full place-items-center text-ink-muted/40">
                <AppIcon :name="p.category === 'sda' ? 'leaf' : 'users'" :size="18" />
              </div>
            </div>
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-medium text-ink">{{ p.title }}</p>
              <p class="truncate text-xs text-ink-muted">{{ p.description || 'Tanpa deskripsi' }}</p>
            </div>
            <button class="p-1.5 text-ink-muted hover:text-primary" aria-label="Ubah" @click="openEdit(p)"><AppIcon name="edit" :size="15" /></button>
            <button class="p-1.5 text-ink-muted hover:text-red-500" aria-label="Hapus" @click="confirmId = p.id"><AppIcon name="trash" :size="15" /></button>
          </div>
        </div>
        <p v-else class="mt-4 text-sm text-ink-muted">Belum ada data.</p>
      </section>
    </div>

    <UiModal :open="modalOpen" :title="editingId ? 'Ubah Potensi' : 'Tambah Potensi'" size="md" @update:open="(v: boolean) => { if (!v) cancel() }">
      <div class="space-y-4">
        <UiSelect v-model="form.category" label="Kategori" required :options="CATEGORIES" />
        <UiInput v-model="form.title" label="Judul" required placeholder="Mis. Kelompok tani bunga, Lahan hortikultura" />
        <UiTextarea v-model="form.description" label="Deskripsi" :rows="5" placeholder="Jelaskan potensi ini secara singkat." />
        <div>
          <span class="mb-1.5 block text-sm font-medium text-ink">Foto (opsional)</span>
          <div class="flex items-center gap-3">
            <img v-if="image.url.value" :src="image.url.value" alt="" class="h-16 w-24 rounded-theme border border-line object-cover">
            <label class="cursor-pointer rounded-theme border border-dashed border-line px-4 py-3 text-sm text-ink-muted hover:bg-surface-muted">
              {{ image.uploading.value ? 'Mengunggah…' : image.url.value ? 'Ganti foto' : 'Pilih foto' }}
              <input type="file" accept="image/*" class="hidden" :disabled="image.uploading.value" @change="image.pick">
            </label>
            <button v-if="image.url.value" type="button" class="text-sm text-red-500 hover:underline" @click="image.clear">Hapus</button>
          </div>
        </div>
      </div>
      <template #footer>
        <div class="flex justify-end gap-2">
          <UiButton variant="ghost" size="sm" @click="cancel">Batal</UiButton>
          <UiButton size="sm" :loading="saving" :disabled="image.uploading.value" @click="save">Simpan</UiButton>
        </div>
      </template>
    </UiModal>

    <UiConfirmDialog
      :open="!!confirmId"
      danger
      title="Hapus potensi"
      message="Data potensi ini akan dihapus permanen."
      confirm-label="Hapus"
      @update:open="confirmId = null"
      @confirm="removeItem"
    />
  </div>
</template>
