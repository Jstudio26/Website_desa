<script setup lang="ts">
import type { SectionProps } from './types'

const props = defineProps<SectionProps>()
useReveal()

const d = computed(() => props.section.data as { title?: string, eyebrow?: string })
const items = computed(() => (props.ctx.events ?? []) as Array<{
  slug: string, title: string, description?: string, location?: string, startAt: string
}>)

const day = (s: string) => new Date(s).toLocaleDateString('id-ID', { day: '2-digit' })
const mon = (s: string) => new Date(s).toLocaleDateString('id-ID', { month: 'short' })
const time = (s: string) => new Date(s).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
</script>

<template>
  <div>
    <SectionsHeading :eyebrow="d.eyebrow || 'Jadwal'" :title="d.title || 'Agenda Desa'" :dark="dark" />

    <div v-if="items.length" class="relative space-y-4 border-l-2 border-line pl-6">
      <div
        v-for="e in items"
        :key="e.slug"
        class="reveal relative rounded-theme border border-line bg-surface p-4 transition hover:shadow-md"
      >
        <span class="absolute -left-[1.9rem] top-5 grid h-11 w-11 place-items-center rounded-lg bg-primary text-center leading-none text-white">
          <span class="text-sm font-bold">{{ day(e.startAt) }}</span>
          <span class="text-[10px] uppercase">{{ mon(e.startAt) }}</span>
        </span>
        <div class="flex flex-wrap items-start justify-between gap-2">
          <h3 class="font-heading text-lg font-semibold text-ink">{{ e.title }}</h3>
          <span class="flex items-center gap-1 text-xs text-ink-muted">
            <AppIcon name="clock" :size="13" /> {{ time(e.startAt) }} WITA
          </span>
        </div>
        <p v-if="e.location" class="mt-1 flex items-center gap-1 text-xs text-ink-muted">
          <AppIcon name="mapPin" :size="13" /> {{ e.location }}
        </p>
        <p class="mt-2 line-clamp-2 text-sm text-ink-muted">{{ e.description }}</p>
      </div>
    </div>

    <p v-else class="text-sm" :class="dark ? 'text-white/60' : 'text-ink-muted'">Belum ada agenda mendatang.</p>
  </div>
</template>
