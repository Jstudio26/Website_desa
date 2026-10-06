<script setup lang="ts">
import type { StatusMeta } from '~/config/layanan'

/** Letter/complaint status. Distinguished by icon + label + red intensity (Merah–Putih palette only). */
const props = defineProps<{ meta: StatusMeta, size?: 'sm' | 'md' }>()

const toneClass = computed(() => ({
  muted: 'border-line bg-surface-muted text-ink-muted',
  soft: 'border-primary/20 bg-primary/10 text-primary',
  solid: 'border-primary bg-primary text-white',
  danger: 'border-primary-deep bg-surface text-primary-deep',
}[props.meta.tone]))
</script>

<template>
  <span
    class="inline-flex items-center gap-1 whitespace-nowrap rounded-full border font-semibold"
    :class="[toneClass, size === 'md' ? 'px-3 py-1 text-sm' : 'px-2.5 py-0.5 text-xs']"
  >
    <AppIcon :name="meta.icon" :size="size === 'md' ? 14 : 12" />
    {{ meta.label }}
  </span>
</template>
