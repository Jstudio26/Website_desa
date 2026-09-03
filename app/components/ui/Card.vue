<script setup lang="ts">
withDefaults(defineProps<{ as?: string, hover?: boolean, padded?: boolean }>(), {
  as: 'div',
  padded: true,
})
</script>

<template>
  <component
    :is="as"
    class="rounded-theme border border-line bg-surface transition-shadow"
    :class="[hover && 'hover:shadow-lg hover:shadow-black/5', padded && 'p-5 sm:p-6']"
  >
    <slot />
  </component>
</template>
