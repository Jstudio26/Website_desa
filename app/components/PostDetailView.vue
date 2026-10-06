<script setup lang="ts">
import type { PostType } from '~/types/database'
import { formatDate } from '~/utils/format'

const props = defineProps<{ type: PostType, label: string }>()
const route = useRoute()
const slug = computed(() => String(route.params.slug))

const { data } = await usePostDetail(props.type, () => slug.value)

if (!data.value?.post) {
  throw createError({ statusCode: 404, statusMessage: `${props.label} tidak ditemukan`, fatal: true })
}

const post = computed(() => data.value!.post!)
const related = computed(() => data.value?.related ?? [])

// Same `key`s as app.vue, so these replace the site-wide tags instead of duplicating them.
useHead(() => ({
  title: post.value.title,
  meta: [
    ...(post.value.excerpt
      ? [
          { name: 'description', content: post.value.excerpt },
          { property: 'og:description', content: post.value.excerpt, key: 'og:description' },
        ]
      : []),
    { property: 'og:title', content: post.value.title },
    ...(post.value.cover_url ? [{ property: 'og:image', content: post.value.cover_url, key: 'og:image' }] : []),
    { property: 'og:type', content: 'article', key: 'og:type' },
  ],
}))
</script>

<template>
  <article>
    <PageHero
      :title="post.title"
      :breadcrumb="[{ label, to: `/${type}` }, { label: post.title }]"
    />

    <div class="section container-app">
      <div class="mx-auto max-w-3xl">
        <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink-muted">
          <span class="inline-flex items-center gap-1.5">
            <AppIcon name="calendar" :size="14" class="text-primary" />
            {{ formatDate(post.published_at || post.created_at, 'long') }}
          </span>
          <span class="inline-flex items-center gap-1.5">
            <span class="h-1 w-1 rounded-full bg-ink-muted/50" />
            {{ label }}
          </span>
        </div>

        <NuxtImg
          v-if="post.cover_url"
          :src="post.cover_url"
          alt=""
          class="mt-6 aspect-[16/9] w-full rounded-theme object-cover shadow-card"
          sizes="820px"
        />

        <p v-if="post.excerpt" class="mt-8 border-l-4 border-primary pl-4 text-lg font-medium leading-relaxed text-ink">
          {{ post.excerpt }}
        </p>

        <RichText :html="post.content" class="mt-8" />

        <div class="mt-14 border-t border-line pt-6">
          <NuxtLink :to="`/${type}`" class="inline-flex items-center gap-1.5 text-sm font-semibold text-primary transition hover:gap-2.5">
            <AppIcon name="arrowLeft" :size="15" /> Kembali ke {{ label }}
          </NuxtLink>
        </div>
      </div>
    </div>

    <section v-if="related.length" class="section bg-surface-muted/50">
      <div class="container-app">
        <h2 v-reveal class="font-heading text-xl font-extrabold">{{ label }} Lainnya</h2>
        <div class="mt-6 grid gap-6 sm:grid-cols-3">
          <NuxtLink
            v-for="(r, i) in related"
            :key="r.id"
            v-reveal="i + 1"
            :to="`/${type}/${r.slug}`"
            class="card card-hover group overflow-hidden"
          >
            <div class="aspect-[16/10] overflow-hidden bg-surface-muted">
              <NuxtImg
                v-if="r.cover_url"
                :src="r.cover_url"
                alt=""
                class="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                sizes="360px"
              />
              <div v-else class="grid h-full place-items-center text-ink-muted/30">
                <AppIcon name="image" :size="28" />
              </div>
            </div>
            <div class="p-5">
              <p class="text-xs text-ink-muted">{{ formatDate(r.published_at) }}</p>
              <h3 class="mt-1 font-heading font-bold leading-snug text-ink transition group-hover:text-primary">{{ r.title }}</h3>
            </div>
          </NuxtLink>
        </div>
      </div>
    </section>
  </article>
</template>
