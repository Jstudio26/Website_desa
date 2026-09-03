<script setup lang="ts">
import { apiFetch } from '~/composables/useApi'
import type { Paginated } from '~~/shared/types/api'

const { isEnabled } = useSiteConfig()
if (!isEnabled('enableNews')) {
  throw createError({ statusCode: 404, statusMessage: 'Modul berita tidak aktif', fatal: true })
}

interface NewsItem {
  slug: string, title: string, excerpt?: string, featuredImage?: string, publishedAt?: string
  category?: { name: string, slug: string, color?: string } | null
  author?: { name: string } | null
}

const route = useRoute()
const router = useRouter()
const page = ref(Number(route.query.page || 1))
const q = ref(String(route.query.q || ''))
const category = ref(String(route.query.category || ''))

const { data: categories } = await useAsyncData('news-cats', () =>
  apiFetch<{ name: string, slug: string, color?: string }[]>('/api/public/news/categories'),
)

const { data, pending, refresh } = await useAsyncData<Paginated<NewsItem>>(
  'news-list',
  () => apiFetch('/api/public/news', { query: { page: page.value, pageSize: 9, q: q.value || undefined, category: category.value || undefined } }),
  { watch: [page, category] },
)

watchDebounced(q, () => { page.value = 1; refresh() }, { debounce: 400 })
watch([page, q, category], () => {
  router.replace({ query: { page: page.value > 1 ? page.value : undefined, q: q.value || undefined, category: category.value || undefined } })
})

const fmt = (d?: string) =>
  d ? new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(d)) : ''

useHead({ title: 'Berita' })
</script>

<template>
  <div>
    <PageHero title="Berita Desa" subtitle="Kabar terbaru seputar pembangunan, kegiatan, dan kehidupan masyarakat desa." />

    <div class="section container-app">
      <div class="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div class="flex flex-wrap gap-2">
          <button
            class="rounded-full border px-3.5 py-1.5 text-sm transition"
            :class="!category ? 'border-primary bg-primary text-white' : 'border-line hover:bg-surface-muted'"
            @click="category = ''; page = 1"
          >
            Semua
          </button>
          <button
            v-for="c in categories"
            :key="c.slug"
            class="rounded-full border px-3.5 py-1.5 text-sm transition"
            :class="category === c.slug ? 'border-primary bg-primary text-white' : 'border-line hover:bg-surface-muted'"
            @click="category = c.slug; page = 1"
          >
            {{ c.name }}
          </button>
        </div>
        <label class="relative w-full sm:w-64">
          <AppIcon name="search" :size="16" class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
          <input
            v-model="q"
            type="search"
            placeholder="Cari berita..."
            class="w-full rounded-theme border border-line bg-surface py-2 pl-9 pr-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          >
        </label>
      </div>

      <div v-if="pending" class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <UiSkeleton v-for="i in 6" :key="i" class="h-72" :lines="1" />
      </div>

      <div v-else-if="data && data.items.length" class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <NuxtLink
          v-for="n in data.items"
          :key="n.slug"
          :to="`/berita/${n.slug}`"
          class="group flex flex-col overflow-hidden rounded-theme border border-line bg-surface transition hover:shadow-lg"
        >
          <div class="overflow-hidden">
            <NuxtImg
              :src="n.featuredImage || 'https://picsum.photos/seed/' + n.slug + '/600/400'"
              :alt="n.title"
              class="aspect-[16/10] w-full object-cover transition duration-700 group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, 400px"
            />
          </div>
          <div class="flex flex-1 flex-col p-5">
            <div class="mb-2 flex items-center gap-2 text-xs text-ink-muted">
              <UiBadge v-if="n.category" :color="n.category.color">{{ n.category.name }}</UiBadge>
              <span>{{ fmt(n.publishedAt) }}</span>
            </div>
            <h3 class="font-heading text-lg font-semibold leading-snug text-ink transition group-hover:text-primary">
              {{ n.title }}
            </h3>
            <p class="mt-2 line-clamp-3 flex-1 text-sm text-ink-muted">{{ n.excerpt }}</p>
            <span class="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary">
              Baca selengkapnya <AppIcon name="arrowRight" :size="15" />
            </span>
          </div>
        </NuxtLink>
      </div>

      <UiEmptyState v-else title="Tidak ada berita" message="Coba ubah kata kunci atau kategori pencarian." />

      <div v-if="data && data.totalPages > 1" class="mt-10">
        <UiPagination :page="page" :total-pages="data.totalPages" @update:page="page = $event" />
      </div>
    </div>
  </div>
</template>
