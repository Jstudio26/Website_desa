<script setup lang="ts">
const route = useRoute()
// The homepage renders its own immersive hero behind a transparent navbar.
const transparentHeader = computed(() => route.meta.transparentHeader === true)
</script>

<template>
  <div class="flex min-h-screen flex-col bg-surface">
    <LayoutTopBar />
    <LayoutSiteHeader :transparent="transparentHeader" :class="transparentHeader ? '-mb-20' : ''" />
    <main class="flex-1">
      <slot />
    </main>
    <LayoutSiteFooter />
  </div>
</template>
