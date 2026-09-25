<script setup lang="ts">
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
        <div v-for="s in summaryStats" :key="s.label" class="accent-top rounded-theme border border-line/80 bg-surface p-5 text-center shadow-card">
          <div class="mx-auto grid h-10 w-10 place-items-center rounded-full bg-primary/10 text-primary">
            <AppIcon :name="s.icon" :size="18" />
          </div>
          <p class="mt-3 font-heading text-2xl font-extrabold text-primary">{{ formatNumber(Number(s.value)) }}</p>
          <p class="mt-1 text-xs font-medium text-ink-muted">{{ s.label }}</p>
        </div>
      </div>
      <UiEmptyState v-else title="Belum ada data" message="Data kependudukan belum diisi oleh admin." />
    </section>

    <!-- Balita -->
    <section class="section bg-surface-muted/50">
      <div class="container-app">
        <span class="eyebrow"><span class="h-px w-6 bg-primary" /> Kelompok Umur</span>
        <h2 class="mt-4 font-heading text-2xl font-extrabold">Data Balita</h2>
        <div class="mt-8 grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
          <div v-for="s in balitaStats" :key="s.label" class="rounded-theme border border-line/80 bg-surface p-5 text-center shadow-card">
            <p class="font-heading text-xl font-extrabold text-ink">{{ formatNumber(s.value) }}</p>
            <p class="mt-1 text-xs font-medium text-ink-muted">{{ s.label }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Lansia -->
    <section class="section container-app">
      <span class="eyebrow"><span class="h-px w-6 bg-primary" /> Kelompok Umur</span>
      <h2 class="mt-4 font-heading text-2xl font-extrabold">Data Lansia</h2>
      <div class="mt-8 grid gap-4 sm:grid-cols-3">
        <div v-for="s in lansiaStats" :key="s.label" class="rounded-theme border border-line/80 bg-surface p-5 text-center shadow-card">
          <p class="font-heading text-xl font-extrabold text-ink">{{ formatNumber(s.value) }}</p>
          <p class="mt-1 text-xs font-medium text-ink-muted">{{ s.label }}</p>
        </div>
        <div class="accent-top rounded-theme border border-line/80 bg-surface p-5 text-center shadow-card sm:col-span-3 lg:col-span-1">
          <p class="font-heading text-xl font-extrabold text-primary">{{ formatNumber(lansiaTotal || null) }}</p>
          <p class="mt-1 text-xs font-medium text-ink-muted">Total Lansia</p>
        </div>
      </div>
    </section>
  </div>
</template>
