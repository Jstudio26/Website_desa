<script setup lang="ts">
import { POSKO_POSITIONS } from '~/config/posko'
import type { PoskoInfo, PoskoPerson } from '~/types/database'

/**
 * Bagan struktur organisasi posko, tingkat demi tingkat dari POSKO_POSITIONS.
 * Jabatan 1 orang tampil sebagai kartu foto; bidang (beberapa orang) sebagai kartu grup.
 * Hanya jabatan yang sudah diisi yang tampil. Garis penghubung cuma hiasan (aria-hidden):
 * urutan baca dari atas ke bawah sudah mengikuti hierarki.
 */
const props = defineProps<{ structure: PoskoInfo['structure'] }>()

type Slot = { key: string, label: string, people: PoskoPerson[] }

const tiers = computed(() => {
  const byTier = new Map<number, { singles: Slot[], groups: Slot[] }>()
  for (const pos of POSKO_POSITIONS) {
    const people = (props.structure[pos.key] ?? []).filter((p) => p?.name).slice(0, pos.capacity)
    if (!people.length) continue
    const tier = byTier.get(pos.tier) ?? { singles: [], groups: [] }
    ;(pos.capacity > 1 ? tier.groups : tier.singles).push({ key: pos.key, label: pos.label, people })
    byTier.set(pos.tier, tier)
  }
  return [...byTier.entries()].sort(([a], [b]) => a - b).map(([tier, t]) => ({ tier, ...t }))
})

// Static class maps (Tailwind needs literal class names) for 1–4 groups in one row.
const GROUP_COLS: Record<number, string> = {
  1: 'lg:mx-auto lg:max-w-sm lg:grid-cols-1',
  2: 'lg:grid-cols-2',
  3: 'lg:grid-cols-3',
  4: 'lg:grid-cols-4',
}
const GROUP_BAR: Record<number, string> = { 2: 'lg:inset-x-[25%]', 3: 'lg:inset-x-[16.666%]', 4: 'lg:inset-x-[12.5%]' }

const initials = (name: string) =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]!.toUpperCase()).join('')
</script>

<template>
  <div v-if="tiers.length">
    <template v-for="(t, ti) in tiers" :key="t.tier">
      <!-- connector from the tier above -->
      <div v-if="ti > 0" class="mx-auto h-6 w-px bg-primary/30" aria-hidden="true" />

      <!-- Single-person positions -->
      <div
        v-if="t.singles.length"
        v-reveal
        class="relative mx-auto flex w-full flex-col items-center gap-4 sm:w-fit sm:flex-row sm:items-stretch"
        :class="t.singles.length > 1 ? 'sm:mt-4' : ''"
      >
        <span
          v-if="t.singles.length > 1"
          class="absolute -top-4 left-[7.5rem] right-[7.5rem] hidden h-px bg-primary/30 sm:block"
          aria-hidden="true"
        />
        <div
          v-for="s in t.singles"
          :key="s.key"
          class="relative w-full max-w-xs rounded-theme border border-line/80 bg-surface p-5 text-center shadow-card sm:w-60"
        >
          <span
            v-if="t.singles.length > 1"
            class="absolute -top-4 left-1/2 hidden h-4 w-px bg-primary/30 sm:block"
            aria-hidden="true"
          />
          <div class="mx-auto h-24 w-24 overflow-hidden rounded-2xl bg-primary/10 ring-4 ring-primary/10">
            <img v-if="s.people[0]!.photoUrl" :src="s.people[0]!.photoUrl" :alt="s.people[0]!.name" class="h-full w-full object-cover" loading="lazy">
            <div v-else class="grid h-full place-items-center font-heading text-2xl font-extrabold text-primary" aria-hidden="true">
              {{ initials(s.people[0]!.name) }}
            </div>
          </div>
          <p class="mt-4 text-[0.7rem] font-bold uppercase tracking-wider text-primary">{{ s.label }}</p>
          <p class="mt-1 font-heading font-bold leading-snug text-ink">{{ s.people[0]!.name }}</p>
          <p v-if="s.people[0]!.detail" class="mt-0.5 text-xs text-ink-muted">{{ s.people[0]!.detail }}</p>
        </div>
      </div>

      <!-- Bidang (several people each) -->
      <div
        v-if="t.groups.length"
        v-reveal
        class="relative grid gap-4 sm:grid-cols-2"
        :class="[GROUP_COLS[t.groups.length], t.groups.length > 1 ? 'lg:mt-4' : '', t.singles.length ? 'mt-6' : '']"
      >
        <span
          v-if="t.groups.length > 1"
          class="absolute -top-4 hidden h-px bg-primary/30 lg:block"
          :class="GROUP_BAR[t.groups.length]"
          aria-hidden="true"
        />
        <section
          v-for="g in t.groups"
          :key="g.key"
          class="relative rounded-theme border border-line/80 bg-surface shadow-card"
        >
          <span
            v-if="t.groups.length > 1"
            class="absolute -top-4 left-1/2 hidden h-4 w-px bg-primary/30 lg:block"
            aria-hidden="true"
          />
          <h3 class="rounded-t-theme border-b border-line bg-primary/5 px-4 py-3 text-center text-sm font-bold text-primary">
            {{ g.label }}
          </h3>
          <ul class="divide-y divide-line">
            <li v-for="p in g.people" :key="p.id" class="flex items-center gap-3 px-4 py-3">
              <div class="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-primary/10">
                <img v-if="p.photoUrl" :src="p.photoUrl" :alt="p.name" class="h-full w-full object-cover" loading="lazy">
                <div v-else class="grid h-full place-items-center text-sm font-extrabold text-primary" aria-hidden="true">
                  {{ initials(p.name) }}
                </div>
              </div>
              <div class="min-w-0">
                <p class="text-sm font-semibold leading-snug text-ink">{{ p.name }}</p>
                <p v-if="p.detail" class="text-xs text-ink-muted">{{ p.detail }}</p>
              </div>
            </li>
          </ul>
        </section>
      </div>
    </template>
  </div>
</template>
