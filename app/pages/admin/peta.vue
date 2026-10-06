<script setup lang="ts">
import 'leaflet/dist/leaflet.css'
import 'leaflet-draw/dist/leaflet.draw.css'
import type { Database } from '~/types/supabase'
import type { Neighborhood, NeighborhoodBoundary, NeighborhoodRt, SettingsData } from '~/types/database'
import { DEFAULT_SETTINGS } from '~/composables/useSettings'
import type { ImportCandidate } from '~/utils/geoImport'

definePageMeta({ layout: 'admin' })

const supabase = useSupabaseClient<Database>()
const toast = useToast()
const { settings, refresh: refreshSettings } = useSettings()

// ---- Import batas dari GeoJSON / SHP (.zip) ----------------------------
// File sumber biasanya berisi banyak wilayah (mis. semua kelurahan se-kota), jadi admin
// memilih dulu poligon mana yang benar-benar lingkungan sebelum disimpan.
// Parsing ada di utils/geoImport.ts.
const shpInput = ref<HTMLInputElement | null>(null)
const importingShp = ref(false)
const importModalOpen = ref(false)
const importCandidates = ref<ImportCandidate[]>([])
const importSearch = ref('')
const savingImport = ref(false)

const filteredCandidates = computed(() => {
  const q = importSearch.value.trim().toLowerCase()
  return q ? importCandidates.value.filter(c => c.name.toLowerCase().includes(q)) : importCandidates.value
})
const selectedCandidates = computed(() => importCandidates.value.filter(c => c.selected))

async function onShpImport(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  importingShp.value = true
  try {
    const parsed = await readBoundaryFile(file)
    importCandidates.value = extractCandidates(parsed, (neighborhoods.value ?? []).map(n => n.name))
    importSearch.value = ''
    importModalOpen.value = true
  }
  catch (err) {
    toast.error('Gagal membaca file', err instanceof Error ? err.message : '')
  }
  finally {
    importingShp.value = false
    if (shpInput.value) shpInput.value.value = ''
  }
}

async function confirmImport() {
  const picked = selectedCandidates.value
  if (!picked.length) return
  savingImport.value = true
  try {
    const startOrder = neighborhoods.value?.length ?? 0
    const rows = picked.map((c, i) => {
      const center = boundaryCenter(c.boundary)
      return {
        name: c.name,
        boundary: c.boundary,
        center_lat: center?.lat ?? null,
        center_lng: center?.lng ?? null,
        display_order: startOrder + i,
      }
    })
    // Satu insert untuk semua baris: berhasil semua atau gagal semua.
    const { error } = await supabase.from('neighborhoods').insert(rows)
    if (error) throw error
    toast.success(`${rows.length} lingkungan diimpor`)
    importModalOpen.value = false
    importCandidates.value = []
    refreshNeighborhoods()
  }
  catch (err) {
    toast.error('Gagal mengimpor', err instanceof Error ? err.message : '')
  }
  finally {
    savingImport.value = false
  }
}

// ---- Neighborhoods list ----------------------------------------------
const { data: neighborhoods, refresh: refreshNeighborhoods } = await useAsyncData('admin-neighborhoods', async () => {
  const { data, error } = await supabase
    .from('neighborhoods')
    .select('*')
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: true })
  if (error) throw error
  return (data ?? []) as Neighborhood[]
})

// ---- Pusat peta default --------------------------------------------------
const centerForm = reactive({ lat: '' as string | number, lng: '' as string | number, zoom: 13 })
watchEffect(() => {
  centerForm.lat = settings.value.mapCenter.lat ?? ''
  centerForm.lng = settings.value.mapCenter.lng ?? ''
  centerForm.zoom = settings.value.mapCenter.zoom ?? 13
})
const savingCenter = ref(false)
async function saveCenter() {
  savingCenter.value = true
  try {
    const payload: SettingsData = {
      ...DEFAULT_SETTINGS,
      ...settings.value,
      mapCenter: {
        lat: centerForm.lat === '' ? null : Number(centerForm.lat),
        lng: centerForm.lng === '' ? null : Number(centerForm.lng),
        zoom: Number(centerForm.zoom) || 13,
      },
    }
    const { error } = await supabase.from('settings').update({ data: payload, updated_at: new Date().toISOString() }).eq('id', 1)
    if (error) throw error
    await refreshSettings()
    toast.success('Pusat peta disimpan')
  }
  catch (e) {
    toast.error('Gagal menyimpan', e instanceof Error ? e.message : '')
  }
  finally {
    savingCenter.value = false
  }
}

