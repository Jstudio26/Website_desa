<script setup lang="ts">
import type { WeatherDay } from '~/composables/useWeather'
import { CONDITION_LABEL, getWeatherVisual } from '~/utils/weatherVisual'
import { dayPart, formatClock, formatDecimal, formatLocalDate, tzAbbr } from '~/utils/weatherFormat'

/**
 * Prakiraan per 3 jam, dikelompokkan per tanggal lokal (zona waktu lokasi).
 * HP: daftar geser horizontal di dalam kartu; layar lebar: grid.
 */
const props = defineProps<{ days: WeatherDay[], timezone: string }>()

const selected = ref(0)
watch(() => props.days.length, (n) => { if (selected.value >= n) selected.value = 0 })
const day = computed(() => props.days[selected.value] ?? props.days[0])

const uid = useId()
const tabRefs = ref<HTMLButtonElement[]>([])

function dayName(d: WeatherDay) {
  if (d.offset === 0) return 'Hari ini'
  if (d.offset === 1) return 'Besok'
  return formatLocalDate(d.date, { weekday: 'long' })
}

/** Tombol panah kiri/kanan berpindah tab (pola ARIA tabs). */
function onKey(e: KeyboardEvent, i: number) {
  const n = props.days.length
  const to = e.key === 'ArrowRight' ? (i + 1) % n : e.key === 'ArrowLeft' ? (i - 1 + n) % n : -1
  if (to < 0) return
  e.preventDefault()
  selected.value = to
  tabRefs.value[to]?.focus()
}
</script>

<template>
  <section class="card flex min-w-0 flex-col p-5 sm:p-6" aria-labelledby="wx-forecast-title">
    <div class="flex items-center gap-2.5">
      <span class="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
        <AppIcon name="calendar" :size="17" />
      </span>
      <div class="min-w-0">
        <h3 id="wx-forecast-title" class="font-heading text-lg font-bold leading-tight">Prakiraan 3 Hari</h3>
        <p class="text-xs text-ink-muted">Per 3 jam · waktu {{ tzAbbr(timezone) }}</p>
      </div>
    </div>

    <div role="tablist" aria-label="Pilih hari" class="mt-4 grid gap-2" :style="{ gridTemplateColumns: `repeat(${days.length}, minmax(0, 1fr))` }">
      <button
        v-for="(d, i) in days"
        :id="`${uid}-tab-${i}`"
        :key="d.date"
        ref="tabRefs"
        type="button"
        role="tab"
        :aria-selected="i === selected"
        :aria-controls="`${uid}-panel`"
        :tabindex="i === selected ? 0 : -1"
        class="min-h-[3.5rem] rounded-xl border px-2 py-2 text-left transition"
        :class="i === selected
          ? 'border-primary/40 bg-primary/[0.06] text-ink'
          : 'border-line bg-surface text-ink-muted hover:border-primary/30 hover:text-ink'"
        @click="selected = i"
        @keydown="onKey($event, i)"
      >
        <span class="block truncate text-sm font-bold" :class="i === selected ? 'text-primary' : ''">{{ dayName(d) }}</span>
        <span class="block truncate text-xs">{{ formatLocalDate(d.date, { day: 'numeric', month: 'short' }) }}</span>
        <span v-if="d.min != null && d.max != null" class="mt-0.5 block truncate text-xs font-semibold text-ink">
          {{ formatDecimal(d.min, 0) }}°–{{ formatDecimal(d.max, 0) }}°
        </span>
      </button>
    </div>

    <div
      v-if="day"
      :id="`${uid}-panel`"
      role="tabpanel"
      :aria-labelledby="`${uid}-tab-${selected}`"
      class="-mx-5 mt-4 min-w-0 sm:mx-0"
    >
      <ol
        class="flex snap-x snap-mandatory gap-2.5 overflow-x-auto overscroll-x-contain px-5 pb-2 [scrollbar-width:thin] sm:grid sm:grid-cols-4 sm:overflow-visible sm:px-0 sm:pb-0"
        tabindex="0"
        :aria-label="`Prakiraan ${dayName(day)}, ${formatLocalDate(day.date)}`"
      >
        <li
          v-for="s in day.slots"
          :key="s.time"
          class="flex w-[6.75rem] shrink-0 snap-start flex-col rounded-xl border border-line/80 bg-surface-muted/60 p-3 sm:w-auto"
        >
          <span class="text-[0.7rem] font-semibold uppercase tracking-wide text-ink-muted">{{ dayPart(s.localHour) }}</span>
          <span class="text-sm font-bold text-ink">{{ formatClock(s.localTime) }}</span>
          <AppIcon
            :name="getWeatherVisual(s.condition, s.isNight).icon"
            :size="28"
            class="my-2"
            :style="{ color: getWeatherVisual(s.condition, s.isNight).iconColor }"
          />
          <span class="font-heading text-xl font-extrabold leading-none text-ink">
            {{ s.temp != null ? `${formatDecimal(s.temp, 0)}°` : '—' }}
          </span>
          <span class="mt-1.5 line-clamp-2 text-xs leading-snug text-ink-muted">{{ s.description ?? CONDITION_LABEL[s.condition] }}</span>
          <span v-if="s.humidity != null" class="mt-auto flex items-center gap-1 pt-1.5 text-[0.7rem] text-ink-muted">
            <AppIcon name="droplet" :size="12" /> {{ formatDecimal(s.humidity, 0) }}%
          </span>
        </li>
      </ol>
    </div>

    <p class="mt-auto pt-4 text-xs leading-relaxed text-ink-muted">
      Rentang suhu tiap hari dihitung dari prakiraan per 3 jam BMKG yang tersedia, bukan ringkasan harian resmi.
    </p>
  </section>
</template>
