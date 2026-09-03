<script setup lang="ts">
import type { SectionProps } from './types'
const props = defineProps<SectionProps>()
</script>

<template>
  <div class="rounded-theme border border-dashed border-line p-8 text-center text-sm text-ink-muted">
    Komponen untuk section <code class="rounded bg-surface-muted px-1.5 py-0.5 font-mono text-xs">{{ props.section.type }}</code>
    belum tersedia di build ini.
  </div>
</template>
