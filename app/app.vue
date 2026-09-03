<script setup lang="ts">
const { village } = useSiteConfig()

useHead(() => ({
  titleTemplate: (t) => (t ? `${t} — ${village.value.villageName}` : `${village.value.villageName}`),
  meta: [
    { name: 'description', content: village.value.shortDescription },
    { property: 'og:site_name', content: village.value.villageName },
    { property: 'og:type', content: 'website' },
    { name: 'theme-color', content: '#155e75' },
  ],
}))
</script>

<template>
  <div>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <UiToaster />
  </div>
</template>
