<script setup lang="ts">
defineProps<{ title: string, description?: string }>()
</script>

<template>
  <div class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
    <div>
      <h1 class="font-heading text-2xl font-bold text-ink">{{ title }}</h1>
      <p v-if="description" class="mt-1 text-sm text-ink-muted">{{ description }}</p>
    </div>
    <div class="flex items-center gap-2">
      <slot name="actions" />
    </div>
  </div>
</template>
