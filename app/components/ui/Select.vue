<script setup lang="ts">
defineProps<{
  label?: string
  hint?: string
  error?: string | string[]
  options: { label: string, value: string | number }[]
  placeholder?: string
  required?: boolean
}>()
const model = defineModel<string | number | null>()
</script>

<template>
  <label class="block">
    <span v-if="label" class="mb-1.5 block text-sm font-medium text-ink">
      {{ label }} <span v-if="required" class="text-red-500">*</span>
    </span>
    <select
      v-model="model"
      class="w-full rounded-theme border border-line bg-surface px-3.5 py-2.5 text-sm text-ink outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
    >
      <option v-if="placeholder" :value="null" disabled>{{ placeholder }}</option>
      <option v-for="o in options" :key="String(o.value)" :value="o.value">{{ o.label }}</option>
    </select>
    <span v-if="hint" class="mt-1 block text-xs text-ink-muted">{{ hint }}</span>
    <span v-if="error && error.length" class="mt-1 block text-xs text-red-500">
      {{ Array.isArray(error) ? error[0] : error }}
    </span>
  </label>
</template>
