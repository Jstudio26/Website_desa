<script setup lang="ts">
withDefaults(defineProps<{ eyebrow?: string, title?: string, subtitle?: string, align?: 'left' | 'center', dark?: boolean }>(), {
  align: 'left',
})
</script>

<template>
  <div v-if="title || eyebrow" class="reveal mb-10" :class="align === 'center' && 'mx-auto max-w-2xl text-center'">
    <p v-if="eyebrow" class="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em]" :class="[dark ? 'text-white/60' : 'text-primary', align === 'center' && 'justify-center']">
      <span class="h-px w-6" :class="dark ? 'bg-white/40' : 'bg-primary'" />
      {{ eyebrow }}
    </p>
    <h2 class="text-fluid-h2" :class="dark ? 'text-white' : 'text-ink'">{{ title }}</h2>
    <p v-if="subtitle" class="mt-3 text-base leading-relaxed" :class="dark ? 'text-white/70' : 'text-ink-muted'">
      {{ subtitle }}
    </p>
  </div>
</template>
