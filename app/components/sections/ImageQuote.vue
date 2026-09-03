<script setup lang="ts">
import type { SectionProps } from './types'

const props = defineProps<SectionProps>()
useReveal()

const d = computed(() => props.section.data as {
  quote?: string, name?: string, role?: string, image?: string, source?: string
})
const headman = computed(() => props.ctx.headman as {
  name?: string, position?: string, photo?: string, bio?: string
} | null)

const quote = computed(() =>
  d.value.quote
  || headman.value?.bio
  || 'Selamat datang di portal resmi desa kami. Semoga kehadiran website ini semakin mendekatkan pelayanan kepada masyarakat dan memperkenalkan potensi desa kepada dunia.',
)
const name = computed(() => d.value.name || headman.value?.name || 'Kepala Desa')
const role = computed(() => d.value.role || headman.value?.position || 'Kepala Desa')
const image = computed(() => d.value.image || headman.value?.photo || 'https://picsum.photos/seed/kepala-desa/700/850')
</script>

<template>
  <div class="grid items-center gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-16">
    <div class="reveal relative">
      <div class="absolute -left-4 -top-4 h-28 w-28 rounded-theme border-2 border-accent/40" />
      <div class="absolute -bottom-5 -right-5 h-32 w-32 rounded-full bg-primary/10" />
      <img
        :src="image"
        :alt="name"
        class="relative aspect-[4/5] w-full max-w-md rounded-theme object-cover shadow-xl"
      >
    </div>
    <div class="reveal">
      <AppIcon name="quote" :size="44" class="text-primary/25" />
      <blockquote class="mt-3 font-heading text-2xl font-medium leading-snug text-ink sm:text-[1.7rem]">
        "{{ quote }}"
      </blockquote>
      <div class="mt-6 flex items-center gap-3">
        <span class="h-10 w-1 rounded bg-accent" />
        <div>
          <p class="font-semibold text-ink">{{ name }}</p>
          <p class="text-sm text-ink-muted">{{ role }}</p>
        </div>
      </div>
    </div>
  </div>
</template>