// ---- Add / edit neighborhood metadata ---------------------------------
const modalOpen = ref(false)
const editing = ref<Neighborhood | null>(null)
const form = reactive({ name: '', color: '#DC2626', population: '' as string | number, head_name: '', head_phone: '', display_order: 0 })

function newNeighborhood() {
  editing.value = null
  Object.assign(form, { name: '', color: '#DC2626', population: '', head_name: '', head_phone: '', display_order: neighborhoods.value?.length ?? 0 })
  modalOpen.value = true
}
function editNeighborhood(n: Neighborhood) {
  editing.value = n
  Object.assign(form, {
    name: n.name,
    color: n.color,
    population: n.population ?? '',
    head_name: n.head_name ?? '',
    head_phone: n.head_phone ?? '',
    display_order: n.display_order,
  })
  modalOpen.value = true
}
async function saveNeighborhood() {
  if (!form.name.trim()) {
    toast.error('Nama lingkungan wajib diisi')
    return
  }
  const row = {
    name: form.name.trim(),
    color: form.color || '#DC2626',
    population: form.population === '' ? null : Number(form.population),
    head_name: form.head_name.trim() || null,
    head_phone: form.head_phone.trim() || null,
    display_order: Number(form.display_order) || 0,
  }
  const { error } = editing.value
    ? await supabase.from('neighborhoods').update(row).eq('id', editing.value.id)
    : await supabase.from('neighborhoods').insert(row)
  if (error) { toast.error('Gagal menyimpan', error.message); return }
  toast.success('Tersimpan')
  modalOpen.value = false
  refreshNeighborhoods()
}

const confirmId = ref<string | null>(null)
async function removeNeighborhood() {
  if (!confirmId.value) return
  const { error } = await supabase.from('neighborhoods').delete().eq('id', confirmId.value)
  if (error) { toast.error('Gagal menghapus', error.message); confirmId.value = null; return }
  toast.success('Lingkungan dihapus')
  confirmId.value = null
  refreshNeighborhoods()
}

// ---- Boundary drawing --------------------------------------------------
const drawModalOpen = ref(false)
const drawTarget = ref<Neighborhood | null>(null)
const drawMapEl = ref<HTMLElement | null>(null)
const savingBoundary = ref(false)

let L: typeof import('leaflet') | null = null
let drawMap: import('leaflet').Map | null = null
let drawnItems: import('leaflet').FeatureGroup | null = null

async function openDraw(n: Neighborhood) {
  drawTarget.value = n
  drawModalOpen.value = true
  await nextTick()
  await initDrawMap(n)
}

async function initDrawMap(n: Neighborhood) {
  if (!drawMapEl.value) return
  const leafletMod = await import('leaflet')
  L = (leafletMod as unknown as { default?: typeof import('leaflet') }).default ?? leafletMod
  await import('leaflet-draw')

  destroyDrawMap()

  const center = settings.value.mapCenter
  drawMap = L.map(drawMapEl.value).setView([center.lat ?? -1.5, center.lng ?? 124.8], center.zoom || 15)
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 19,
  }).addTo(drawMap)

  drawnItems = new L.FeatureGroup()
  drawMap.addLayer(drawnItems)

  if (n.boundary) {
    const layer = L.geoJSON(n.boundary as GeoJSON.Geometry, { style: { color: n.color, weight: 2 } })
    layer.eachLayer((l) => drawnItems!.addLayer(l))
    try {
      const b = drawnItems.getBounds()
      if (b.isValid()) drawMap.fitBounds(b, { padding: [24, 24] })
    }
    catch { /* no valid bounds yet */ }
  }

  const drawControl = new L.Control.Draw({
    edit: { featureGroup: drawnItems, remove: true },
    draw: {
      polygon: { allowIntersection: false, showArea: true, shapeOptions: { color: n.color } },
      polyline: false,
      rectangle: false,
      circle: false,
      circlemarker: false,
      marker: false,
    },
  })
  drawMap.addControl(drawControl)

  drawMap.on(L.Draw.Event.CREATED, (e: L.LeafletEvent & { layer: L.Layer }) => {
    drawnItems!.addLayer(e.layer)
  })
}

