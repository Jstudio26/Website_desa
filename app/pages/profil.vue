<script setup lang="ts">
import type { Database } from '~/types/supabase'
import type { Official } from '~/types/database'
import { formatNumber } from '~/utils/format'

const supabase = useSupabaseClient<Database>()
const { settings } = useSettings()

const { data: officials } = await useAsyncData('officials', async () => {
  const { data } = await supabase
    .from('officials')
    .select('*')
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: true })
  return (data ?? []) as Official[]
})

const mission = computed(() => settings.value.mission?.filter(Boolean) ?? [])
const stats = computed(() => {
  const s = settings.value
  return [
    { label: 'Penduduk', value: s.population },
    { label: 'Kepala Keluarga', value: s.households },
    { label: 'Lingkungan', value: s.hamlets },
    { label: 'Luas (km²)', value: s.areaKm2 },
  ].filter((x) => x.value != null)
})

useHead({ title: 'Profil Kelurahan' })
</script>

<template>
  <div>
    <PageHero
      title="Profil Kelurahan"
      :subtitle="settings.tagline"
      :breadcrumb="[{ label: 'Profil Kelurahan' }]"
    />

    <!-- Wilayah + statistik -->
    <section class="section container-app">
      <div class="grid gap-10 lg:grid-cols-[1fr_1.3fr]">
        <div>
          <span class="eyebrow"><span class="h-px w-6 bg-primary" /> Wilayah</span>
          <h2 class="mt-4 font-heading text-2xl font-extrabold">Sekilas {{ settings.villageName }}</h2>
          <dl class="mt-6 divide-y divide-line rounded-theme border border-line/80 bg-surface text-sm shadow-card">
            <div v-if="settings.district" class="flex justify-between gap-6 px-4 py-3">
              <dt class="text-ink-muted">Kecamatan</dt><dd class="text-right font-semibold">{{ settings.district }}</dd>
            </div>
            <div v-if="settings.regency" class="flex justify-between gap-6 px-4 py-3">
              <dt class="text-ink-muted">Kabupaten / Kota</dt><dd class="text-right font-semibold">{{ settings.regency }}</dd>
            </div>
            <div v-if="settings.province" class="flex justify-between gap-6 px-4 py-3">
              <dt class="text-ink-muted">Provinsi</dt><dd class="text-right font-semibold">{{ settings.province }}</dd>
            </div>
            <div v-if="settings.address" class="flex justify-between gap-6 px-4 py-3">
              <dt class="text-ink-muted">Alamat Kantor</dt><dd class="text-right font-semibold">{{ settings.address }}</dd>
            </div>
          </dl>
        </div>

        <div>
          <div v-if="stats.length" class="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div v-for="s in stats" :key="s.label" class="accent-top rounded-theme border border-line/80 bg-surface p-4 text-center shadow-card">
              <p class="font-heading text-[1.6rem] font-extrabold text-primary">{{ formatNumber(Number(s.value)) }}</p>
              <p class="mt-1 text-xs font-medium text-ink-muted">{{ s.label }}</p>
            </div>
          </div>
          <div v-if="settings.mapEmbedUrl" class="mt-3 overflow-hidden rounded-theme border border-line/80 shadow-card">
            <iframe :src="settings.mapEmbedUrl" class="h-72 w-full" loading="lazy" referrerpolicy="no-referrer-when-downgrade" />
          </div>
        </div>
      </div>
    </section>

    <!-- Sejarah -->
    <section v-if="settings.history" class="section bg-surface-muted/50">
      <div class="container-app max-w-3xl">
        <span class="eyebrow"><span class="h-px w-6 bg-primary" /> Riwayat</span>
        <h2 class="mt-4 font-heading text-2xl font-extrabold">Sejarah {{ settings.villageName }}</h2>
        <RichText :html="settings.history" class="mt-6" />
      </div>
    </section>

    <!-- Visi & Misi -->
    <section v-if="settings.vision || mission.length" class="section container-app">
      <div class="grid gap-10 md:grid-cols-2">
        <div v-if="settings.vision" class="accent-top rounded-theme border border-line/80 bg-surface p-6 shadow-card sm:p-8">
          <h2 class="font-heading text-2xl font-extrabold">Visi</h2>
          <p class="mt-4 text-lg italic leading-relaxed text-ink-muted">“{{ settings.vision }}”</p>
        </div>
        <div v-if="mission.length" class="rounded-theme border border-line/80 bg-surface p-6 shadow-card sm:p-8">
          <h2 class="font-heading text-2xl font-extrabold">Misi</h2>
          <ol class="mt-4 space-y-3">
            <li v-for="(m, i) in mission" :key="i" class="flex gap-3 text-ink-muted">
              <span class="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-primary/10 text-xs font-extrabold text-primary">{{ i + 1 }}</span>
              <span class="pt-0.5">{{ m }}</span>
            </li>
          </ol>
        </div>
      </div>
    </section>

    <!-- Perangkat Kelurahan -->
    <section v-if="officials?.length" class="section bg-surface-muted/50">
      <div class="container-app">
        <span class="eyebrow"><span class="h-px w-6 bg-primary" /> Pemerintahan</span>
        <h2 class="mt-4 font-heading text-2xl font-extrabold">Perangkat Kelurahan</h2>
        <div class="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div v-for="o in officials" :key="o.id" class="card card-hover p-5 text-center">
            <div class="mx-auto h-24 w-24 overflow-hidden rounded-2xl bg-surface-muted ring-4 ring-primary/10">
              <NuxtImg v-if="o.photo_url" :src="o.photo_url" :alt="o.name" class="h-full w-full object-cover" sizes="120px" />
              <div v-else class="grid h-full place-items-center text-ink-muted/40">
                <AppIcon name="user" :size="34" />
              </div>
            </div>
            <p class="mt-4 font-heading font-bold text-ink">{{ o.name }}</p>
            <p class="text-sm text-ink-muted">{{ o.position }}</p>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
