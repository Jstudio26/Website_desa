<script setup lang="ts">
import { SITE_LOCALE } from '~/config/site'

const { settings } = useSettings()

const today = new Intl.DateTimeFormat(SITE_LOCALE, {
  weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
}).format(new Date())

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
  <div class="hidden bg-primary-deep text-white/85 md:block">
    <div class="container-app flex h-9 items-center justify-between text-xs">
      <div class="flex items-center gap-4">
        <span class="flex items-center gap-1.5">
          <AppIcon name="calendar" :size="13" /> {{ today }}
        </span>
        <a
          v-if="settings.phone"
          :href="`tel:${settings.phone}`"
          class="flex items-center gap-1.5 border-l border-white/20 pl-4 transition hover:text-white"
        >
          <AppIcon name="phone" :size="13" /> {{ settings.phone }}
        </a>
      </div>
      <div class="flex items-center gap-3">
        <NuxtLink to="/kontak" class="link-underline transition hover:text-white">Hubungi Kami</NuxtLink>
        <div v-if="socials.length" class="flex items-center gap-2.5 border-l border-white/20 pl-3">
          <a
            v-for="s in socials"
            :key="s.k"
            :href="s.url"
            target="_blank"
            rel="noopener"
            class="opacity-80 transition hover:opacity-100"
            :aria-label="s.k"
          >
            <AppIcon :name="s.k" :size="14" />
          </a>
        </div>
      </div>
    </div>
  </div>
</template>
