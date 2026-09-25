<script setup lang="ts">
import 'leaflet/dist/leaflet.css'
import type { Database } from '~/types/supabase'
import type { Neighborhood, NeighborhoodRt } from '~/types/database'
import { formatNumber } from '~/utils/format'

const supabase = useSupabaseClient<Database>()
const { settings } = useSettings()

const { data: neighborhoods } = await useAsyncData('peta-neighborhoods', async () => {
  const { data } = await supabase
    .from('neighborhoods')
    .select('*')
    .order('display_order', { ascending: true })
  return (data ?? []) as Neighborhood[]
})

const { data: rts } = await useAsyncData('peta-rts', async () => {
  const { data } = await supabase
    .from('neighborhood_rts')
    .select('*')
    .order('display_order', { ascending: true })
  return (data ?? []) as NeighborhoodRt[]
})

function rtsFor(neighborhoodId: string) {
  return (rts.value ?? []).filter((rt) => rt.neighborhood_id === neighborhoodId)
}

const mapEl = ref<HTMLElement | null>(null)
let map: import('leaflet').Map | null = null

onMounted(async () => {
  if (!mapEl.value) return
  const L = (await import('leaflet')).default

  const center = settings.value.mapCenter
  map = L.map(mapEl.value).setView(
    [center.lat ?? -1.5, center.lng ?? 124.8],
    center.zoom || 13,
  )
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 19,
  }).addTo(map)

  const bounds: import('leaflet').LatLngExpression[] = []
  for (const n of neighborhoods.value ?? []) {
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
  if (bounds.length && (center.lat == null || center.lng == null)) {
    map.fitBounds(L.latLngBounds(bounds), { padding: [24, 24] })
  }
})

onBeforeUnmount(() => {
  map?.remove()
  map = null
})

useHead({ title: 'Peta Wilayah' })
</script>

<template>
  <div>
    <PageHero
      title="Peta Wilayah"
      :subtitle="`Batas wilayah tiap lingkungan di ${settings.villageName}.`"
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

        <div>
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
        </div>
      </div>
    </section>
  </div>
</template>
