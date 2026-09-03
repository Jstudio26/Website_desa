<script setup lang="ts">
import type { PageSection } from '~~/shared/types/sections'
import type { SectionContext } from '~/components/sections/types'
import { apiFetch } from '~/composables/useApi'

definePageMeta({ transparentHeader: true })

const { village } = useSiteConfig()

const { data: page } = await useAsyncData('page-home', () =>
  apiFetch<{ sections: PageSection[], seoTitle?: string, seoDescription?: string }>('/api/public/pages/home')
    .catch(() => ({ sections: [] as PageSection[] })),
)
const { data: ctx } = await useAsyncData('home-ctx', () =>
  apiFetch<SectionContext>('/api/public/homepage').catch(() => ({} as SectionContext)),
)

const facts = computed(() => {
  const v = village.value
  return [
    { icon: 'users', label: 'Jumlah Penduduk', value: v.population },
    { icon: 'home', label: 'Kepala Keluarga', value: v.households },
    { icon: 'mapPin', label: 'Jumlah Dusun', value: v.hamlets },
    { icon: 'compass', label: 'Luas Wilayah', value: v.areaKm2, suffix: ' km²' },
  ].filter((f) => f.value != null)
})

useHead(() => ({
  title: village.value.villageName,
  meta: [
    { name: 'description', content: village.value.shortDescription },
    { property: 'og:image', content: (ctx.value?.news as { featured?: { featuredImage?: string } })?.featured?.featuredImage || '' },
  ],
}))
</script>

<template>
  <div>
    <!-- Hero + immersive sections come from the Page Builder -->
    <SectionsRenderer
      v-if="page?.sections?.length"
      :sections="page.sections.filter((s) => s.type === 'hero')"
      :ctx="ctx || {}"
    />

    <!-- Floating quick-facts panel overlapping the hero -->
    <div v-if="facts.length" class="container-app relative z-10 -mt-16 sm:-mt-20">
      <div class="glass grid grid-cols-2 gap-px overflow-hidden rounded-theme shadow-xl md:grid-cols-4">
        <div
          v-for="f in facts"
          :key="f.label"
          class="flex items-center gap-3 bg-surface/80 p-5"
        >
          <span class="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
            <AppIcon :name="f.icon" :size="20" />
          </span>
          <span>
            <span class="block font-heading text-xl font-bold text-ink">
              {{ Number(f.value).toLocaleString('id-ID') }}{{ f.suffix || '' }}
            </span>
            <span class="block text-xs text-ink-muted">{{ f.label }}</span>
          </span>
        </div>
      </div>
    </div>

    <!-- Remaining sections -->
    <SectionsRenderer
      v-if="page?.sections?.length"
      :sections="page.sections.filter((s) => s.type !== 'hero')"
      :ctx="ctx || {}"
    />

    <div v-else class="section container-app text-center text-ink-muted">
      <p>Homepage belum dikonfigurasi. Masuk ke <NuxtLink to="/admin" class="text-primary underline">Admin → Halaman</NuxtLink> untuk menyusun section.</p>
    </div>
  </div>
</template>
