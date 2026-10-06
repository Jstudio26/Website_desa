<script setup lang="ts">
const { settings } = useSettings()
const route = useRoute()
// Origin of the current request: correct on any domain without extra env config.
const origin = useRequestURL().origin

useHead(() => {
  const s = settings.value
  const url = `${origin}${route.path === '/' ? '' : route.path}`
  // `key` lets a page (e.g. a news article) replace these instead of adding a second tag.
  const image = s.heroImageUrl || s.logoUrl
  return {
    titleTemplate: (t) => (t ? `${t} — ${s.villageName}` : s.villageName),
    link: [
      { rel: 'icon', href: s.logoUrl || '/favicon.svg', key: 'icon' },
      { rel: 'canonical', href: url, key: 'canonical' },
    ],
    meta: [
      { name: 'description', content: s.shortDescription },
      { property: 'og:site_name', content: s.villageName },
      { property: 'og:type', content: 'website', key: 'og:type' },
      { property: 'og:url', content: url, key: 'og:url' },
      { property: 'og:description', content: s.shortDescription, key: 'og:description' },
      ...(image ? [{ property: 'og:image', content: image, key: 'og:image' }] : []),
      { property: 'og:locale', content: 'id_ID' },
      { name: 'twitter:card', content: image ? 'summary_large_image' : 'summary' },
      { name: 'theme-color', content: '#C7182D' },
    ],
  }
})
</script>

<template>
  <div>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <UiToaster />
  </div>
</template>
