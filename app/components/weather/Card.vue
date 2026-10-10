<script setup lang="ts">
import type { WeatherLocation, WeatherSlot } from '#shared/weather'
import { CONDITION_LABEL, getWeatherVisual } from '~/utils/weatherVisual'
import { formatClock, formatDecimal, formatInstant, formatLocalDate, tzAbbr, windDirection } from '~/utils/weatherFormat'

/** Kartu utama prakiraan BMKG; atmosfernya mengikuti kondisi & waktu (siang/malam) slot. */
const props = defineProps<{
  entry: WeatherSlot
  /** Slot pertama yang tersedia masih > 90 menit di depan. */
  isUpcoming: boolean
  next: WeatherSlot[]
  location: WeatherLocation
  analysisDate: string | null
  stale: boolean
  isOutdated: boolean
}>()

const visual = computed(() => getWeatherVisual(props.entry.condition, props.entry.isNight))
const description = computed(() => props.entry.description ?? CONDITION_LABEL[props.entry.condition])
const tz = computed(() => props.location.timezone)
const wind = computed(() => windDirection(props.entry.windFrom, props.entry.windDeg))
const area = computed(() => [props.location.district, props.location.city].filter(Boolean).join(', '))

const cssVars = computed(() => ({
  'background': visual.value.colors.background,
  '--wx-ink': visual.value.colors.ink,
  '--wx-muted': visual.value.colors.muted,
  '--wx-chip-bg': visual.value.colors.chipBg,
  '--wx-chip-border': visual.value.colors.chipBorder,
}))
</script>

<template>
  <article
    class="relative isolate flex h-full flex-col overflow-hidden rounded-theme p-5 text-[color:var(--wx-ink)] shadow-card transition-[background] duration-700 sm:p-7"
    :style="cssVars"
    :data-weather="visual.key"
    aria-labelledby="wx-title"
  >
    <header class="relative z-10 flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
      <div class="min-w-0">
        <p class="text-[0.7rem] font-bold uppercase tracking-[0.2em] text-[color:var(--wx-muted)]">
          Prakiraan Cuaca BMKG
        </p>
        <h2 id="wx-title" class="mt-1.5 text-xl font-extrabold !text-[color:var(--wx-ink)] sm:text-2xl">
          Kelurahan {{ location.name }}
        </h2>
        <p v-if="area" class="mt-0.5 text-sm text-[color:var(--wx-muted)]">{{ area }}</p>
      </div>
    </header>

    <!-- Kondisi utama -->
    <div class="relative z-10 mt-3 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
      <div class="min-w-0">
        <p class="font-heading text-[3.75rem] font-extrabold leading-none tracking-tight sm:text-[4.75rem]">
          <template v-if="entry.temp != null">{{ formatDecimal(entry.temp, 0) }}<span class="align-top text-[0.45em] font-bold">°C</span></template>
          <span v-else class="text-3xl">Suhu —</span>
        </p>
        <p class="mt-2 text-lg font-semibold leading-snug sm:text-xl">{{ description }}</p>
      </div>
      <div class="-mr-2 h-28 w-36 shrink-0 sm:-mr-3 sm:h-40 sm:w-52">
        <WeatherScene :visual="visual" />
      </div>
    </div>

    <p class="relative z-10 mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-[color:var(--wx-muted)]">
      <AppIcon name="clock" :size="15" class="shrink-0" />
      <span>
        {{ isUpcoming ? 'Prakiraan berikutnya' : 'Prakiraan' }} pukul {{ formatClock(entry.localTime) }} {{ tzAbbr(tz) }}
        · {{ formatLocalDate(entry.localDate) }}
      </span>
    </p>

    <!-- Kelembapan & angin -->
    <dl class="relative z-10 mt-4 grid grid-cols-2 gap-2.5">
      <div class="rounded-xl border border-[color:var(--wx-chip-border)] bg-[color:var(--wx-chip-bg)] px-3.5 py-2.5 backdrop-blur-sm">
        <dt class="flex items-center gap-1.5 text-xs font-medium text-[color:var(--wx-muted)]">
          <AppIcon name="droplet" :size="14" /> Kelembapan
        </dt>
        <dd class="mt-0.5 text-base font-bold">{{ entry.humidity != null ? `${formatDecimal(entry.humidity, 0)}%` : '—' }}</dd>
      </div>
      <div class="rounded-xl border border-[color:var(--wx-chip-border)] bg-[color:var(--wx-chip-bg)] px-3.5 py-2.5 backdrop-blur-sm">
        <dt class="flex items-center gap-1.5 text-xs font-medium text-[color:var(--wx-muted)]">
          <AppIcon name="wind" :size="14" /> Angin
        </dt>
        <dd class="mt-0.5 text-base font-bold">
          {{ entry.windSpeed != null ? `${formatDecimal(entry.windSpeed)} km/jam` : '—' }}
          <span v-if="wind" class="block text-xs font-medium text-[color:var(--wx-muted)]">dari {{ wind }}</span>
        </dd>
      </div>
    </dl>

    <!-- Beberapa interval berikutnya -->
    <div v-if="next.length" class="relative z-10 mt-5 hidden border-t border-[color:var(--wx-chip-border)] pt-4 sm:block">
      <p class="text-xs font-semibold text-[color:var(--wx-muted)]">Berikutnya</p>
      <ol class="mt-2 grid grid-cols-4 gap-1.5">
        <li
          v-for="s in next"
          :key="s.time"
          class="flex flex-col items-center gap-1 rounded-lg py-1.5 text-center"
        >
          <span class="text-xs font-semibold text-[color:var(--wx-muted)]">{{ formatClock(s.localTime) }}</span>
          <AppIcon :name="getWeatherVisual(s.condition, s.isNight).icon" :size="22" />
          <span class="sr-only">{{ s.description ?? CONDITION_LABEL[s.condition] }},</span>
          <span class="text-sm font-bold">{{ s.temp != null ? `${formatDecimal(s.temp, 0)}°` : '—' }}</span>
        </li>
      </ol>
    </div>

    <p
      v-if="stale || isOutdated"
      class="relative z-10 mt-4 flex items-start gap-1.5 rounded-lg border border-[color:var(--wx-chip-border)] bg-[color:var(--wx-chip-bg)] px-3 py-2 text-xs font-medium"
      role="status"
    >
      <AppIcon name="info" :size="14" class="mt-px shrink-0" />
      <span v-if="stale">Pembaruan dari BMKG sedang gagal; ini data terakhir yang berhasil diambil.</span>
      <span v-else>BMKG belum memperbarui prakiraan ini sejak lebih dari sehari lalu.</span>
    </p>

    <!-- Atribusi wajib BMKG -->
    <footer class="relative z-10 mt-auto flex flex-wrap items-center justify-between gap-x-3 gap-y-1 pt-5 text-xs text-[color:var(--wx-muted)]">
      <a
        href="https://data.bmkg.go.id/prakiraan-cuaca/"
        target="_blank"
        rel="noopener"
        class="inline-flex items-center gap-1.5 font-semibold text-[color:var(--wx-ink)] underline underline-offset-2 hover:no-underline"
      >
        <span class="rounded bg-[color:var(--wx-chip-bg)] px-1.5 py-0.5 text-[0.65rem] font-extrabold tracking-wider ring-1 ring-[color:var(--wx-chip-border)]">BMKG</span>
        Sumber: Badan Meteorologi, Klimatologi, dan Geofisika
      </a>
      <span v-if="analysisDate">Dibuat BMKG {{ formatInstant(analysisDate, tz) }}</span>
    </footer>
  </article>
</template>
