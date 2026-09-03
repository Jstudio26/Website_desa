<script setup lang="ts">
import type { SectionProps } from './types'

const props = defineProps<SectionProps>()
useReveal()

const d = computed(() => props.section.data as { title?: string, eyebrow?: string })
const items = computed(() => (props.ctx.tourism ?? []) as Array<{
  slug: string, name: string, description?: string, location?: string, coverImage?: string, category?: string
}>)
</script>

<template>
  <div>
    <SectionsHeading
      :eyebrow="d.eyebrow || 'Jelajahi'"
      :title="d.title || 'Destinasi & Potensi Wisata'"
      :dark="dark"
    />

    <div v-if="items.length" class="-mx-4 flex snap-x gap-5 overflow-x-auto px-4 pb-4 lg:mx-0 lg:grid lg:grid-cols-3 lg:overflow-visible lg:px-0">
      <NuxtLink
        v-for="t in items"
        :key="t.slug"
        :to="`/potensi-desa/wisata/${t.slug}`"
        class="reveal group relative w-[78vw] shrink-0 snap-start overflow-hidden rounded-theme sm:w-[46vw] lg:w-auto"
      >
        <NuxtImg
          :src="t.coverImage || 'https://picsum.photos/seed/' + t.slug + '/800/1000'"
          :alt="t.name"
          class="aspect-[3/4] w-full object-cover transition duration-700 group-hover:scale-105"
          sizes="(max-width: 1024px) 80vw, 420px"
        />
        <div class="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
        <div class="absolute inset-x-0 bottom-0 p-5 text-white">
          <span v-if="t.category" class="text-[11px] font-semibold uppercase tracking-widest text-accent">{{ t.category }}</span>
          <h3 class="mt-1 font-heading text-xl font-semibold">{{ t.name }}</h3>
          <p v-if="t.location" class="mt-1 flex items-center gap-1 text-xs text-white/70">
            <AppIcon name="mapPin" :size="13" /> {{ t.location }}
          </p>
          <p class="mt-2 line-clamp-2 text-sm text-white/80">{{ t.description }}</p>
          <span class="mt-3 inline-flex items-center gap-1 text-sm font-medium text-white">
            Selengkapnya <AppIcon name="arrowRight" :size="15" class="transition group-hover:translate-x-1" />
          </span>
        </div>
      </NuxtLink>
    </div>

    <p v-else class="text-sm" :class="dark ? 'text-white/60' : 'text-ink-muted'">Destinasi wisata belum tersedia.</p>
  </div>
</template>
