<script setup lang="ts">
import type { SectionProps } from './types'

const props = defineProps<SectionProps>()
useReveal()

const d = computed(() => props.section.data as { title?: string, eyebrow?: string })
const featured = computed(() => props.ctx.news?.featured as NewsCard | null)
const rest = computed(() => (props.ctx.news?.rest ?? []) as NewsCard[])

interface NewsCard {
  slug: string
  title: string
  excerpt?: string
  featuredImage?: string
  publishedAt?: string
  category?: { name: string, color?: string } | null
}
const fmt = (d?: string) =>
  d ? new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(d)) : ''
</script>

<template>
  <div>
    <div class="mb-10 flex items-end justify-between gap-4">
      <SectionsHeading :eyebrow="d.eyebrow || 'Kabar Desa'" :title="d.title || 'Berita Terbaru'" :dark="dark" class="!mb-0" />
      <NuxtLink to="/berita" class="hidden shrink-0 items-center gap-1.5 text-sm font-medium text-primary hover:underline sm:inline-flex">
        Semua berita <AppIcon name="arrowRight" :size="15" />
      </NuxtLink>
    </div>

    <div v-if="featured || rest.length" class="grid gap-6 lg:grid-cols-2">
      <NuxtLink
        v-if="featured"
        :to="`/berita/${featured.slug}`"
        class="reveal group relative overflow-hidden rounded-theme"
      >
        <NuxtImg
          :src="featured.featuredImage || 'https://picsum.photos/seed/feat/1000/800'"
          :alt="featured.title"
          class="aspect-[4/3] w-full object-cover transition duration-700 group-hover:scale-105"
          sizes="(max-width: 1024px) 100vw, 600px"
        />
        <div class="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
        <div class="absolute inset-x-0 bottom-0 p-6 text-white">
          <UiBadge tone="solid" :color="featured.category?.color">{{ featured.category?.name || 'Berita' }}</UiBadge>
          <h3 class="mt-3 font-heading text-2xl font-semibold leading-tight">{{ featured.title }}</h3>
          <p class="mt-2 line-clamp-2 text-sm text-white/80">{{ featured.excerpt }}</p>
          <p class="mt-3 text-xs text-white/60">{{ fmt(featured.publishedAt) }}</p>
        </div>
      </NuxtLink>

      <div class="grid content-start gap-4">
        <NuxtLink
          v-for="n in rest.slice(0, 4)"
          :key="n.slug"
          :to="`/berita/${n.slug}`"
          class="reveal group flex gap-4 rounded-theme border border-line bg-surface p-3 transition hover:shadow-md"
        >
          <NuxtImg
            :src="n.featuredImage || 'https://picsum.photos/seed/' + n.slug + '/300/300'"
            :alt="n.title"
            class="h-24 w-28 shrink-0 rounded-md object-cover"
            sizes="120px"
          />
          <div class="min-w-0">
            <p class="text-xs text-ink-muted">{{ fmt(n.publishedAt) }}</p>
            <h4 class="mt-1 line-clamp-2 font-medium leading-snug text-ink transition group-hover:text-primary">
              {{ n.title }}
            </h4>
          </div>
        </NuxtLink>
      </div>
    </div>

    <UiEmptyState v-else icon="M4 22h16V2H8v20M8 6h8" title="Belum ada berita" message="Berita terbaru akan tampil di sini." />
  </div>
</template>
