<script setup lang="ts">
import 'leaflet/dist/leaflet.css'
import type { Database } from '~/types/supabase'
import type { Landmark, Neighborhood, NeighborhoodRt } from '~/types/database'
import { LANDMARK_CATEGORIES, landmarkCategory } from '~/config/landmark'
import { formatNumber } from '~/utils/format'

const supabase = useSupabaseClient<Database>()
const { settings } = useSettings()

// Satu useAsyncData dengan query paralel: tiga await berurutan menambah ±0,5 detik ke TTFB.
const { data } = await useAsyncData('peta-data', async () => {
  const [n, r, l] = await Promise.all([
    supabase.from('neighborhoods').select('*').order('display_order', { ascending: true }),
    supabase.from('neighborhood_rts').select('*').order('display_order', { ascending: true }),
    supabase.from('landmarks').select('*').order('name', { ascending: true }),
  ])
  return {
    neighborhoods: (n.data ?? []) as Neighborhood[],
    rts: (r.data ?? []) as NeighborhoodRt[],
    landmarks: (l.data ?? []) as Landmark[],
  }
})
const neighborhoods = computed(() => data.value?.neighborhoods ?? [])
const rts = computed(() => data.value?.rts ?? [])
const landmarks = computed(() => data.value?.landmarks ?? [])

/** Kategori yang punya titik (urut sesuai config) — jadi filter di legenda. */
const landmarkGroups = computed(() => LANDMARK_CATEGORIES
  .map((c) => ({ ...c, count: landmarks.value.filter((l) => landmarkCategory(l.category).value === c.value).length }))
  .filter((c) => c.count > 0))
const hiddenCategories = ref<string[]>([])
function toggleCategory(value: string) {
  hiddenCategories.value = hiddenCategories.value.includes(value)
    ? hiddenCategories.value.filter((v) => v !== value)
    : [...hiddenCategories.value, value]
}

function rtsFor(neighborhoodId: string) {
  return rts.value.filter((rt) => rt.neighborhood_id === neighborhoodId)
}

const mapEl = ref<HTMLElement | null>(null)
let map: import('leaflet').Map | null = null
const categoryLayers = new Map<string, import('leaflet').LayerGroup>()

onMounted(async () => {
  await nextTick()
  if (!mapEl.value) return

  const L = (await import('leaflet')).default

  const center = settings.value.mapCenter
  map = L.map(mapEl.value, { zoomControl: true }).setView(
    [center.lat ?? 1.3, center.lng ?? 124.83],
    center.zoom || 13,
  )

  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 19,
  }).addTo(map)

  // Paksa Leaflet menghitung ulang ukuran container setelah render
  setTimeout(() => map?.invalidateSize(), 100)

  const bounds: import('leaflet').LatLngExpression[] = []
  for (const n of neighborhoods.value) {
    if (!n.boundary) continue
    const layer = L.geoJSON(n.boundary as GeoJSON.Geometry, {
      style: { color: n.color, weight: 2, fillColor: n.color, fillOpacity: 0.25 },
    }).addTo(map)
    const rtCount = rtsFor(n.id).length
    const popup = `
      <div style="font-family:inherit">
        <p style="margin:0;font-weight:700">${n.name}</p>
        ${n.head_name ? `<p style="margin:2px 0 0;font-size:12px;color:#666">Kepala Lingkungan: ${n.head_name}${n.head_phone ? ` (${n.head_phone})` : ''}</p>` : ''}
        ${n.population != null ? `<p style="margin:2px 0 0;font-size:12px;color:#666">Populasi: ${formatNumber(n.population)} jiwa</p>` : ''}
        ${rtCount ? `<p style="margin:2px 0 0;font-size:12px;color:#666">${rtCount} RT</p>` : ''}
      </div>
    `
    layer.bindPopup(popup)
    try {
      const b = layer.getBounds()
      if (b.isValid()) {
        bounds.push(b.getSouthWest())
        bounds.push(b.getNorthEast())
      }
    }
    catch {
      // geometry without valid bounds — skip fit
    }
  }

  // Landmark: satu layer per kategori supaya bisa disembunyikan dari legenda.
  for (const l of landmarks.value) {
    const key = landmarkCategory(l.category).value
    let group = categoryLayers.get(key)
    if (!group) {
      group = L.layerGroup().addTo(map)
      categoryLayers.set(key, group)
    }
    L.marker([l.lat, l.lng], { icon: landmarkIcon(L, l.category), title: l.name, alt: l.name, riseOnHover: true })
      .bindPopup(landmarkPopupHtml(l), { minWidth: 220, maxWidth: 260 })
      .addTo(group)
    bounds.push([l.lat, l.lng])
  }

  if (bounds.length) {
    // Delay fitBounds juga agar tiles sudah siap
    setTimeout(() => {
      if (!map) return
      if (center.lat == null || center.lng == null) {
        map.fitBounds(L.latLngBounds(bounds), { padding: [24, 24] })
      }
    }, 150)
  }
})

