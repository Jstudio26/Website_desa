<script setup lang="ts">
import 'leaflet/dist/leaflet.css'
import type { Database } from '~/types/supabase'
import type { Landmark } from '~/types/database'
import { LANDMARK_CATEGORIES, landmarkCategory } from '~/config/landmark'
import type { PointCandidate } from '~/utils/geoImport'

definePageMeta({ layout: 'admin' })

const supabase = useSupabaseClient<Database>()
const toast = useToast()
const { remove: removeMedia } = useMedia()
const { settings } = useSettings()

const CATEGORY_OPTIONS = LANDMARK_CATEGORIES.map((c) => ({ value: c.value, label: c.label }))

const { data: landmarks, refresh } = await useAsyncData('admin-landmarks', async () => {
  const { data, error } = await supabase.from('landmarks').select('*').order('name', { ascending: true })
  if (error) throw error
  return (data ?? []) as Landmark[]
})

/** Titik hasil import SHP baru berisi nama + lokasi; tandai yang belum dilengkapi admin. */
const isIncomplete = (l: Landmark) => !l.description && !l.photo_url

// ---- Daftar --------------------------------------------------------------
const search = ref('')
const filterCategory = ref('')
const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  const order = LANDMARK_CATEGORIES.map((c) => c.value as string)
  return (landmarks.value ?? [])
    .filter((l) => !filterCategory.value || landmarkCategory(l.category).value === filterCategory.value)
    .filter((l) => !q || l.name.toLowerCase().includes(q) || (l.address ?? '').toLowerCase().includes(q))
    .sort((a, b) => order.indexOf(landmarkCategory(a.category).value) - order.indexOf(landmarkCategory(b.category).value))
})
const incompleteCount = computed(() => (landmarks.value ?? []).filter(isIncomplete).length)

// ---- Leaflet --------------------------------------------------------------
let L: typeof import('leaflet') | null = null
async function loadLeaflet() {
  if (!L) {
    const mod = await import('leaflet')
    L = (mod as unknown as { default?: typeof import('leaflet') }).default ?? mod
  }
  return L
}
function baseMap(leaflet: typeof import('leaflet'), el: HTMLElement) {
  const center = settings.value.mapCenter
  const m = leaflet.map(el).setView([center.lat ?? 1.3, center.lng ?? 124.83], center.zoom || 15)
  leaflet.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 19,
  }).addTo(m)
  setTimeout(() => m.invalidateSize(), 100)
  return m
}

// Peta ringkasan: semua titik, klik pin untuk mengubah.
const overviewEl = ref<HTMLElement | null>(null)
let overview: import('leaflet').Map | null = null
let overviewPins: import('leaflet').LayerGroup | null = null

function drawOverview(fit: boolean) {
  if (!L || !overview || !overviewPins) return
  overviewPins.clearLayers()
  const list = landmarks.value ?? []
  for (const l of list) {
    L.marker([l.lat, l.lng], { icon: landmarkIcon(L, l.category), title: l.name })
      .on('click', () => openEdit(l))
      .addTo(overviewPins)
  }
  if (fit && list.length) {
    overview.fitBounds(L.latLngBounds(list.map((l) => [l.lat, l.lng])), { padding: [32, 32], maxZoom: 17 })
  }
}

onMounted(async () => {
  const leaflet = await loadLeaflet()
  if (!overviewEl.value) return
  overview = baseMap(leaflet, overviewEl.value)
  overviewPins = leaflet.layerGroup().addTo(overview)
  drawOverview(true)
})
watch(landmarks, () => drawOverview(false))

// ---- Tambah / ubah ---------------------------------------------------------
const modalOpen = ref(false)
const editingId = ref<string | null>(null)
const form = reactive({ name: '', category: 'lainnya' as string, address: '', description: '', lat: '' as string | number, lng: '' as string | number })
const image = useDraftImage('landmark')
const saving = ref(false)

const pickerEl = ref<HTMLElement | null>(null)
let picker: import('leaflet').Map | null = null
let pickerPin: import('leaflet').Marker | null = null

const round6 = (n: number) => Math.round(n * 1e6) / 1e6

function formPoint(): [number, number] | null {
  if (form.lat === '' || form.lng === '') return null
  const lat = Number(form.lat), lng = Number(form.lng)
  return Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180 ? [lat, lng] : null
}

