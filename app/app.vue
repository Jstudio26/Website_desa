<script setup lang="ts">
const { settings } = useSettings()

useHead(() => ({
  titleTemplate: (t) => (t ? `${t} — ${settings.value.villageName}` : settings.value.villageName),
  meta: [
    { name: 'description', content: settings.value.shortDescription },
    { property: 'og:site_name', content: settings.value.villageName },
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
