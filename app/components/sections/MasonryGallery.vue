<script setup lang="ts">
import type { SectionProps } from './types'

const props = defineProps<SectionProps>()
useReveal()

const d = computed(() => props.section.data as { title?: string, eyebrow?: string })
const items = computed(() => (props.ctx.gallery?.items ?? []) as { imageUrl: string, caption?: string }[])
</script>

<template>
  <div>
    <div class="mb-10 flex items-end justify-between gap-4">
      <SectionsHeading :eyebrow="d.eyebrow || 'Dokumentasi'" :title="d.title || 'Galeri Kehidupan Desa'" :dark="dark" class="!mb-0" />
      <NuxtLink to="/galeri" class="hidden shrink-0 items-center gap-1.5 text-sm font-medium text-primary hover:underline sm:inline-flex">
        Buka galeri <AppIcon name="arrowRight" :size="15" />
      </NuxtLink>
    </div>

    <div v-if="items.length" class="columns-2 gap-4 md:columns-3 lg:columns-4 [&>*]:mb-4">
      <div
        v-for="(g, i) in items"
        :key="i"
        class="reveal group relative break-inside-avoid overflow-hidden rounded-theme"
      >
        <NuxtImg
          :src="g.imageUrl"
          :alt="g.caption || 'Galeri desa'"
          class="w-full object-cover transition duration-700 group-hover:scale-105"
          sizes="(max-width: 768px) 50vw, 25vw"
        />
        <div v-if="g.caption" class="absolute inset-x-0 bottom-0 translate-y-full bg-gradient-to-t from-black/70 to-transparent p-3 text-xs text-white transition group-hover:translate-y-0">
          {{ g.caption }}
        </div>
      </div>
    </div>

    <p v-else class="text-sm" :class="dark ? 'text-white/60' : 'text-ink-muted'">Galeri belum berisi foto.</p>
  </div>
</template>