function syncPickerPin() {
  if (!L || !picker) return
  const pt = formPoint()
  if (!pt) {
    pickerPin?.remove()
    pickerPin = null
    return
  }
  if (!pickerPin) {
    pickerPin = L.marker(pt, { draggable: true, icon: landmarkIcon(L, form.category) }).addTo(picker)
    pickerPin.on('dragend', () => {
      const p = pickerPin!.getLatLng()
      form.lat = round6(p.lat)
      form.lng = round6(p.lng)
    })
  }
  else {
    pickerPin.setLatLng(pt)
    pickerPin.setIcon(landmarkIcon(L, form.category))
  }
}
watch(() => [form.lat, form.lng, form.category], syncPickerPin)

async function initPicker() {
  const leaflet = await loadLeaflet()
  if (!pickerEl.value) return
  destroyPicker()
  picker = baseMap(leaflet, pickerEl.value)
  const pt = formPoint()
  if (pt) picker.setView(pt, 17)
  picker.on('click', (e: import('leaflet').LeafletMouseEvent) => {
    form.lat = round6(e.latlng.lat)
    form.lng = round6(e.latlng.lng)
  })
  syncPickerPin()
}
function destroyPicker() {
  picker?.remove()
  picker = null
  pickerPin = null
}

async function openModal(l: Landmark | null) {
  editingId.value = l?.id ?? null
  Object.assign(form, {
    name: l?.name ?? '',
    category: l ? landmarkCategory(l.category).value : 'lainnya',
    address: l?.address ?? '',
    description: l?.description ?? '',
    lat: l?.lat ?? '',
    lng: l?.lng ?? '',
  })
  image.start(l?.photo_url ?? '')
  modalOpen.value = true
  await nextTick()
  await initPicker()
}
const openNew = () => openModal(null)
const openEdit = (l: Landmark) => openModal(l)

