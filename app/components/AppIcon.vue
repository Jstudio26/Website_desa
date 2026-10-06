<script setup lang="ts">
/**
 * Lightweight inline icon set (stroke, 24px grid). Keeps the bundle free of an
 * icon library while honouring the "no emoji as icons" design rule.
 */
const props = withDefaults(defineProps<{ name: string, size?: number | string }>(), { size: 20 })

const size = computed(() => (typeof props.size === 'number' ? `${props.size}px` : props.size))
const d = computed(() => ICON_PATHS[props.name] ?? ICON_PATHS.info)
</script>

<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.75"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path :d="d" />
  </svg>
</template>