function destroyDrawMap() {
  drawMap?.remove()
  drawMap = null
  drawnItems = null
}

async function saveBoundary() {
  if (!drawTarget.value || !drawnItems || !L) return
  const layers = drawnItems.getLayers()
  if (!layers.length) {
    toast.error('Gambar minimal satu poligon batas wilayah')
    return
  }
  savingBoundary.value = true
  try {
    // Flatten every drawn shape into plain polygon rings — handles a single polygon, several
    // separately-drawn polygons, and re-editing an existing MultiPolygon (which Leaflet hands
    // back as one MultiPolygon feature) without silently dropping any of them.
    const geojson = drawnItems.toGeoJSON() as GeoJSON.FeatureCollection
    const polygonCoords: GeoJSON.Polygon['coordinates'][] = []
    for (const f of geojson.features) {
      if (f.geometry.type === 'Polygon') polygonCoords.push(f.geometry.coordinates)
      else if (f.geometry.type === 'MultiPolygon') polygonCoords.push(...f.geometry.coordinates)
    }
    if (!polygonCoords.length) throw new Error('Poligon tidak valid')

    const geometry: NeighborhoodBoundary = polygonCoords.length > 1
      ? { type: 'MultiPolygon', coordinates: polygonCoords }
      : { type: 'Polygon', coordinates: polygonCoords[0]! }

    const bounds = drawnItems.getBounds()
    const centerPt = bounds.isValid() ? bounds.getCenter() : null

    const { error } = await supabase
      .from('neighborhoods')
      .update({
        boundary: geometry,
        center_lat: centerPt?.lat ?? null,
        center_lng: centerPt?.lng ?? null,
      })
      .eq('id', drawTarget.value.id)
    if (error) throw error
    toast.success('Batas wilayah disimpan')
    drawModalOpen.value = false
    refreshNeighborhoods()
  }
  catch (e) {
    toast.error('Gagal menyimpan batas', e instanceof Error ? e.message : '')
  }
  finally {
    savingBoundary.value = false
  }
}

watch(drawModalOpen, (open) => {
  if (!open) destroyDrawMap()
})
onBeforeUnmount(() => destroyDrawMap())

// ---- RT management -----------------------------------------------------
const rtModalOpen = ref(false)
const rtTarget = ref<Neighborhood | null>(null)
const rts = ref<NeighborhoodRt[]>([])
const rtsLoading = ref(false)

async function openRts(n: Neighborhood) {
  rtTarget.value = n
  rtModalOpen.value = true
  rtsLoading.value = true
  try {
    const { data, error } = await supabase
      .from('neighborhood_rts')
      .select('*')
      .eq('neighborhood_id', n.id)
      .order('display_order', { ascending: true })
    if (error) throw error
    rts.value = (data ?? []) as NeighborhoodRt[]
  }
  catch (err) {
    toast.error('Gagal memuat data RT', err instanceof Error ? err.message : '')
  }
  finally {
    rtsLoading.value = false
  }
}

const rtEditModalOpen = ref(false)
const editingRt = ref<NeighborhoodRt | null>(null)
const rtForm = reactive({ rt_number: '', head_name: '', phone: '', display_order: 0 })

