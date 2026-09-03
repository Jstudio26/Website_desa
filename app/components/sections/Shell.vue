<script setup lang="ts">
import type { SectionSettings } from '~~/shared/types/sections'

const props = defineProps<{ settings: Partial<SectionSettings> }>()

const s = computed<SectionSettings>(() => ({
  backgroundType: 'transparent',
  backgroundColor: null,
  backgroundGradient: null,
  backgroundImage: null,
  backgroundPattern: null,
  overlay: false,
  overlayOpacity: 0.5,
  spacing: 'lg',
  container: 'normal',
  align: 'left',
  anchorId: null,
  ...props.settings,
}))

const spacing: Record<string, string> = {
  none: 'py-0',
  sm: 'py-8 sm:py-10',
  md: 'py-12 sm:py-16',
  lg: 'py-16 sm:py-24',
  xl: 'py-24 sm:py-32',
}
const container: Record<string, string> = {
  full: 'w-full',
  wide: 'mx-auto w-full max-w-[1400px] px-4 sm:px-6 lg:px-8',
  normal: 'container-app',
  narrow: 'mx-auto w-full max-w-3xl px-4 sm:px-6',
}

const isDark = computed(() => s.value.backgroundType === 'dark')
const rootStyle = computed(() => {
  const st: Record<string, string> = {}
  if (s.value.backgroundType === 'solid' && s.value.backgroundColor) st.backgroundColor = s.value.backgroundColor
  if (s.value.backgroundType === 'gradient') {
    st.backgroundImage = s.value.backgroundGradient
      || 'linear-gradient(135deg, rgb(var(--color-primary)), rgb(var(--color-secondary)))'
  }
  if (s.value.backgroundType === 'image' && s.value.backgroundImage) {
    st.backgroundImage = `url(${s.value.backgroundImage})`
    st.backgroundSize = 'cover'
    st.backgroundPosition = 'center'
  }
  return st
})
const rootClass = computed(() => [
  'relative',
  spacing[s.value.spacing],
  s.value.backgroundType === 'pattern' && 'bg-surface-muted pattern-batik',
  s.value.backgroundType === 'gradient' && 'text-white',
  isDark.value && 'bg-[#0c0f14] text-white',
])
</script>

<template>
  <section :id="s.anchorId || undefined" :class="rootClass" :style="rootStyle">
    <div
      v-if="s.backgroundType === 'image' && s.overlay"
      class="absolute inset-0 bg-black"
      :style="{ opacity: s.overlayOpacity }"
    />
    <div class="relative" :class="container[s.container]">
      <slot :dark="isDark || s.backgroundType === 'gradient'" />
    </div>
  </section>
</template>
