<script setup lang="ts">
import { apiFetch, ApiClientError } from '~/composables/useApi'

const route = useRoute()
const slug = computed(() => String(route.params.slug))
const { village } = useSiteConfig()

interface Article {
  slug: string, title: string, excerpt?: string, content: string, featuredImage?: string
  publishedAt?: string, viewCount: number, tags?: string[]
  category?: { name: string, slug: string, color?: string } | null
  author?: { name: string, avatar?: string } | null
}
interface Payload { article: Article, related: Array<{ slug: string, title: string, featuredImage?: string, publishedAt?: string }> }

const { data, error } = await useAsyncData(`news-${slug.value}`, () =>
  apiFetch<Payload>(`/api/public/news/${slug.value}`),
)
if (error.value) {
  throw createError({ statusCode: error.value instanceof ApiClientError ? error.value.status : 404, statusMessage: 'Berita tidak ditemukan', fatal: true })
}

const a = computed(() => data.value!.article)
const fmt = (d?: string) =>
  d ? new Intl.DateTimeFormat('id-ID', { dateStyle: 'long' }).format(new Date(d)) : ''

useHead(() => ({
  title: a.value.title,
  meta: [
    { name: 'description', content: a.value.excerpt || '' },
    { property: 'og:title', content: a.value.title },
    { property: 'og:description', content: a.value.excerpt || '' },
    { property: 'og:image', content: a.value.featuredImage || '' },
    { property: 'og:type', content: 'article' },
    { name: 'twitter:card', content: 'summary_large_image' },
  ],
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'NewsArticle',
        'headline': a.value.title,
        'image': a.value.featuredImage ? [a.value.featuredImage] : [],
        'datePublished': a.value.publishedAt,
        'author': a.value.author ? [{ '@type': 'Person', 'name': a.value.author.name }] : undefined,
        'publisher': { '@type': 'Organization', 'name': village.value.villageName },
      }),
    },
  ],
}))
</script>

<template>
  <article v-if="data" class="bg-surface">
    <PageHero
      :title="a.title"
      :image="a.featuredImage"
      :breadcrumb="[{ label: 'Berita', to: '/berita' }, { label: a.category?.name || 'Artikel' }]"
    />

    <div class="section container-app grid gap-12 lg:grid-cols-[minmax(0,1fr)_300px]">
      <div>
        <div class="mb-6 flex flex-wrap items-center gap-3 text-sm text-ink-muted">
          <UiBadge v-if="a.category" :color="a.category.color">{{ a.category.name }}</UiBadge>
          <span class="flex items-center gap-1"><AppIcon name="calendar" :size="15" /> {{ fmt(a.publishedAt) }}</span>
          <span v-if="a.author" class="flex items-center gap-1"><AppIcon name="user" :size="15" /> {{ a.author.name }}</span>
          <span class="flex items-center gap-1"><AppIcon name="eye" :size="15" /> {{ a.viewCount }}x dibaca</span>
        </div>

        <NuxtImg
          v-if="a.featuredImage"
          :src="a.featuredImage"
          :alt="a.title"
          class="mb-8 aspect-[16/9] w-full rounded-theme object-cover"
          sizes="(max-width: 1024px) 100vw, 760px"
        />

        <div class="prose-village" v-html="a.content" />

        <div v-if="a.tags?.length" class="mt-8 flex flex-wrap gap-2">
          <span v-for="tag in a.tags" :key="tag" class="rounded-full bg-surface-muted px-3 py-1 text-xs text-ink-muted">#{{ tag }}</span>
        </div>
      </div>

      <aside class="space-y-6">
        <div class="rounded-theme border border-line bg-surface-muted/40 p-5">
          <h3 class="font-heading font-semibold">Berita Terkait</h3>
          <ul class="mt-4 space-y-4">
            <li v-for="r in data.related" :key="r.slug">
              <NuxtLink :to="`/berita/${r.slug}`" class="group flex gap-3">
                <NuxtImg
                  :src="r.featuredImage || 'https://picsum.photos/seed/' + r.slug + '/200/200'"
                  :alt="r.title"
                  class="h-16 w-16 shrink-0 rounded-md object-cover"
                  sizes="64px"
                />
                <span class="min-w-0">
                  <span class="line-clamp-2 text-sm font-medium leading-snug transition group-hover:text-primary">{{ r.title }}</span>
                  <span class="mt-1 block text-xs text-ink-muted">{{ fmt(r.publishedAt) }}</span>
                </span>
              </NuxtLink>
            </li>
            <li v-if="!data.related.length" class="text-sm text-ink-muted">Belum ada berita terkait.</li>
          </ul>
        </div>
        <NuxtLink to="/berita" class="flex items-center justify-center gap-1.5 rounded-theme border border-line py-3 text-sm font-medium hover:bg-surface-muted">
          <AppIcon name="arrowRight" :size="15" class="rotate-180" /> Semua Berita
        </NuxtLink>
      </aside>
    </div>
  </article>
</template>
