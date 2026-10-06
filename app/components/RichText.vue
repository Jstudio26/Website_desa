<script setup lang="ts">
/**
 * Renders stored rich-text HTML. Content is authored only by authenticated
 * admins via RichTextEditor, so it is treated as trusted (no sanitisation).
 */
defineProps<{ html?: string | null }>()
</script>

<template>
  <!-- eslint-disable-next-line vue/no-v-html -->
  <div v-if="html" class="prose-village" v-html="html" />
</template>
