<script setup lang="ts">
const { village } = useSiteConfig()

const today = new Intl.DateTimeFormat('id-ID', {
  weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
}).format(new Date())

const socials = computed(() => {
  const s = village.value.socialMedia
  return [
    { k: 'instagram', url: s.instagram },
    { k: 'facebook', url: s.facebook },
    { k: 'youtube', url: s.youtube },
  ].filter((x) => x.url)
})
const emergency = computed(() => village.value.contact.emergencyContacts.filter((e) => e.number))
</script>

<template>
  <div class="hidden bg-secondary text-white/90 md:block">
    <div class="container-app flex h-9 items-center justify-between text-xs">
      <div class="flex items-center gap-4">
        <span class="flex items-center gap-1.5">
          <AppIcon name="calendar" :size="14" /> {{ today }}
        </span>
        <span v-if="emergency.length" class="flex items-center gap-1.5 border-l border-white/20 pl-4">
          <AppIcon name="phone" :size="14" />
          <span v-for="(e, i) in emergency.slice(0, 2)" :key="i">
            {{ e.label }}: <a :href="`tel:${e.number}`" class="font-medium hover:underline">{{ e.number }}</a>
            <span v-if="i < Math.min(emergency.length, 2) - 1" class="mx-1 opacity-40">•</span>
          </span>
        </span>
      </div>
      <div class="flex items-center gap-3">
        <NuxtLink to="/kontak" class="hover:underline">Kontak</NuxtLink>
        <NuxtLink to="/transparansi" class="hover:underline">Transparansi</NuxtLink>
        <div v-if="socials.length" class="flex items-center gap-2 border-l border-white/20 pl-3">
          <a
            v-for="s in socials"
            :key="s.k"
            :href="s.url"
            target="_blank"
            rel="noopener"
            class="opacity-80 transition hover:opacity-100"
            :aria-label="s.k"
          >
            <AppIcon :name="s.k" :size="15" />
          </a>
        </div>
      </div>
    </div>
  </div>
</template>
