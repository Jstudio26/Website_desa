<script setup lang="ts">
import type { SectionProps } from './types'
import { interpolate } from './types'

const props = defineProps<SectionProps>()
const { village } = useSiteConfig()

const d = computed(() => props.section.data as {
  title?: string, text?: string, ctaLabel?: string, ctaUrl?: string
})
</script>

<template>
  <div class="relative overflow-hidden rounded-theme bg-gradient-to-br from-primary to-secondary px-6 py-14 text-center text-white sm:px-14 sm:py-20">
    <div class="pattern-batik absolute inset-0 opacity-10" />
    <div class="relative mx-auto max-w-2xl">
      <h2 class="text-fluid-h2 font-bold text-white">
        {{ interpolate(d.title || 'Butuh Layanan Administrasi?', village) }}
      </h2>
      <p class="mx-auto mt-4 max-w-xl text-white/85">
        {{ d.text || 'Akses layanan desa secara digital, ajukan permohonan tanpa antre, dan pantau statusnya dari mana saja.' }}
      </p>
      <UiButton :to="d.ctaUrl || '/layanan'" size="lg" class="mt-8 bg-white text-primary hover:bg-white/90">
        {{ d.ctaLabel || 'Lihat Layanan' }}
        <template #icon><AppIcon name="arrowRight" :size="18" /></template>
      </UiButton>
    </div>
  </div>
</template>
