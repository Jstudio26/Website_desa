<script setup lang="ts">
withDefaults(defineProps<{ lines?: number, class?: string }>(), { lines: 1 })
</script>

<template>
  <div class="space-y-2">
    <div
      v-for="i in lines"
      :key="i"
      class="animate-pulse rounded-theme bg-surface-muted"
      :class="[$props.class || 'h-4', i === lines && lines > 1 ? 'w-2/3' : 'w-full']"
    />
  </div>
</template>
