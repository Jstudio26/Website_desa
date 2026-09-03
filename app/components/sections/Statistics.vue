<script setup lang="ts">
import type { SectionProps } from './types'

const props = defineProps<SectionProps>()
useReveal()

const d = computed(() => props.section.data as { title?: string, eyebrow?: string })
const groups = computed(() => props.ctx.statistics ?? [])

function pieGradient(points: { value: string, color?: string }[]) {
  const total = points.reduce((a, p) => a + Number(p.value || 0), 0) || 1
  let acc = 0
  const stops = points.map((p, i) => {
    const start = (acc / total) * 100
    acc += Number(p.value || 0)
    const end = (acc / total) * 100
    const color = p.color || `hsl(${(i * 67) % 360} 60% 45%)`
    return `${color} ${start}% ${end}%`
  })
  return `conic-gradient(${stops.join(', ')})`
}
const max = (points: { value: string }[]) => Math.max(...points.map((p) => Number(p.value || 0)), 1)
</script>

<template>
  <div>
    <SectionsHeading
      :eyebrow="d.eyebrow || 'Data Desa'"
      :title="d.title || 'Desa dalam Angka'"
      :dark="dark"
      align="center"
    />

    <div v-if="groups.length" class="grid gap-6 lg:grid-cols-2">
      <UiCard v-for="g in groups" :key="g.title" class="reveal">
        <div class="mb-4 flex items-center justify-between">
          <h3 class="font-heading text-lg font-semibold">{{ g.title }}</h3>
          <UiBadge>{{ g.unit || 'data' }}</UiBadge>
        </div>

        <!-- Pie -->
        <div v-if="g.chartType === 'pie'" class="flex items-center gap-6">
          <div
            class="h-36 w-36 shrink-0 rounded-full"
            :style="{ background: pieGradient(g.points) }"
          >
            <div class="grid h-full w-full place-items-center">
              <div class="grid h-24 w-24 place-items-center rounded-full bg-surface text-center">
                <span class="text-xs text-ink-muted">Total</span>
                <span class="font-heading text-lg font-bold">
                  {{ g.points.reduce((a, p) => a + Number(p.value || 0), 0).toLocaleString('id-ID') }}
                </span>
              </div>
            </div>
          </div>
          <ul class="flex-1 space-y-2">
            <li v-for="(p, i) in g.points" :key="i" class="flex items-center justify-between text-sm">
              <span class="flex items-center gap-2">
                <span class="h-3 w-3 rounded-sm" :style="{ background: p.color || `hsl(${(i * 67) % 360} 60% 45%)` }" />
                {{ p.label }}
              </span>
              <span class="font-semibold">{{ Number(p.value).toLocaleString('id-ID') }}</span>
            </li>
          </ul>
        </div>

        <!-- Bars -->
        <div v-else class="space-y-3">
          <div v-for="(p, i) in g.points" :key="i">
            <div class="mb-1 flex justify-between text-sm">
              <span>{{ p.label }}</span>
              <span class="font-semibold">{{ Number(p.value).toLocaleString('id-ID') }}</span>
            </div>
            <div class="h-2.5 overflow-hidden rounded-full bg-surface-muted">
              <div
                class="h-full rounded-full bg-primary transition-[width] duration-1000"
                :style="{ width: `${(Number(p.value) / max(g.points)) * 100}%`, background: p.color || undefined }"
              />
            </div>
          </div>
        </div>
      </UiCard>
    </div>

    <p v-else class="text-center text-sm" :class="dark ? 'text-white/60' : 'text-ink-muted'">
      Data statistik belum tersedia.
    </p>
  </div>
</template>