watch(hiddenCategories, (hidden) => {
  if (!map) return
  for (const [key, group] of categoryLayers) {
    if (hidden.includes(key)) group.remove()
    else group.addTo(map)
  }
})

onBeforeUnmount(() => {
  categoryLayers.clear()
  map?.remove()
  map = null
})

useHead({
  title: 'Peta Wilayah',
  // Tile peta = elemen LCP; buka koneksi lebih awal.
  link: [{ rel: 'preconnect', href: 'https://tile.openstreetmap.org' }],
})
</script>

<template>
  <div>
    <PageHero
      title="Peta Wilayah"
      :subtitle="`Batas wilayah tiap lingkungan serta lokasi landmark dan fasilitas publik di ${settings.villageName}.`"
      :breadcrumb="[{ label: 'Peta Wilayah' }]"
    />

    <section class="section container-app">
      <div class="grid gap-6 lg:grid-cols-[1fr_280px]">
        <ClientOnly>
          <div ref="mapEl" class="h-[28rem] w-full overflow-hidden rounded-theme border border-line shadow-card sm:h-[34rem]" />
          <template #fallback>
            <UiSkeleton class="h-[28rem] w-full sm:h-[34rem]" />
          </template>
        </ClientOnly>

        <div v-reveal="1">
          <h2 class="font-heading text-lg font-bold text-ink">Legenda</h2>
          <ul v-if="neighborhoods?.length" class="mt-4 space-y-4">
            <li v-for="n in neighborhoods" :key="n.id" class="flex items-start gap-2.5 text-sm">
              <span class="mt-1 h-3 w-3 shrink-0 rounded-sm" :style="{ backgroundColor: n.color }" />
              <span class="min-w-0">
                <span class="block font-medium text-ink">{{ n.name }}</span>
                <span v-if="n.head_name" class="block text-xs text-ink-muted">
                  Kepala: {{ n.head_name }}<span v-if="n.head_phone"> · {{ n.head_phone }}</span>
                </span>
                <span v-if="n.population != null" class="block text-xs text-ink-muted">{{ formatNumber(n.population) }} jiwa</span>
                <details v-if="rtsFor(n.id).length" class="mt-1">
                  <summary class="cursor-pointer text-xs font-medium text-primary">{{ rtsFor(n.id).length }} RT</summary>
                  <ul class="mt-1.5 space-y-1 border-l border-line pl-3">
                    <li v-for="rt in rtsFor(n.id)" :key="rt.id" class="text-xs text-ink-muted">
                      <span class="font-medium text-ink">{{ rt.rt_number }}</span>
                      <span v-if="rt.head_name"> · Ketua: {{ rt.head_name }}</span>
                      <span v-if="rt.phone"> · {{ rt.phone }}</span>
                    </li>
                  </ul>
                </details>
              </span>
            </li>
          </ul>
          <p v-else class="mt-4 text-sm text-ink-muted">Belum ada data lingkungan.</p>

          <template v-if="landmarkGroups.length">
            <h2 class="mt-8 font-heading text-lg font-bold text-ink">Landmark &amp; Fasilitas</h2>
            <p class="mt-1 text-xs text-ink-muted">Klik titik di peta untuk melihat infonya. Ketuk kategori untuk menampilkan atau menyembunyikannya.</p>
            <ul class="mt-3 space-y-1">
              <li v-for="c in landmarkGroups" :key="c.value">
                <button
                  type="button"
                  class="flex w-full items-center gap-2.5 rounded-theme px-2 py-1.5 text-left text-sm transition hover:bg-surface-muted"
                  :class="hiddenCategories.includes(c.value) && 'opacity-50'"
                  :aria-pressed="!hiddenCategories.includes(c.value)"
                  @click="toggleCategory(c.value)"
                >
                  <span class="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary text-white">
                    <AppIcon :name="c.icon" :size="14" />
                  </span>
                  <span class="flex-1 font-medium text-ink" :class="hiddenCategories.includes(c.value) && 'line-through'">{{ c.label }}</span>
                  <span class="text-xs text-ink-muted">{{ c.count }}</span>
                </button>
              </li>
            </ul>
          </template>
        </div>
      </div>
    </section>
  </div>
</template>
