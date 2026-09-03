<script setup lang="ts">
defineProps<{ label?: string, hint?: string, error?: string | string[], rows?: number, placeholder?: string, required?: boolean }>()
const model = defineModel<string | null>()
</script>

<template>
  <label class="block">
    <span v-if="label" class="mb-1.5 block text-sm font-medium text-ink">
      {{ label }} <span v-if="required" class="text-red-500">*</span>
    </span>
    <textarea
      v-model="model"
      :rows="rows || 4"
      :placeholder="placeholder"
      :required="required"
      class="w-full rounded-theme border border-line bg-surface px-3.5 py-2.5 text-sm text-ink outline-none transition placeholder:text-ink-muted/60 focus:border-primary focus:ring-2 focus:ring-primary/20"
      :class="error && error.length ? 'border-red-400' : ''"
    />
    <span v-if="hint && !(error && error.length)" class="mt-1 block text-xs text-ink-muted">{{ hint }}</span>
    <span v-if="error && error.length" class="mt-1 block text-xs text-red-500">
      {{ Array.isArray(error) ? error[0] : error }}
    </span>
  </label>
</template>
