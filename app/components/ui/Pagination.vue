<script setup lang="ts">
const props = defineProps<{ page: number, totalPages: number }>()
const emit = defineEmits<{ 'update:page': [n: number] }>()

const pages = computed(() => {
  const total = props.totalPages
  const cur = props.page
  const out: (number | '…')[] = []
  for (let i = 1; i <= total; i++) {
    if (i === 1 || i === total || (i >= cur - 1 && i <= cur + 1)) out.push(i)
    else if (out[out.length - 1] !== '…') out.push('…')
  }
  return out
})
</script>

<template>
  <nav v-if="totalPages > 1" class="flex items-center justify-center gap-1">
    <button
      class="rounded-theme border border-line px-3 py-1.5 text-sm disabled:opacity-40"
      :disabled="page <= 1"
      @click="emit('update:page', page - 1)"
    >
      ‹
    </button>
    <template v-for="(p, i) in pages" :key="i">
      <span v-if="p === '…'" class="px-2 text-ink-muted">…</span>
      <button
        v-else
        class="min-w-9 rounded-theme border px-3 py-1.5 text-sm transition"
        :class="p === page ? 'border-primary bg-primary text-white' : 'border-line hover:bg-surface-muted'"
        @click="emit('update:page', p as number)"
      >
        {{ p }}
      </button>
    </template>
    <button
      class="rounded-theme border border-line px-3 py-1.5 text-sm disabled:opacity-40"
      :disabled="page >= totalPages"
      @click="emit('update:page', page + 1)"
    >
      ›
    </button>
  </nav>
</template>