function newRt() {
  editingRt.value = null
  Object.assign(rtForm, { rt_number: '', head_name: '', phone: '', display_order: rts.value.length })
  rtEditModalOpen.value = true
}
function editRt(rt: NeighborhoodRt) {
  editingRt.value = rt
  Object.assign(rtForm, { rt_number: rt.rt_number, head_name: rt.head_name ?? '', phone: rt.phone ?? '', display_order: rt.display_order })
  rtEditModalOpen.value = true
}
async function saveRt() {
  if (!rtTarget.value) return
  if (!rtForm.rt_number.trim()) {
    toast.error('Nomor RT wajib diisi')
    return
  }
  const row = {
    neighborhood_id: rtTarget.value.id,
    rt_number: rtForm.rt_number.trim(),
    head_name: rtForm.head_name.trim() || null,
    phone: rtForm.phone.trim() || null,
    display_order: Number(rtForm.display_order) || 0,
  }
  const { error } = editingRt.value
    ? await supabase.from('neighborhood_rts').update(row).eq('id', editingRt.value.id)
    : await supabase.from('neighborhood_rts').insert(row)
  if (error) { toast.error('Gagal menyimpan', error.message); return }
  toast.success('Tersimpan')
  rtEditModalOpen.value = false
  openRts(rtTarget.value)
}

const confirmRtId = ref<string | null>(null)
async function removeRt() {
  if (!confirmRtId.value || !rtTarget.value) return
  const { error } = await supabase.from('neighborhood_rts').delete().eq('id', confirmRtId.value)
  if (error) { toast.error('Gagal menghapus', error.message); confirmRtId.value = null; return }
  toast.success('RT dihapus')
  confirmRtId.value = null
  openRts(rtTarget.value)
}

useHead({ title: 'Peta Wilayah' })
</script>

