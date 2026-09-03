<script setup lang="ts">
defineProps<{ label?: string, description?: string }>()
const model = defineModel<boolean>({ default: false })
</script>

<template>
  <label class="flex cursor-pointer items-start gap-3">
    <button
      type="button"
      role="switch"
      :aria-checked="model"
      class="relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition-colors"
      :class="model ? 'bg-primary' : 'bg-line'"
      @click="model = !model"
    >
      <span
        class="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform"
        :class="model ? 'translate-x-5' : ''"
      />
    </button>
    <span v-if="label || description">
      <span v-if="label" class="block text-sm font-medium text-ink">{{ label }}</span>
      <span v-if="description" class="block text-xs text-ink-muted">{{ description }}</span>
    </span>
  </label>
</template>
