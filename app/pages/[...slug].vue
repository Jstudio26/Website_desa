<script setup lang="ts">
import type { PageSection } from '~~/shared/types/sections'
import { apiFetch, ApiClientError } from '~/composables/useApi'

/**
 * Generic renderer for any published CMS page created in the Page Builder
 * (Admin → Halaman). Specific file-routes (/berita, /admin, ...) always win;
 * this only handles slugs that have no dedicated page.
 */
const route = useRoute()
const slug = computed(() => (Array.isArray(route.params.slug) ? route.params.slug.join('/') : String(route.params.slug || '')))

interface CmsPage {
  title: string, slug: string, seoTitle?: string, seoDescription?: string, ogImage?: string
  sections: PageSection[]
}

const { data, error } = await useAsyncData(`cms-${slug.value}`, () =>
  apiFetch<CmsPage>(`/api/public/pages/${slug.value}`),
)
if (error.value || !data.value) {
  throw createError({
    statusCode: error.value instanceof ApiClientError ? error.value.status : 404,
    statusMessage: 'Halaman tidak ditemukan',
    fatal: true,
  })
}

useHead(() => ({
  title: data.value!.seoTitle || data.value!.title,
  meta: [
    { name: 'description', content: data.value!.seoDescription || '' },
    { property: 'og:image', content: data.value!.ogImage || '' },
  ],
}))
</script>

<template>
  <div v-if="data">
    <PageHero
      v-if="!data.sections.some((s) => ['hero', 'heroSlider', 'videoHero', 'kktTeam'].includes(s.type))"
      :title="data.title"
    />
    <SectionsRenderer :sections="data.sections" :ctx="{}" />
  </div>
</template>
