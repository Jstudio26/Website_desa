<script setup lang="ts">
defineProps<{ title: string, subtitle?: string, image?: string, breadcrumb?: { label: string, to?: string }[] }>()
const { village } = useSiteConfig()
</script>

<template>
  <section class="relative overflow-hidden bg-secondary text-white">
    <NuxtImg
      v-if="image"
      :src="image"
      alt=""
      class="absolute inset-0 h-full w-full object-cover opacity-30"
      sizes="100vw"
    />
    <div class="pattern-batik absolute inset-0 opacity-10" />
    <div class="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-primary/20 blur-2xl" />

    <div class="container-app relative py-16 sm:py-20">
      <nav v-if="breadcrumb?.length" class="mb-4 flex flex-wrap items-center gap-1.5 text-xs text-white/60">
        <NuxtLink to="/" class="hover:text-white">Beranda</NuxtLink>
        <template v-for="(b, i) in breadcrumb" :key="i">
          <AppIcon name="chevronRight" :size="12" />
          <NuxtLink v-if="b.to" :to="b.to" class="hover:text-white">{{ b.label }}</NuxtLink>
          <span v-else class="text-white/90">{{ b.label }}</span>
        </template>
      </nav>
      <p class="text-xs font-semibold uppercase tracking-[0.25em] text-accent">
        {{ village.villageName }}
      </p>
      <h1 class="mt-2 max-w-3xl text-fluid-h2 font-bold text-white">{{ title }}</h1>
      <p v-if="subtitle" class="mt-3 max-w-2xl text-white/75">{{ subtitle }}</p>
    </div>
  </section>
</template>
