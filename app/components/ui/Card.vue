<script setup lang="ts">
withDefaults(defineProps<{ as?: string, hover?: boolean, padded?: boolean, accent?: boolean }>(), {
  as: 'div',
  padded: true,
})
</script>

<template>
  <component
    :is="as"
    class="rounded-theme border border-line/80 bg-surface shadow-card"
    :class="[
      hover && 'card-hover',
      accent && 'accent-top',
      padded && 'p-5 sm:p-6',
    ]"
  >
    <slot />
  </component>
</template>
