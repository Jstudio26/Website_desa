<script setup lang="ts">
import type { ToastItem } from '~/composables/useToast'

const { items, dismiss } = useToast()

const icons: Record<ToastItem['type'], string> = {
  success: 'M20 6 9 17l-5-5',
  error: 'M18 6 6 18M6 6l12 12',
}
const tones: Record<ToastItem['type'], string> = {
  success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  error: 'border-red-200 bg-red-50 text-red-800',
}
</script>

<template>
  <Teleport to="body">
    <div class="pointer-events-none fixed inset-x-0 top-4 z-[200] flex flex-col items-center gap-2 px-4">
      <TransitionGroup name="toast">
        <div
          v-for="t in items"
          :key="t.id"
          class="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-theme border px-4 py-3 shadow-lg"
          :class="tones[t.type]"
          role="status"
        >
          <svg class="mt-0.5 h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
            <path :d="icons[t.type]" />
          </svg>
          <div class="min-w-0 flex-1">
            <p class="text-sm font-semibold">{{ t.title }}</p>
            <p v-if="t.message" class="mt-0.5 text-xs opacity-80">{{ t.message }}</p>
          </div>
          <button class="opacity-60 hover:opacity-100" aria-label="Tutup" @click="dismiss(t.id)">
            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6 6 18M6 6l12 12" stroke-linecap="round" /></svg>
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped>
.toast-enter-active, .toast-leave-active { transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
.toast-enter-from { opacity: 0; transform: translateY(-12px) scale(0.97); }
.toast-leave-to { opacity: 0; transform: translateY(-12px) scale(0.97); }
</style>
