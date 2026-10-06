<script setup lang="ts">
import { AGE_BANDS, SEX_COLORS, ageBandLabel, type AgeBand } from '~/config/penduduk'
import { SITE_LOCALE } from '~/config/site'
import type { SettingsData } from '~/types/database'
import { formatNumber } from '~/utils/format'

/**
 * Population pyramid: laki-laki to the left, perempuan to the right, oldest band on top.
 * Both sides share one scale. Hover/tap/focus on a half-row shows its numbers in the
 * readout line (the hit area is the whole half-row, bigger than the bar); a table view
 * below lists every value, so nothing depends on colour or hover alone.
 */
const props = defineProps<{ data: SettingsData['ageDistribution'] }>()

type Sex = 'male' | 'female'
const SEX_LABEL: Record<Sex, string> = { male: 'Laki-laki', female: 'Perempuan' }

const pct = new Intl.NumberFormat(SITE_LOCALE, { maximumFractionDigits: 1 })

const rows = computed(() => AGE_BANDS.map((band) => ({
  band,
  male: Math.max(0, props.data[band]?.male ?? 0),
  female: Math.max(0, props.data[band]?.female ?? 0),
})))
const totals = computed(() => ({
  male: rows.value.reduce((s, r) => s + r.male, 0),
  female: rows.value.reduce((s, r) => s + r.female, 0),
}))
const grandTotal = computed(() => totals.value.male + totals.value.female)

/**
 * Round the axis maximum up to a "nice" number close to the data (so the bars use the
 * width), keeping the half-way tick a whole number — these are counts of people.
 */
const axisMax = computed(() => {
  const max = Math.max(1, ...rows.value.flatMap((r) => [r.male, r.female]))
  const pow = 10 ** Math.floor(Math.log10(max))
  return [1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10]
    .map((m) => Math.round(m * pow))
    .find((c) => c >= max && c % 2 === 0)!
})
const ticks = computed(() => [axisMax.value, axisMax.value / 2, 0])

const width = (v: number) => `${(v / axisMax.value) * 100}%`
const share = (v: number) => (grandTotal.value ? `${pct.format((v / grandTotal.value) * 100)}%` : '0%')

const active = ref<{ band: AgeBand, sex: Sex } | null>(null)
const readout = computed(() => {
  if (!active.value) return null
  const row = rows.value.find((r) => r.band === active.value!.band)!
  const v = row[active.value.sex]
  return `${SEX_LABEL[active.value.sex]}, ${ageBandLabel(row.band)}: ${formatNumber(v)} jiwa (${share(v)} dari total)`
})
const isActive = (band: AgeBand, sex: Sex) => active.value?.band === band && active.value.sex === sex
const dimmed = (band: AgeBand, sex: Sex) => active.value != null && !isActive(band, sex)
</script>

<template>
  <figure v-if="grandTotal">
    <!-- Legend (two series → also direct-labelled with totals) -->
    <div class="flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-sm">
      <span v-for="sex in (['male', 'female'] as Sex[])" :key="sex" class="inline-flex items-center gap-2">
        <span class="h-3 w-3 rounded-sm" :style="{ backgroundColor: SEX_COLORS[sex] }" aria-hidden="true" />
        <span class="text-ink">{{ SEX_LABEL[sex] }}</span>
        <span class="tabular-nums text-ink-muted">{{ formatNumber(totals[sex]) }} jiwa · {{ share(totals[sex]) }}</span>
      </span>
    </div>

    <p class="mt-3 min-h-5 text-center text-xs text-ink-muted" aria-live="polite">
      {{ readout ?? 'Arahkan atau ketuk batang untuk melihat jumlahnya.' }}
    </p>

    <!-- Bars: oldest band on top -->
    <div class="mt-3" aria-hidden="true" @pointerleave="active = null">
      <div
        v-for="r in [...rows].reverse()"
        :key="r.band"
        class="grid grid-cols-[1fr_3.5rem_1fr] items-center"
      >
        <button
          v-for="sex in (['male', 'female'] as Sex[])"
          :key="sex"
          type="button"
          tabindex="-1"
          class="relative flex h-[22px] items-center"
          :class="sex === 'male' ? 'order-1 justify-end' : 'order-3 justify-start'"
          @pointerenter="active = { band: r.band, sex }"
          @click="active = isActive(r.band, sex) ? null : { band: r.band, sex }"
        >
          <!-- recessive gridline at half scale -->
          <span class="absolute inset-y-0 w-px bg-line/70" :class="sex === 'male' ? 'left-1/2' : 'right-1/2'" />
          <span
            class="relative h-4 transition-opacity duration-150"
            :class="[sex === 'male' ? 'rounded-l' : 'rounded-r', dimmed(r.band, sex) ? 'opacity-35' : '']"
            :style="{ width: width(r[sex]), backgroundColor: SEX_COLORS[sex], minWidth: r[sex] ? '2px' : '0' }"
          />
        </button>
        <span class="order-2 text-center text-[11px] font-medium tabular-nums text-ink-muted">{{ r.band }}</span>
      </div>

      <!-- Axis: shared scale, mirrored -->
      <div class="mt-1.5 grid grid-cols-[1fr_3.5rem_1fr] border-t border-line pt-1 text-[10px] tabular-nums text-ink-muted">
        <div class="flex justify-between">
          <span v-for="t in ticks" :key="`m${t}`">{{ formatNumber(t) }}</span>
        </div>
        <span class="text-center">Umur</span>
        <div class="flex justify-between">
          <span v-for="t in [...ticks].reverse()" :key="`f${t}`">{{ formatNumber(t) }}</span>
        </div>
      </div>
    </div>

    <!-- Table view: the accessible equivalent of the chart -->
    <details class="mt-5 rounded-theme border border-line">
      <summary class="cursor-pointer px-4 py-2.5 text-sm font-semibold text-primary">Lihat tabel data</summary>
      <div class="overflow-x-auto border-t border-line">
        <table class="w-full text-sm">
          <caption class="sr-only">Jumlah penduduk menurut kelompok umur dan jenis kelamin</caption>
          <thead class="bg-surface-muted text-left text-xs text-ink-muted">
            <tr>
              <th scope="col" class="px-4 py-2 font-semibold">Kelompok Umur</th>
              <th scope="col" class="px-4 py-2 text-right font-semibold">Laki-laki</th>
              <th scope="col" class="px-4 py-2 text-right font-semibold">Perempuan</th>
              <th scope="col" class="px-4 py-2 text-right font-semibold">Jumlah</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-line tabular-nums">
            <tr v-for="r in rows" :key="r.band">
              <th scope="row" class="px-4 py-1.5 text-left font-medium text-ink">{{ ageBandLabel(r.band) }}</th>
              <td class="px-4 py-1.5 text-right text-ink-muted">{{ formatNumber(r.male) }}</td>
              <td class="px-4 py-1.5 text-right text-ink-muted">{{ formatNumber(r.female) }}</td>
              <td class="px-4 py-1.5 text-right text-ink">{{ formatNumber(r.male + r.female) }}</td>
            </tr>
          </tbody>
          <tfoot class="border-t border-line font-semibold tabular-nums">
            <tr>
              <th scope="row" class="px-4 py-2 text-left">Total</th>
              <td class="px-4 py-2 text-right">{{ formatNumber(totals.male) }}</td>
              <td class="px-4 py-2 text-right">{{ formatNumber(totals.female) }}</td>
              <td class="px-4 py-2 text-right">{{ formatNumber(grandTotal) }}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </details>
  </figure>
</template>