async function save() {
  if (!form.name.trim()) { toast.error('Nama landmark wajib diisi'); return }
  const pt = formPoint()
  if (!pt) { toast.error('Lokasi belum ditentukan', 'Klik peta untuk menaruh titik, atau isi latitude & longitude.'); return }
  saving.value = true
  try {
    const row = {
      name: form.name.trim(),
      category: form.category,
      address: form.address.trim() || null,
      description: form.description.trim() || null,
      photo_url: image.url.value || null,
      lat: pt[0],
      lng: pt[1],
    }
    const { error } = editingId.value
      ? await supabase.from('landmarks').update(row).eq('id', editingId.value)
      : await supabase.from('landmarks').insert(row)
    if (error) throw error
    image.commit()
    toast.success('Landmark disimpan')
    modalOpen.value = false
    refresh()
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
watch(modalOpen, (open) => {
  if (!open) destroyPicker()
})
onBeforeUnmount(() => {
  destroyPicker()
  overview?.remove()
  overview = null
})

// ---- Hapus ---------------------------------------------------------------
const confirmId = ref<string | null>(null)
async function removeLandmark() {
  const target = (landmarks.value ?? []).find((l) => l.id === confirmId.value)
  confirmId.value = null
  if (!target) return
  const { error } = await supabase.from('landmarks').delete().eq('id', target.id)
  if (error) { toast.error('Gagal menghapus', error.message); return }
  removeMedia(target.photo_url)
  toast.success('Landmark dihapus')
  refresh()
}

// ---- Import titik dari SHP (.zip) / GeoJSON -------------------------------
// Satu file boleh berisi batas wilayah sekaligus; di sini hanya titiknya yang diambil.
const fileInput = ref<HTMLInputElement | null>(null)
const reading = ref(false)
const importOpen = ref(false)
const candidates = ref<PointCandidate[]>([])
const savingImport = ref(false)
const pickedCandidates = computed(() => candidates.value.filter((c) => c.selected))
const selectable = computed(() => candidates.value.filter((c) => !c.exists))
const allPicked = computed(() => selectable.value.length > 0 && selectable.value.every((c) => c.selected))

function toggleAll() {
  const next = !allPicked.value
  for (const c of selectable.value) c.selected = next
}

async function onImport(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  reading.value = true
  try {
    const parsed = await readBoundaryFile(file)
    candidates.value = extractPointCandidates(parsed, landmarks.value ?? [])
    importOpen.value = true
  }
  catch (err) {
    toast.error('Gagal membaca file', err instanceof Error ? err.message : '')
  }
  finally {
    reading.value = false
    if (fileInput.value) fileInput.value.value = ''
  }
}

async function confirmImport() {
  const picked = pickedCandidates.value
  if (!picked.length) return
  savingImport.value = true
  try {
    const rows = picked.map((c) => ({ name: c.name, category: c.category, lat: c.lat, lng: c.lng }))
    const { error } = await supabase.from('landmarks').insert(rows)
    if (error) throw error
    toast.success(`${rows.length} titik diimpor`, 'Lengkapi deskripsi & foto tiap landmark lewat tombol ubah.')
    importOpen.value = false
    candidates.value = []
    await refresh()
    drawOverview(true)
  }
  catch (err) {
    toast.error('Gagal mengimpor', err instanceof Error ? err.message : '')
  }
  finally {
    savingImport.value = false
  }
}

useHead({ title: 'Landmark & Fasilitas' })
</script>

<template>
  <div>
    <AdminPageHeader title="Landmark & Fasilitas" description="Titik penting di peta beserta info yang muncul saat titik diklik.">
      <template #actions>
        <UiButton size="sm" variant="outline" :loading="reading" @click="fileInput?.click()">
          <template #icon><AppIcon name="upload" :size="14" /></template> Import Titik
        </UiButton>
        <input ref="fileInput" type="file" accept=".zip,.geojson,.json" class="hidden" @change="onImport">
        <UiButton size="sm" @click="openNew">
          <template #icon><AppIcon name="plus" :size="14" /></template> Tambah Landmark
        </UiButton>
      </template>
    </AdminPageHeader>

    <section class="rounded-theme border border-line bg-surface p-5 sm:p-6">
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 class="font-heading text-lg font-semibold">Sebaran Titik</h2>
          <p class="mt-1 text-sm text-ink-muted">Klik pin untuk mengubah info landmark tersebut.</p>
        </div>
        <UiButton size="sm" variant="outline" to="/peta">
          <template #icon><AppIcon name="eye" :size="14" /></template> Lihat Peta Publik
        </UiButton>
      </div>
      <div ref="overviewEl" class="relative z-0 mt-4 h-80 w-full overflow-hidden rounded-theme border border-line" />
    </section>

    <section class="mt-6 rounded-theme border border-line bg-surface p-5 sm:p-6">
      <div class="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 class="font-heading text-lg font-semibold">Daftar Landmark</h2>
          <p v-if="incompleteCount" class="mt-1 text-sm text-ink-muted">
            {{ incompleteCount }} landmark belum punya deskripsi atau foto.
          </p>
        </div>
        <div class="grid w-full gap-2 sm:w-auto sm:grid-cols-[14rem_12rem]">
          <UiInput v-model="search" placeholder="Cari nama atau alamat…" />
          <UiSelect v-model="filterCategory" :options="[{ value: '', label: 'Semua kategori' }, ...CATEGORY_OPTIONS]" />
        </div>
      </div>

      <div v-if="filtered.length" class="mt-4 divide-y divide-line">
        <div v-for="l in filtered" :key="l.id" class="flex items-center gap-3 py-3">
          <div class="h-12 w-16 shrink-0 overflow-hidden rounded-md bg-primary/10">
            <img v-if="l.photo_url" :src="l.photo_url" alt="" class="h-full w-full object-cover">
            <div v-else class="grid h-full place-items-center text-primary">
              <AppIcon :name="landmarkCategory(l.category).icon" :size="18" />
            </div>
          </div>
          <div class="min-w-0 flex-1">
            <p class="truncate text-sm font-medium text-ink">{{ l.name }}</p>
            <p class="truncate text-xs text-ink-muted">
              {{ landmarkCategory(l.category).label }}<span v-if="l.address"> · {{ l.address }}</span>
            </p>
          </div>
          <UiBadge v-if="isIncomplete(l)" class="hidden sm:inline-flex">Info belum lengkap</UiBadge>
          <button class="p-1.5 text-ink-muted hover:text-primary" aria-label="Ubah" @click="openEdit(l)"><AppIcon name="edit" :size="15" /></button>
          <button class="p-1.5 text-ink-muted hover:text-red-500" aria-label="Hapus" @click="confirmId = l.id"><AppIcon name="trash" :size="15" /></button>
        </div>
      </div>
      <p v-else-if="landmarks?.length" class="mt-4 text-sm text-ink-muted">Tidak ada landmark yang cocok.</p>
      <p v-else class="mt-4 text-sm text-ink-muted">
        Belum ada landmark. Import titik dari file SHP (.zip) atau tambahkan satu per satu.
      </p>
    </section>

    <!-- Modal: tambah/ubah landmark -->
    <UiModal :open="modalOpen" :title="editingId ? 'Ubah Landmark' : 'Tambah Landmark'" size="xl" @update:open="(v: boolean) => { if (!v) cancel() }">
      <div class="grid gap-5 lg:grid-cols-2">
        <div class="space-y-4">
          <UiInput v-model="form.name" label="Nama" required placeholder="Mis. GMIM Sion Matani, SD Negeri 1" />
          <UiSelect v-model="form.category" label="Kategori" required :options="CATEGORY_OPTIONS" />
          <UiInput v-model="form.address" label="Alamat / patokan" placeholder="Mis. Jl. Raya Tomohon, Lingkungan II" />
          <UiTextarea v-model="form.description" label="Deskripsi" :rows="5" placeholder="Info yang muncul saat titik diklik: fungsi, jam buka, kontak, sejarah singkat, dll." />
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
        <div>
          <span class="mb-1.5 block text-sm font-medium text-ink">Lokasi <span class="text-red-500">*</span></span>
          <p class="mb-2 text-xs text-ink-muted">Klik peta untuk menaruh titik, atau geser pin yang sudah ada.</p>
          <div ref="pickerEl" class="relative z-0 h-72 w-full overflow-hidden rounded-theme border border-line lg:h-80" />
          <div class="mt-3 grid grid-cols-2 gap-3">
            <UiInput v-model="form.lat" label="Latitude" type="number" />
            <UiInput v-model="form.lng" label="Longitude" type="number" />
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
      title="Hapus landmark"
      message="Titik ini beserta info dan fotonya akan dihapus permanen."
      confirm-label="Hapus"
      @update:open="confirmId = null"
      @confirm="removeLandmark"
    />

    <!-- Modal: pilih titik yang diimpor -->
    <UiModal v-model:open="importOpen" title="Import Titik Landmark" size="lg">
      <p class="text-sm text-ink-muted">
        Ditemukan {{ candidates.length }} titik. Kategori ditebak dari nama/atribut file — periksa dan ubah bila perlu.
        Deskripsi dan foto bisa dilengkapi setelah diimpor.
      </p>
      <div class="mt-3 flex justify-end">
        <button v-if="selectable.length" type="button" class="text-sm font-medium text-primary hover:underline" @click="toggleAll">
          {{ allPicked ? 'Kosongkan pilihan' : 'Pilih semua' }}
        </button>
      </div>
      <div class="mt-2 max-h-[50vh] divide-y divide-line overflow-y-auto rounded-theme border border-line">
        <div
          v-for="c in candidates"
          :key="c.key"
          class="flex flex-wrap items-center gap-3 px-3 py-2.5 text-sm"
          :class="c.exists ? 'opacity-60' : ''"
        >
          <label class="flex min-w-0 flex-1 items-center gap-3" :class="c.exists ? 'cursor-not-allowed' : 'cursor-pointer'">
            <input v-model="c.selected" type="checkbox" class="h-4 w-4 shrink-0 accent-primary" :disabled="c.exists">
            <span class="min-w-0">
              <span class="block truncate text-ink">{{ c.name }}</span>
              <span class="block text-xs text-ink-muted">{{ c.exists ? 'Sudah ada' : `${c.lat.toFixed(5)}, ${c.lng.toFixed(5)}` }}</span>
            </span>
          </label>
          <select
            v-model="c.category"
            :disabled="c.exists"
            class="rounded-theme border border-line bg-surface px-2.5 py-1.5 text-xs text-ink outline-none focus:border-primary"
            :aria-label="`Kategori ${c.name}`"
          >
            <option v-for="o in CATEGORY_OPTIONS" :key="o.value" :value="o.value">{{ o.label }}</option>
          </select>
        </div>
      </div>
      <template #footer>
        <div class="flex items-center justify-between gap-2">
          <span class="text-sm text-ink-muted">{{ pickedCandidates.length }} dipilih</span>
          <div class="flex gap-2">
            <UiButton variant="ghost" size="sm" @click="importOpen = false">Batal</UiButton>
            <UiButton size="sm" :loading="savingImport" :disabled="!pickedCandidates.length" @click="confirmImport">
              Impor {{ pickedCandidates.length || '' }} Titik
            </UiButton>
          </div>
        </div>
      </template>
    </UiModal>
  </div>
</template>
