<script setup lang="ts">
withDefaults(defineProps<{ color?: string, tone?: 'solid' | 'soft' }>(), { tone: 'soft' })
</script>

<template>
  <span
    class="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium"
    :class="tone === 'soft' ? 'bg-primary/10 text-primary' : 'bg-primary text-white'"
    :style="color ? (tone === 'soft'
      ? { backgroundColor: color + '1a', color }
      : { backgroundColor: color, color: '#fff' }) : undefined"
  >
    <slot />
  </span>
</template>
