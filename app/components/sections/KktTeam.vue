<script setup lang="ts">
import type { SectionProps } from './types'
import { apiFetch } from '~/composables/useApi'

defineProps<Partial<SectionProps>>()
useReveal()

interface Member {
  id: string
  name: string
  photo: string | null
  studentId: string | null
  studyProgram: string | null
  faculty: string | null
  university: string | null
  position: string | null
  instagram: string | null
  linkedin: string | null
  email: string | null
}
interface TeamPayload {
  settings: {
    programName: string, universityName: string, facultyName: string, year: string
    period: string, postName: string, location: string, villageName: string
    description: string, universityLogo: string | null, kktLogo: string | null, heroImage: string | null
  }
  coordinators: Member[]
  secretaries: Member[]
  treasurers: Member[]
  fields: Array<{ id: string, name: string, description: string | null, image: string | null, members: Member[] }>
  unassigned: Member[]
}

const { data, error } = await useAsyncData('kkt-team', () => apiFetch<TeamPayload>('/api/public/kkt/team'))
const t = computed(() => data.value)
</script>

<template>
  <div v-if="error" class="rounded-theme border border-dashed border-line p-10 text-center text-ink-muted">
    Halaman tim pengembang sedang tidak aktif.
  </div>

  <div v-else-if="t" class="space-y-20">
    <!-- HERO -->
    <div class="relative overflow-hidden rounded-theme bg-secondary text-white">
      <NuxtImg
        v-if="t.settings.heroImage"
        :src="t.settings.heroImage"
        alt=""
        class="absolute inset-0 h-full w-full object-cover opacity-25"
        sizes="100vw"
      />
      <div class="pattern-batik absolute inset-0 opacity-10" />
      <div class="relative px-6 py-16 text-center sm:px-12 sm:py-20">
        <div v-if="t.settings.universityLogo || t.settings.kktLogo" class="mb-6 flex items-center justify-center gap-6">
          <img v-if="t.settings.universityLogo" :src="t.settings.universityLogo" alt="Logo Universitas" class="h-16 w-16 rounded-lg bg-white/10 object-contain p-1">
          <img v-if="t.settings.kktLogo" :src="t.settings.kktLogo" alt="Logo KKT" class="h-16 w-16 rounded-lg bg-white/10 object-contain p-1">
        </div>
        <p class="text-xs font-semibold uppercase tracking-[0.25em] text-accent">Tim Pengembang Website</p>
        <h1 class="mx-auto mt-3 max-w-3xl font-heading text-3xl font-bold sm:text-4xl">
          {{ t.settings.programName }}<span v-if="t.settings.year"> {{ t.settings.year }}</span>
        </h1>
        <p class="mx-auto mt-4 max-w-2xl text-white/80">{{ t.settings.description }}</p>
        <div class="mx-auto mt-8 flex max-w-2xl flex-wrap justify-center gap-x-8 gap-y-3 text-sm text-white/85">
          <span v-if="t.settings.universityName" class="flex items-center gap-2"><AppIcon name="graduation" :size="16" />{{ t.settings.universityName }}</span>
          <span v-if="t.settings.period" class="flex items-center gap-2"><AppIcon name="calendar" :size="16" />{{ t.settings.period }}</span>
          <span v-if="t.settings.location" class="flex items-center gap-2"><AppIcon name="mapPin" :size="16" />{{ t.settings.location }}</span>
          <span v-if="t.settings.postName" class="flex items-center gap-2"><AppIcon name="home" :size="16" />{{ t.settings.postName }}</span>
        </div>
      </div>
    </div>

    <!-- CORE (koordinator / sekretaris / bendahara) -->
    <div class="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
      <SectionsKktMemberCard
        v-for="m in t.coordinators" :key="m.id" :member="m" role-label="Koordinator Posko" prominent
      />
      <SectionsKktMemberCard v-for="m in t.secretaries" :key="m.id" :member="m" role-label="Sekretaris Posko" />
      <SectionsKktMemberCard v-for="m in t.treasurers" :key="m.id" :member="m" role-label="Bendahara Posko" />
    </div>

    <!-- FIELDS -->
    <div v-for="f in t.fields" :key="f.id" class="reveal">
      <div class="mb-6 border-l-4 border-primary pl-4">
        <h2 class="font-heading text-2xl font-bold text-ink">{{ f.name }}</h2>
        <p v-if="f.description" class="mt-1 max-w-2xl text-sm text-ink-muted">{{ f.description }}</p>
      </div>
      <div v-if="f.members.length" class="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        <SectionsKktMemberCard v-for="m in f.members" :key="m.id" :member="m" />
      </div>
      <p v-else class="text-sm text-ink-muted">Belum ada anggota pada bidang ini.</p>
    </div>

    <div v-if="t.unassigned.length" class="reveal">
      <h2 class="mb-6 font-heading text-2xl font-bold text-ink">Anggota Lainnya</h2>
      <div class="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        <SectionsKktMemberCard v-for="m in t.unassigned" :key="m.id" :member="m" />
      </div>
    </div>
  </div>
</template>
