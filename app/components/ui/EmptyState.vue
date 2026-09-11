<script setup lang="ts">
defineProps<{ title?: string, message?: string, icon?: string }>()
</script>

<template>
  <div class="grid place-items-center rounded-theme border border-dashed border-line bg-surface/60 px-6 py-16 text-center">
    <div class="grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary">
      <AppIcon :name="icon || 'inbox'" :size="24" />
    </div>
    <p class="mt-4 font-heading font-bold text-ink">{{ title || 'Belum ada data' }}</p>
    <p v-if="message" class="mt-1 max-w-sm text-sm text-ink-muted">{{ message }}</p>
    <div class="mt-5 empty:hidden"><slot /></div>
  </div>
</template>
