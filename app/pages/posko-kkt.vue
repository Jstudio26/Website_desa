<script setup lang="ts">
import type { ProgramStatus } from '~/types/database'
import { POSKO_POSITIONS, STUDENT_TIER_FROM } from '~/config/posko'
import { withPoskoDefaults } from '~/composables/useSettings'

const { settings } = useSettings()
const posko = computed(() => withPoskoDefaults(settings.value.posko))

const STATUS: Record<ProgramStatus, { label: string, tone: 'solid' | 'soft' | 'neutral' }> = {
  selesai: { label: 'Selesai', tone: 'solid' },
  berjalan: { label: 'Berjalan', tone: 'soft' },
  rencana: { label: 'Rencana', tone: 'neutral' },
}

const statusOf = (s: ProgramStatus) => STATUS[s] ?? STATUS.rencana

const peopleIn = (key: string) => (posko.value.structure[key] ?? []).filter((p) => p?.name)
const hasStructure = computed(() => POSKO_POSITIONS.some((pos) => peopleIn(pos.key).length))
const studentCount = computed(() => POSKO_POSITIONS
  .filter((pos) => pos.tier >= STUDENT_TIER_FROM)
  .reduce((n, pos) => n + Math.min(peopleIn(pos.key).length, pos.capacity), 0))
const supervisor = computed(() => peopleIn('dosenPembimbing')[0]?.name ?? '')

const facts = computed(() => [
  { label: 'Mahasiswa', value: studentCount.value },
  { label: 'Program Kerja', value: posko.value.programs.length },
  { label: 'Program Selesai', value: posko.value.programs.filter((p) => p.status === 'selesai').length },
].filter((f) => f.value > 0))

useHead({ title: 'Posko KKT 149' })
</script>

<template>
  <div>
    <PageHero
      :title="posko.title"
      :subtitle="`Kuliah Kerja Terpadu ${posko.university}`"
      :breadcrumb="[{ label: 'Posko KKT' }]"
    />

    <!-- Tentang posko -->
    <section class="section container-app">
      <div class="grid items-center gap-10 lg:grid-cols-[minmax(0,22rem)_1fr]">
        <div v-reveal class="mx-auto w-full max-w-xs rounded-theme border border-line/80 bg-surface p-6 shadow-card lg:max-w-none">
          <img
            src="/images/logo-kkt149-matani3.webp"
            alt="Logo Posko Matani 3 KKT 149 Universitas Sam Ratulangi"
            width="640"
            height="640"
            class="mx-auto h-auto w-full"
          >
        </div>

        <div v-reveal="1">
          <span class="eyebrow"><span class="h-px w-6 bg-primary" /> Tentang Posko</span>
          <h2 class="mt-4 font-heading text-2xl font-extrabold sm:text-3xl">{{ posko.title }}</h2>
          <p class="mt-4 whitespace-pre-line leading-relaxed text-ink-muted">{{ posko.intro }}</p>

          <dl class="mt-6 grid gap-3 sm:grid-cols-2">
            <div class="rounded-theme border border-line/80 bg-surface px-4 py-3 shadow-card">
              <dt class="text-xs font-semibold uppercase tracking-wide text-ink-muted">Perguruan Tinggi</dt>
              <dd class="mt-0.5 font-semibold text-ink">{{ posko.university }}</dd>
            </div>
            <div class="rounded-theme border border-line/80 bg-surface px-4 py-3 shadow-card">
              <dt class="text-xs font-semibold uppercase tracking-wide text-ink-muted">Lokasi</dt>
              <dd class="mt-0.5 font-semibold text-ink">{{ settings.villageName }}</dd>
            </div>
            <div v-if="posko.period" class="rounded-theme border border-line/80 bg-surface px-4 py-3 shadow-card">
              <dt class="text-xs font-semibold uppercase tracking-wide text-ink-muted">Periode</dt>
              <dd class="mt-0.5 font-semibold text-ink">{{ posko.period }}</dd>
            </div>
            <div v-if="supervisor" class="rounded-theme border border-line/80 bg-surface px-4 py-3 shadow-card">
              <dt class="text-xs font-semibold uppercase tracking-wide text-ink-muted">Dosen Pembimbing Lapangan</dt>
              <dd class="mt-0.5 font-semibold text-ink">{{ supervisor }}</dd>
            </div>
          </dl>

          <div v-if="facts.length" class="mt-6 flex flex-wrap gap-x-8 gap-y-3">
            <div v-for="f in facts" :key="f.label">
              <p class="font-heading text-3xl font-extrabold text-primary">{{ f.value }}</p>
              <p class="text-xs font-medium text-ink-muted">{{ f.label }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Struktur organisasi -->
    <section v-if="hasStructure" class="section bg-surface-muted/50">
      <div class="container-app">
        <div v-reveal class="text-center">
          <span class="eyebrow justify-center"><span class="h-px w-6 bg-primary" /> Tim</span>
          <h2 class="mt-4 font-heading text-2xl font-extrabold">Struktur Organisasi Posko</h2>
        </div>
        <PoskoOrgChart :structure="posko.structure" class="mt-10" />
      </div>
    </section>

    <!-- Program kerja -->
    <section v-if="posko.programs.length" class="section container-app">
      <div v-reveal>
        <span class="eyebrow"><span class="h-px w-6 bg-primary" /> Kegiatan</span>
        <h2 class="mt-4 font-heading text-2xl font-extrabold">Program Kerja</h2>
      </div>
      <ol class="mt-8 grid gap-4 md:grid-cols-2">
        <li
          v-for="(p, i) in posko.programs"
          :key="p.id"
          v-reveal="i % 2"
          class="flex gap-4 rounded-theme border border-line/80 bg-surface p-5 shadow-card"
        >
          <span class="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-sm font-extrabold text-primary">{{ i + 1 }}</span>
          <div class="min-w-0 flex-1">
            <div class="flex flex-wrap items-start justify-between gap-2">
              <h3 class="font-heading font-bold leading-snug text-ink">{{ p.title }}</h3>
              <span
                class="shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold"
                :class="{
                  'bg-primary text-white': statusOf(p.status).tone === 'solid',
                  'bg-primary/10 text-primary': statusOf(p.status).tone === 'soft',
                  'bg-surface-muted text-ink-muted ring-1 ring-line': statusOf(p.status).tone === 'neutral',
                }"
              >{{ statusOf(p.status).label }}</span>
            </div>
            <p v-if="p.description" class="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-ink-muted">{{ p.description }}</p>
          </div>
        </li>
      </ol>
    </section>
  </div>
</template>
