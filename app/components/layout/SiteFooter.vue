<script setup lang="ts">
import { FOOTER_COLUMNS, FOOTER_BOTTOM_TEXT, FOOTER_DESCRIPTION } from '~/config/site'

const { settings } = useSettings()

const year = new Date().getFullYear()
const bottom = computed(() =>
  FOOTER_BOTTOM_TEXT
    .replace('{year}', String(year))
    .replace('{village}', settings.value.villageName),
)
const socials = computed(() => {
  const s = settings.value.social
  return [
    { k: 'instagram', url: s.instagram },
    { k: 'facebook', url: s.facebook },
    { k: 'youtube', url: s.youtube },
    { k: 'tiktok', url: s.tiktok },
  ].filter((x) => x.url)
})
</script>

<template>
  <footer class="grain relative overflow-hidden bg-primary-deep text-white/75">
    <WaveDivider flip color="text-canvas" class="relative" />
    <div class="pattern-flag absolute inset-0 opacity-50" />

    <div class="container-app relative pt-8">
      <div class="grid gap-10 pb-12 pt-6 md:grid-cols-2 lg:grid-cols-5">
        <div class="lg:col-span-2">
          <div class="flex items-center gap-3">
            <span class="grid h-12 w-12 place-items-center overflow-hidden rounded-xl bg-white shadow-lg">
              <img v-if="settings.logoUrl" :src="settings.logoUrl" alt="" class="h-8 w-8 object-contain">
              <span v-else class="font-heading text-lg font-extrabold text-primary">{{ settings.villageName.charAt(0) }}</span>
            </span>
            <div>
              <p class="font-heading text-lg font-extrabold text-white">{{ settings.villageName }}</p>
              <p class="text-xs uppercase tracking-wide opacity-70">
                {{ [settings.district, settings.regency].filter(Boolean).join(', ') }}
              </p>
            </div>
          </div>
          <p class="mt-4 max-w-sm text-sm leading-relaxed">{{ FOOTER_DESCRIPTION }}</p>
          <div v-if="socials.length" class="mt-5 flex gap-2">
            <a
              v-for="s in socials"
              :key="s.k"
              :href="s.url"
              target="_blank"
              rel="noopener"
              class="grid h-9 w-9 place-items-center rounded-full bg-white/10 transition hover:bg-white hover:text-primary"
              :aria-label="s.k"
            >
              <AppIcon :name="s.k" :size="16" />
            </a>
          </div>
        </div>

        <div v-for="col in FOOTER_COLUMNS" :key="col.title">
          <h3 class="text-sm font-bold uppercase tracking-wide text-white">{{ col.title }}</h3>
          <ul class="mt-4 space-y-2.5 text-sm">
            <li v-for="l in col.links" :key="l.url">
              <NuxtLink :to="l.url" class="link-underline transition hover:text-white">{{ l.label }}</NuxtLink>
            </li>
          </ul>
        </div>
      </div>

      <div class="flex flex-col gap-2 border-t border-white/15 py-5 text-xs opacity-75 sm:flex-row sm:items-center sm:justify-between">
        <p>{{ bottom }}</p>
        <NuxtLink to="/admin" class="transition hover:text-white">Login Admin</NuxtLink>
      </div>
    </div>
  </footer>
</template>
