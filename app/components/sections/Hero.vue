<script setup lang="ts">
import type { SectionProps } from './types'
import { interpolate } from './types'

const props = defineProps<SectionProps>()
const { village } = useSiteConfig()

const d = computed(() => props.section.data as {
  title?: string, subtitle?: string, image?: string
  ctas?: { label: string, url: string }[]
})
const title = computed(() => interpolate(d.value.title || 'Selamat Datang di {village}', village.value))
const subtitle = computed(() => interpolate(d.value.subtitle || village.value.tagline, village.value))
const image = computed(() => d.value.image || 'https://picsum.photos/seed/village-hero/1920/1080')
</script>

<template>
  <div class="relative flex min-h-[92vh] items-center overflow-hidden">
    <NuxtImg
      :src="image"
      alt=""
      class="absolute inset-0 h-full w-full object-cover"
      loading="eager"
      fetchpriority="high"
      sizes="100vw"
    />
    <div class="absolute inset-0 bg-gradient-to-b from-black/55 via-black/35 to-black/75" />
    <div class="pattern-batik absolute inset-0 opacity-10" />

    <div class="container-app relative py-28 text-white">
      <p class="reveal is-visible mb-4 flex items-center gap-3 text-sm font-medium uppercase tracking-[0.25em] text-white/80">
        <span class="h-px w-10 bg-accent" /> Selamat Datang di
      </p>
      <h1 class="reveal is-visible max-w-4xl text-fluid-h1 font-bold text-white drop-shadow-sm">
        {{ title }}
      </h1>
      <p class="reveal is-visible mt-5 max-w-xl text-lg leading-relaxed text-white/85">
        {{ subtitle }}
      </p>
      <div class="reveal is-visible mt-9 flex flex-wrap gap-3">
        <UiButton
          v-for="(c, i) in (d.ctas && d.ctas.length ? d.ctas : [{ label: 'Jelajahi Desa', url: '/profil' }, { label: 'Layanan Digital', url: '/layanan' }])"
          :key="i"
          :to="c.url"
          :variant="i === 0 ? 'primary' : 'outline'"
          size="lg"
          :class="i !== 0 && 'border-white/60 text-white hover:bg-white/10'"
        >
          {{ c.label }}
          <template #icon><AppIcon name="arrowRight" :size="18" /></template>
        </UiButton>
      </div>
    </div>

    <div class="absolute inset-x-0 bottom-6 flex justify-center">
      <span class="flex h-10 w-6 items-start justify-center rounded-full border-2 border-white/50 p-1.5">
        <span class="h-2 w-1 animate-bounce rounded-full bg-white/80" />
      </span>
    </div>
  </div>
</template>
