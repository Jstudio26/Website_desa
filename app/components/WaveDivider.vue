<script setup lang="ts">
/** Decorative section divider. `flip` points the wave the other way. */
withDefaults(defineProps<{ flip?: boolean, color?: string }>(), { color: 'text-canvas' })
</script>

<template>
  <div class="pointer-events-none relative w-full leading-[0]" :class="color">
    <svg
      class="block h-[40px] w-full sm:h-[64px]"
      :class="flip ? 'rotate-180' : ''"
      viewBox="0 0 1440 64"
      preserveAspectRatio="none"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M0 64V28c120 24 280 30 480 12S880-2 1080 4s280 22 360 24v36H0Z" />
    </svg>
  </div>
</template>
