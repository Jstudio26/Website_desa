<script setup lang="ts">
import type { SectionProps } from './types'

const props = defineProps<SectionProps>()
useReveal()

const d = computed(() => props.section.data as { title?: string, eyebrow?: string })
const items = computed(() => (props.ctx.umkm ?? []) as Array<{
  slug: string, name: string, description?: string, owner?: string, image?: string, category?: string
}>)
</script>

<template>
  <div>
    <div class="mb-10 flex items-end justify-between gap-4">
      <SectionsHeading :eyebrow="d.eyebrow || 'Ekonomi Warga'" :title="d.title || 'UMKM & Produk Lokal'" :dark="dark" class="!mb-0" />
      <NuxtLink to="/potensi-desa/umkm" class="hidden shrink-0 items-center gap-1.5 text-sm font-medium text-primary hover:underline sm:inline-flex">
        Lihat semua <AppIcon name="arrowRight" :size="15" />
      </NuxtLink>
    </div>

    <div v-if="items.length" class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      <NuxtLink
        v-for="u in items"
        :key="u.slug"
        :to="`/potensi-desa/umkm/${u.slug}`"
        class="reveal group overflow-hidden rounded-theme border border-line bg-surface transition hover:shadow-lg"
      >
        <div class="relative overflow-hidden">
          <NuxtImg
            :src="u.image || 'https://picsum.photos/seed/' + u.slug + '/600/450'"
            :alt="u.name"
            class="aspect-[4/3] w-full object-cover transition duration-700 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, 380px"
          />
          <span v-if="u.category" class="absolute left-3 top-3 rounded-full bg-surface/90 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-primary">
            {{ u.category }}
          </span>
        </div>
        <div class="p-4">
          <h3 class="font-heading text-lg font-semibold text-ink transition group-hover:text-primary">{{ u.name }}</h3>
          <p v-if="u.owner" class="mt-0.5 text-xs text-ink-muted">oleh {{ u.owner }}</p>
          <p class="mt-2 line-clamp-2 text-sm text-ink-muted">{{ u.description }}</p>
        </div>
      </NuxtLink>
    </div>

    <p v-else class="text-sm" :class="dark ? 'text-white/60' : 'text-ink-muted'">Data UMKM belum tersedia.</p>
  </div>
</template>
