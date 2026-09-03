<script setup lang="ts">
defineProps<{ title?: string, message?: string, icon?: string }>()
</script>

<template>
  <div class="grid place-items-center rounded-theme border border-dashed border-line px-6 py-14 text-center">
    <div class="grid h-12 w-12 place-items-center rounded-full bg-surface-muted text-ink-muted">
      <svg class="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6">
        <path :d="icon || 'M9 13h6m-3-3v6M4 7l1-3h14l1 3M4 7h16v12a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7Z'" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    </div>
    <p class="mt-4 font-medium text-ink">{{ title || 'Belum ada data' }}</p>
    <p v-if="message" class="mt-1 max-w-sm text-sm text-ink-muted">{{ message }}</p>
    <div class="mt-5"><slot /></div>
  </div>
</template>
