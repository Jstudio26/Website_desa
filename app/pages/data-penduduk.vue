<script setup lang="ts">
import type { DonutSegment } from '~/components/DonutChart.vue'
import { SEX_COLORS } from '~/config/penduduk'
import { formatNumber } from '~/utils/format'

const { settings } = useSettings()

const balitaStats = computed(() => {
  const d = settings.value.demographics
  return [
    { label: '0 - 11 bulan', value: d.balita0_11 },
    { label: '1 - 2 tahun', value: d.balita1_2 },
    { label: '2 - 3 tahun', value: d.balita2_3 },
    { label: '3 - 4 tahun', value: d.balita3_4 },
    { label: '4 - 5 tahun', value: d.balita4_5 },
  ]
})
const balitaTotal = computed(() =>
  balitaStats.value.reduce((sum, s) => sum + (s.value ?? 0), 0),
)

const lansiaStats = computed(() => {
  const d = settings.value.demographics
  return [
    { label: '60 - 69 tahun', value: d.lansia60_69 },
    { label: '70 - 79 tahun', value: d.lansia70_79 },
    { label: '80 tahun ke atas', value: d.lansia80Plus },
  ]
})
const lansiaTotal = computed(() =>
  lansiaStats.value.reduce((sum, s) => sum + (s.value ?? 0), 0),
)

// Chart colours: Merah-Putih reds only, checked with the dataviz palette validator.
// Gender is nominal → two clearly separated reds; age is ordered → one red ramp, light → dark.
const genderSegments = computed<DonutSegment[]>(() => {
  const d = settings.value.demographics
  return [
    { label: 'Laki-laki', value: d.male ?? 0, color: SEX_COLORS.male },
    { label: 'Perempuan', value: d.female ?? 0, color: SEX_COLORS.female },
  ]
})

// The remaining age band is derived, so only chart it when the parts fit inside the total.
const ageSegments = computed<DonutSegment[]>(() => {
  const population = settings.value.population ?? 0
  const rest = population - balitaTotal.value - lansiaTotal.value
  if (!population || rest < 0 || !(balitaTotal.value + lansiaTotal.value)) return []
  return [
    { label: 'Balita (di bawah 5 tahun)', value: balitaTotal.value, color: '#F0959E' },
    { label: 'Usia 5–59 tahun', value: rest, color: '#C7182D' },
    { label: 'Lansia (60+ tahun)', value: lansiaTotal.value, color: '#7A0C19' },
  ]
})

const hasGender = computed(() => genderSegments.value.some((s) => s.value > 0))
const hasAge = computed(() => ageSegments.value.length > 0)
const hasPyramid = computed(() =>
  Object.values(settings.value.ageDistribution ?? {}).some((r) => (r?.male ?? 0) + (r?.female ?? 0) > 0),
)

const summaryStats = computed(() => {
  const s = settings.value
  return [
    { label: 'Total Penduduk', value: s.population, icon: 'users' },
    { label: 'Total Balita', value: balitaTotal.value || null, icon: 'user' },
    { label: 'Ibu Hamil', value: s.demographics.ibuHamil, icon: 'user' },
    { label: 'Total Lansia', value: lansiaTotal.value || null, icon: 'user' },
  ].filter((x) => x.value != null)
})

useHead({ title: 'Data Kependudukan' })
</script>

