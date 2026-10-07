<script setup lang="ts">
defineProps<{ title: string, subtitle?: string, image?: string, breadcrumb?: { label: string, to?: string }[] }>()
const { settings } = useSettings()
</script>

<template>
  <section class="grain relative overflow-hidden bg-primary-deep text-white">
    <NuxtImg
      v-if="image"
      :src="image"
      alt=""
      class="absolute inset-0 h-full w-full object-cover opacity-20"
      sizes="sm:100vw md:100vw lg:100vw xl:100vw xxl:100vw"
    />
    <div class="bg-mesh absolute inset-0" />
    <div class="pattern-flag absolute inset-0 opacity-60" />
    <div class="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />

    <div v-reveal class="container-app relative pb-16 pt-28 sm:pb-20 sm:pt-32">
      <nav v-if="breadcrumb?.length" class="mb-4 flex flex-wrap items-center gap-1.5 text-xs text-white/60">
        <NuxtLink to="/" class="transition hover:text-white">Beranda</NuxtLink>
        <template v-for="(b, i) in breadcrumb" :key="i">
          <AppIcon name="chevronRight" :size="12" />
          <NuxtLink v-if="b.to" :to="b.to" class="transition hover:text-white">{{ b.label }}</NuxtLink>
          <span v-else class="text-white/90">{{ b.label }}</span>
        </template>
      </nav>

      <p class="text-[0.7rem] font-bold uppercase tracking-[0.22em] text-white/70">
        {{ settings.villageName }}
      </p>
      <h1 class="mt-2 max-w-3xl text-fluid-h2 font-extrabold tracking-tight text-white">{{ title }}</h1>
      <p v-if="subtitle" class="mt-3 max-w-2xl text-white/75">{{ subtitle }}</p>
    </div>

    <WaveDivider class="relative -mb-px" color="text-canvas" />
  </section>
</template>
