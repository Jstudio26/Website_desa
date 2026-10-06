<script setup lang="ts">
import { SITE_LOCALE } from '~/config/site'
import { formatNumber } from '~/utils/format'

/**
 * Part-to-whole donut (≤ 6 segments). Hovering or tapping a segment — or its legend row —
 * swaps the centre readout to that segment. The legend always lists every count and
 * percentage, so identity never relies on colour alone and it doubles as the table view.
 * Colours come from the caller; validate them with the dataviz palette script.
 */
export interface DonutSegment {
  label: string
  value: number
  color: string
}

const props = withDefaults(defineProps<{
  segments: DonutSegment[]
  /** Accessible name, e.g. "Penduduk menurut jenis kelamin". */
  label: string
  centerCaption?: string
  unit?: string
}>(), { centerCaption: 'Total', unit: 'jiwa' })

const R = 60
const STROKE = 22
const GAP = 2 // surface gap between segments, in px along the ring
const MIN_ARC = GAP + 3 // smallest drawn segment (incl. its gap)
const C = 2 * Math.PI * R

const pct = new Intl.NumberFormat(SITE_LOCALE, { maximumFractionDigits: 1 })

const rows = computed(() => {
  const segs = props.segments.filter((s) => s.value > 0)
  const total = segs.reduce((sum, s) => sum + s.value, 0)
  if (!total) return { total: 0, items: [] }

  // Largest-remainder rounding to 0.1% so the shown percentages always add up to 100.
  const raw = segs.map((s) => (s.value / total) * 1000)
  const tenths = raw.map(Math.floor)
  let left = 1000 - tenths.reduce((a, b) => a + b, 0)
  raw.map((v, i) => ({ i, rem: v - Math.floor(v) }))
    .sort((a, b) => b.rem - a.rem)
    .forEach(({ i }) => { if (left-- > 0) tenths[i]! += 1 })

  // Give every non-zero segment a minimum arc so a tiny group (e.g. 1 of 5.000) stays visible,
  // taking the difference proportionally from the larger segments.
  const exact = segs.map((s) => (s.value / total) * C)
  const isSmall = exact.map((len) => segs.length > 1 && len < MIN_ARC)
  const needed = exact.reduce((sum, len, i) => sum + (isSmall[i] ? MIN_ARC - len : 0), 0)
  const largeSum = exact.reduce((sum, len, i) => sum + (isSmall[i] ? 0 : len), 0)
  const lens = exact.map((len, i) => (isSmall[i] ? MIN_ARC : len - needed * (len / largeSum)))

  let start = 0
  const items = segs.map((s, i) => {
    const len = lens[i]!
    const item = {
      ...s,
      percent: tenths[i]! / 10,
      dash: segs.length > 1 ? len - GAP : C,
      offset: -start,
    }
    start += len
    return item
  })
  return { total, items }
})

function formatPercent(p: number) {
  return p === 0 ? `<${pct.format(0.1)}%` : `${pct.format(p)}%`
}

const active = ref<number | null>(null)
const current = computed(() => (active.value == null ? null : rows.value.items[active.value] ?? null))
</script>

<template>
  <figure v-if="rows.total" class="flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:gap-8">
    <div class="relative h-44 w-44 shrink-0" @pointerleave="active = null">
      <svg viewBox="0 0 160 160" class="h-full w-full -rotate-90" aria-hidden="true">
        <circle cx="80" cy="80" :r="R" fill="none" class="stroke-surface-muted" :stroke-width="STROKE" />
        <circle
          v-for="(s, i) in rows.items"
          :key="s.label"
          cx="80"
          cy="80"
          :r="R"
          fill="none"
          :stroke="s.color"
          :stroke-width="active === i ? STROKE + 4 : STROKE"
          :stroke-dasharray="`${s.dash} ${C}`"
          :stroke-dashoffset="s.offset"
          class="cursor-pointer transition-[stroke-width,opacity] duration-200"
          :class="active != null && active !== i ? 'opacity-35' : ''"
          @pointerenter="active = i"
          @click="active = active === i ? null : i"
        />
      </svg>
      <div class="pointer-events-none absolute inset-0 grid place-items-center text-center" aria-hidden="true">
        <div>
          <p class="font-heading text-2xl font-extrabold text-ink">
            {{ current ? formatPercent(current.percent) : formatNumber(rows.total) }}
          </p>
          <p class="mt-0.5 max-w-[7rem] text-xs font-medium leading-tight text-ink-muted">
            {{ current ? current.label : centerCaption }}
          </p>
        </div>
      </div>
    </div>

    <figcaption class="w-full min-w-0 sm:w-auto sm:flex-1">
      <span class="sr-only">{{ label }}</span>
      <ul class="divide-y divide-line">
        <li
          v-for="(s, i) in rows.items"
          :key="s.label"
          class="flex items-center gap-3 rounded-md px-2 py-2.5 transition-colors"
          :class="active === i ? 'bg-surface-muted' : ''"
          @pointerenter="active = i"
          @pointerleave="active = null"
        >
          <span class="h-3 w-3 shrink-0 self-start rounded-sm mt-1" :style="{ backgroundColor: s.color }" aria-hidden="true" />
          <span class="min-w-0 flex-1">
            <span class="block text-sm text-ink">{{ s.label }}</span>
            <span class="block text-xs tabular-nums text-ink-muted">{{ formatNumber(s.value) }} {{ unit }}</span>
          </span>
          <span class="shrink-0 text-right text-sm font-bold tabular-nums text-ink">{{ formatPercent(s.percent) }}</span>
        </li>
      </ul>
    </figcaption>
  </figure>
</template>