<template>
  <div>
    <PageHero
      title="Data Kependudukan"
      subtitle="Rincian jumlah penduduk berdasarkan kelompok umur."
      :breadcrumb="[{ label: 'Data Kependudukan' }]"
    />

    <section class="section container-app">
      <div v-if="summaryStats.length" class="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div v-for="(s, i) in summaryStats" :key="s.label" v-reveal="i" class="accent-top rounded-theme border border-line/80 bg-surface p-5 text-center shadow-card">
          <div class="mx-auto grid h-10 w-10 place-items-center rounded-full bg-primary/10 text-primary">
            <AppIcon :name="s.icon" :size="18" />
          </div>
          <p class="mt-3 font-heading text-2xl font-extrabold text-primary">{{ formatNumber(Number(s.value)) }}</p>
          <p class="mt-1 text-xs font-medium text-ink-muted">{{ s.label }}</p>
        </div>
      </div>
      <UiEmptyState v-else title="Belum ada data" message="Data kependudukan belum diisi oleh admin." />
    </section>

    <!-- Komposisi (persentase) -->
    <section v-if="hasGender || hasAge" class="section pt-0 container-app">
      <div v-reveal>
        <span class="eyebrow"><span class="h-px w-6 bg-primary" /> Persentase</span>
        <h2 class="mt-4 font-heading text-2xl font-extrabold">Komposisi Penduduk</h2>
      </div>
      <div class="mt-8 grid gap-6 lg:grid-cols-2">
        <div v-if="hasGender" v-reveal class="rounded-theme border border-line/80 bg-surface p-5 shadow-card sm:p-6">
          <h3 class="mb-5 font-heading text-lg font-bold text-ink">Jenis Kelamin</h3>
          <DonutChart :segments="genderSegments" label="Penduduk menurut jenis kelamin" />
        </div>
        <div v-if="hasAge" v-reveal="1" class="rounded-theme border border-line/80 bg-surface p-5 shadow-card sm:p-6">
          <h3 class="mb-5 font-heading text-lg font-bold text-ink">Kelompok Usia</h3>
          <DonutChart :segments="ageSegments" label="Penduduk menurut kelompok usia" />
        </div>
      </div>
    </section>

    <!-- Persebaran umur -->
    <section v-if="hasPyramid" class="section pt-0 container-app">
      <div v-reveal>
        <span class="eyebrow"><span class="h-px w-6 bg-primary" /> Persebaran Umur</span>
        <h2 class="mt-4 font-heading text-2xl font-extrabold">Piramida Penduduk</h2>
        <p class="mt-2 max-w-2xl text-sm text-ink-muted">Jumlah penduduk per kelompok umur lima tahunan, menurut jenis kelamin.</p>
      </div>
      <div v-reveal class="mx-auto mt-8 max-w-3xl rounded-theme border border-line/80 bg-surface p-5 shadow-card sm:p-6">
        <PopulationPyramid :data="settings.ageDistribution ?? {}" />
      </div>
    </section>

    <!-- Balita -->
    <section class="section bg-surface-muted/50">
      <div class="container-app">
        <div v-reveal>
          <span class="eyebrow"><span class="h-px w-6 bg-primary" /> Kelompok Umur</span>
          <h2 class="mt-4 font-heading text-2xl font-extrabold">Data Balita</h2>
        </div>
        <div class="mt-8 grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
          <div v-for="(s, i) in balitaStats" :key="s.label" v-reveal="i" class="rounded-theme border border-line/80 bg-surface p-5 text-center shadow-card">
            <p class="font-heading text-xl font-extrabold text-ink">{{ formatNumber(s.value) }}</p>
            <p class="mt-1 text-xs font-medium text-ink-muted">{{ s.label }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Lansia -->
    <section class="section container-app">
      <div v-reveal>
        <span class="eyebrow"><span class="h-px w-6 bg-primary" /> Kelompok Umur</span>
        <h2 class="mt-4 font-heading text-2xl font-extrabold">Data Lansia</h2>
      </div>
      <div class="mt-8 grid gap-4 sm:grid-cols-3">
        <div v-for="(s, i) in lansiaStats" :key="s.label" v-reveal="i" class="rounded-theme border border-line/80 bg-surface p-5 text-center shadow-card">
          <p class="font-heading text-xl font-extrabold text-ink">{{ formatNumber(s.value) }}</p>
          <p class="mt-1 text-xs font-medium text-ink-muted">{{ s.label }}</p>
        </div>
        <div v-reveal="lansiaStats.length" class="accent-top rounded-theme border border-line/80 bg-surface p-5 text-center shadow-card sm:col-span-3 lg:col-span-1">
          <p class="font-heading text-xl font-extrabold text-primary">{{ formatNumber(lansiaTotal || null) }}</p>
          <p class="mt-1 text-xs font-medium text-ink-muted">Total Lansia</p>
        </div>
      </div>
    </section>
  </div>
</template>