<template>
  <div>
    <AdminPageHeader title="Peta Wilayah" description="Kelola lingkungan dan gambar batas wilayahnya.">
      <template #actions>
        <UiButton size="sm" variant="outline" :loading="importingShp" @click="shpInput?.click()">
          <template #icon><AppIcon name="upload" :size="14" /></template> Import Peta
        </UiButton>
        <input ref="shpInput" type="file" accept=".zip,.geojson,.json" class="hidden" @change="onShpImport">

        <UiButton size="sm" @click="newNeighborhood">
          <template #icon><AppIcon name="plus" :size="14" /></template> Tambah Lingkungan
        </UiButton>
      </template>
    </AdminPageHeader>

    <section class="rounded-theme border border-line bg-surface p-5 sm:p-6">
      <h2 class="font-heading text-lg font-semibold">Pusat Peta Default</h2>
      <p class="mt-1 text-sm text-ink-muted">Lokasi awal saat halaman Peta Wilayah dibuka.</p>
      <div class="mt-4 grid gap-4 sm:grid-cols-3">
        <UiInput v-model="centerForm.lat" label="Latitude" type="number" />
        <UiInput v-model="centerForm.lng" label="Longitude" type="number" />
        <UiInput v-model="centerForm.zoom" label="Zoom" type="number" />
      </div>
      <div class="mt-4">
        <UiButton size="sm" :loading="savingCenter" @click="saveCenter">Simpan Pusat Peta</UiButton>
      </div>
    </section>

    <section class="mt-6 rounded-theme border border-line bg-surface p-5 sm:p-6">
      <h2 class="font-heading text-lg font-semibold">Daftar Lingkungan</h2>

      <div v-if="neighborhoods && neighborhoods.length" class="mt-4 divide-y divide-line">
        <div v-for="n in neighborhoods" :key="n.id" class="flex flex-wrap items-center gap-3 py-3">
          <span class="h-5 w-5 shrink-0 rounded-md border border-line" :style="{ backgroundColor: n.color }" />
          <div class="min-w-0 flex-1">
            <p class="truncate text-sm font-medium text-ink">{{ n.name }}</p>
            <p class="truncate text-xs text-ink-muted">
              <span v-if="n.head_name">{{ n.head_name }}</span>
              <span v-if="n.head_name && n.population != null"> · </span>
              <span v-if="n.population != null">{{ n.population }} jiwa</span>
              <span v-if="!n.boundary" class="text-primary"> · Belum ada batas wilayah</span>
            </p>
          </div>
          <UiButton variant="outline" size="sm" @click="openDraw(n)">
            <template #icon><AppIcon name="mapPin" :size="14" /></template> Gambar Batas
          </UiButton>
          <UiButton variant="outline" size="sm" @click="openRts(n)">
            <template #icon><AppIcon name="users" :size="14" /></template> RT
          </UiButton>
          <button class="p-1.5 text-ink-muted hover:text-primary" @click="editNeighborhood(n)"><AppIcon name="edit" :size="15" /></button>
          <button class="p-1.5 text-ink-muted hover:text-red-500" @click="confirmId = n.id"><AppIcon name="trash" :size="15" /></button>
        </div>
      </div>
      <p v-else class="mt-4 text-sm text-ink-muted">Belum ada data lingkungan.</p>
    </section>

    <!-- Modal: tambah/ubah lingkungan -->
    <UiModal v-model:open="modalOpen" :title="editing ? 'Ubah Lingkungan' : 'Tambah Lingkungan'" size="md">
      <div class="space-y-4">
        <UiInput v-model="form.name" label="Nama Lingkungan" required />
        <div class="grid gap-4 sm:grid-cols-2">
          <label class="block">
            <span class="mb-1.5 block text-sm font-medium text-ink">Warna</span>
            <input v-model="form.color" type="color" class="h-11 w-full cursor-pointer rounded-theme border border-line bg-surface px-1.5">
          </label>
          <UiInput v-model="form.population" label="Populasi" type="number" />
        </div>
        <div class="grid gap-4 sm:grid-cols-2">
          <UiInput v-model="form.head_name" label="Kepala Lingkungan" />
          <UiInput v-model="form.head_phone" label="Telepon Kepala Lingkungan" />
        </div>
        <UiInput v-model="form.display_order" label="Urutan" type="number" />
      </div>
      <template #footer>
        <div class="flex justify-end gap-2">
          <UiButton variant="ghost" size="sm" @click="modalOpen = false">Batal</UiButton>
          <UiButton size="sm" @click="saveNeighborhood">Simpan</UiButton>
        </div>
      </template>
    </UiModal>

    <UiConfirmDialog
      :open="!!confirmId"
      danger
      title="Hapus lingkungan"
      message="Data lingkungan beserta batas wilayahnya akan dihapus permanen."
      confirm-label="Hapus"
      @update:open="confirmId = null"
      @confirm="removeNeighborhood"
    />

    <!-- Modal: pilih wilayah yang diimpor -->
    <UiModal v-model:open="importModalOpen" title="Import Batas Wilayah" size="lg">
      <p class="text-sm text-ink-muted">
        File berisi {{ importCandidates.length }} wilayah. Centang hanya yang merupakan lingkungan di kelurahan ini.
      </p>
      <div class="mt-3">
        <UiInput v-model="importSearch" placeholder="Cari nama wilayah…" />
      </div>
      <div class="mt-3 divide-y divide-line rounded-theme border border-line">
        <label
          v-for="c in filteredCandidates"
          :key="c.key"
          class="flex items-center gap-3 px-3 py-2.5 text-sm"
          :class="c.blocked ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:bg-surface-muted'"
        >
          <input v-model="c.selected" type="checkbox" class="h-4 w-4 accent-primary" :disabled="!!c.blocked">
          <span class="flex-1 truncate text-ink">{{ c.name }}</span>
          <span v-if="c.blocked" class="text-xs text-ink-muted">{{ c.blocked === 'exists' ? 'Sudah ada' : 'Nama ganda di file' }}</span>
        </label>
        <p v-if="!filteredCandidates.length" class="px-3 py-4 text-sm text-ink-muted">Tidak ada wilayah yang cocok.</p>
      </div>
      <template #footer>
        <div class="flex items-center justify-between gap-2">
          <span class="text-sm text-ink-muted">{{ selectedCandidates.length }} dipilih</span>
          <div class="flex gap-2">
            <UiButton variant="ghost" size="sm" @click="importModalOpen = false">Batal</UiButton>
            <UiButton size="sm" :loading="savingImport" :disabled="!selectedCandidates.length" @click="confirmImport">
              Impor {{ selectedCandidates.length || '' }} Wilayah
            </UiButton>
          </div>
        </div>
      </template>
    </UiModal>

    <!-- Modal: gambar batas wilayah -->
    <UiModal v-model:open="drawModalOpen" :title="drawTarget ? `Gambar Batas — ${drawTarget.name}` : 'Gambar Batas'" size="xl">
      <p class="mb-3 text-sm text-ink-muted">Gunakan alat poligon di peta untuk menggambar atau mengubah batas wilayah, lalu klik Simpan.</p>
      <div ref="drawMapEl" class="h-[26rem] w-full overflow-hidden rounded-theme border border-line" />
      <template #footer>
        <div class="flex justify-end gap-2">
          <UiButton variant="ghost" size="sm" @click="drawModalOpen = false">Batal</UiButton>
          <UiButton size="sm" :loading="savingBoundary" @click="saveBoundary">Simpan Batas</UiButton>
        </div>
      </template>
    </UiModal>

    <!-- Modal: daftar RT -->
    <UiModal v-model:open="rtModalOpen" :title="rtTarget ? `RT — ${rtTarget.name}` : 'RT'" size="lg">
      <div class="flex items-center justify-between">
        <p class="text-sm text-ink-muted">Kelola RT di dalam lingkungan ini.</p>
        <UiButton size="sm" variant="outline" @click="newRt">
          <template #icon><AppIcon name="plus" :size="14" /></template> Tambah RT
        </UiButton>
      </div>

      <div v-if="rtsLoading" class="mt-4 space-y-2">
        <UiSkeleton class="h-12" /><UiSkeleton class="h-12" />
      </div>
      <div v-else-if="rts.length" class="mt-4 divide-y divide-line">
        <div v-for="rt in rts" :key="rt.id" class="flex items-center gap-3 py-3">
          <div class="min-w-0 flex-1">
            <p class="truncate text-sm font-medium text-ink">{{ rt.rt_number }}</p>
            <p class="truncate text-xs text-ink-muted">
              <span v-if="rt.head_name">Ketua: {{ rt.head_name }}</span>
              <span v-if="rt.head_name && rt.phone"> · </span>
              <span v-if="rt.phone">{{ rt.phone }}</span>
            </p>
          </div>
          <button class="p-1.5 text-ink-muted hover:text-primary" @click="editRt(rt)"><AppIcon name="edit" :size="15" /></button>
          <button class="p-1.5 text-ink-muted hover:text-red-500" @click="confirmRtId = rt.id"><AppIcon name="trash" :size="15" /></button>
        </div>
      </div>
      <p v-else class="mt-4 text-sm text-ink-muted">Belum ada data RT.</p>
    </UiModal>

    <!-- Modal: tambah/ubah RT -->
    <UiModal v-model:open="rtEditModalOpen" :title="editingRt ? 'Ubah RT' : 'Tambah RT'" size="sm">
      <div class="space-y-4">
        <UiInput v-model="rtForm.rt_number" label="Nomor RT" required placeholder="Mis. RT 01" />
        <UiInput v-model="rtForm.head_name" label="Ketua RT" />
        <UiInput v-model="rtForm.phone" label="Telepon" />
        <UiInput v-model="rtForm.display_order" label="Urutan" type="number" />
      </div>
      <template #footer>
        <div class="flex justify-end gap-2">
          <UiButton variant="ghost" size="sm" @click="rtEditModalOpen = false">Batal</UiButton>
          <UiButton size="sm" @click="saveRt">Simpan</UiButton>
        </div>
      </template>
    </UiModal>

    <UiConfirmDialog
      :open="!!confirmRtId"
      danger
      title="Hapus RT"
      message="Data RT akan dihapus permanen."
      confirm-label="Hapus"
      @update:open="confirmRtId = null"
      @confirm="removeRt"
    />
  </div>
</template>
