<script setup lang="ts">
import type { PostType } from '~/types/database'
import { formatDate } from '~/utils/format'

const props = defineProps<{
  type: PostType
  title: string
  subtitle?: string
}>()

const route = useRoute()
const router = useRouter()

const page = ref(Math.max(1, Number(route.query.page) || 1))
const search = ref(String(route.query.q || ''))
const debounced = refDebounced(search, 350)

watch(debounced, () => { page.value = 1 })
watch([page, debounced], () => {
  router.replace({ query: { ...(debounced.value ? { q: debounced.value } : {}), ...(page.value > 1 ? { page: page.value } : {}) } })
})

const { data, pending } = usePostList(() => ({
  type: props.type,
  page: page.value,
  search: debounced.value,
}))

useHead({ title: props.title })
</script>

<template>
  <div>
    <PageHero :title="title" :subtitle="subtitle" :breadcrumb="[{ label: title }]" />

    <section class="section container-app">
      <label class="relative mb-10 block max-w-md">
        <AppIcon name="search" :size="16" class="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted" />
        <input
          v-model="search"
          type="search"
          :placeholder="`Cari ${title.toLowerCase()}…`"
          class="w-full rounded-full border border-line bg-surface py-3 pl-10 pr-4 text-sm shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
        >
      </label>

      <div v-if="pending" class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <UiSkeleton v-for="i in 6" :key="i" class="h-80 rounded-theme" />
      </div>

      <template v-else-if="data && data.items.length">
        <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <NuxtLink
            v-for="p in data.items"
            :key="p.id"
            :to="`/${type}/${p.slug}`"
            class="card card-hover group flex flex-col overflow-hidden"
          >
            <div class="relative aspect-[16/10] overflow-hidden bg-surface-muted">
              <NuxtImg
                v-if="p.cover_url"
                :src="p.cover_url"
                alt=""
                class="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                sizes="420px"
              />
              <div v-else class="grid h-full place-items-center text-ink-muted/30">
                <AppIcon name="image" :size="34" />
              </div>
              <span class="absolute left-3 top-3 rounded-md bg-primary px-2.5 py-1 text-[0.7rem] font-bold uppercase tracking-wide text-white shadow-sm">
                {{ formatDate(p.published_at || p.created_at) }}
              </span>
            </div>
            <div class="flex flex-1 flex-col p-5">
              <h3 class="font-heading text-lg font-bold leading-snug text-ink transition group-hover:text-primary">
                {{ p.title }}
              </h3>
              <p v-if="p.excerpt" class="mt-2 line-clamp-3 text-sm text-ink-muted">{{ p.excerpt }}</p>
              <span class="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary">
                Selengkapnya <AppIcon name="arrowRight" :size="14" class="transition group-hover:translate-x-1" />
              </span>
            </div>
          </NuxtLink>
        </div>

        <div class="mt-12">
          <UiPagination :page="page" :total-pages="data.totalPages" @update:page="page = $event" />
        </div>
      </template>

      <UiEmptyState
        v-else
        :icon="search ? 'search' : 'news'"
        :title="search ? 'Tidak ditemukan' : `Belum ada ${title.toLowerCase()}`"
        :message="search ? `Tidak ada hasil untuk “${search}”.` : 'Konten akan muncul di sini setelah dipublikasikan.'"
      />
    </section>
  </div>
</template>
