<script setup lang="ts">
const props = defineProps<{ title?: string, size?: 'sm' | 'md' | 'lg' | 'xl' }>()
const open = defineModel<boolean>('open', { default: false })

const sizeClass = computed(() => ({
  sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl',
}[props.size || 'md']))

watch(open, (v) => {
  if (import.meta.client) document.body.style.overflow = v ? 'hidden' : ''
})
onBeforeUnmount(() => {
  if (import.meta.client) document.body.style.overflow = ''
})
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="open" class="fixed inset-0 z-[100] grid place-items-center p-4">
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="open = false" />
        <div
          class="relative z-10 w-full overflow-hidden rounded-theme border border-line bg-surface shadow-2xl"
          :class="sizeClass"
        >
          <div v-if="title || $slots.header" class="flex items-center justify-between border-b border-line px-5 py-4">
            <slot name="header">
              <h3 class="text-base font-semibold">{{ title }}</h3>
            </slot>
            <button class="rounded p-1 text-ink-muted hover:bg-surface-muted" @click="open = false" aria-label="Tutup">
              <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 6 6 18M6 6l12 12" stroke-linecap="round" />
              </svg>
            </button>
          </div>
          <div class="max-h-[70vh] overflow-y-auto px-5 py-4">
            <slot />
          </div>
          <div v-if="$slots.footer" class="border-t border-line bg-surface-muted/50 px-5 py-3">
            <slot name="footer" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
