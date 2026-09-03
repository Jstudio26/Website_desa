<script setup lang="ts">
import type { SectionProps } from './types'
const props = defineProps<SectionProps>()
useReveal()
const d = computed(() => props.section.data as { eyebrow?: string, title?: string, body?: string })
</script>

<template>
  <div class="reveal">
    <SectionsHeading :eyebrow="d.eyebrow" :title="d.title" :dark="dark" />
    <div class="prose-village" v-html="d.body || ''" />
  </div>
</template>
