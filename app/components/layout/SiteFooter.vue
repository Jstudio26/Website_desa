<script setup lang="ts">
const { village, footer } = useSiteConfig()

const year = new Date().getFullYear()
const bottom = computed(() =>
  (footer.value.bottomText || '© {year} {village}.')
    .replace('{year}', String(year))
    .replace('{village}', village.value.villageName),
)
const socials = computed(() => {
  const s = village.value.socialMedia
  return [
    { k: 'instagram', url: s.instagram },
    { k: 'facebook', url: s.facebook },
    { k: 'youtube', url: s.youtube },
  ].filter((x) => x.url)
})
</script>

<template>
  <footer class="relative overflow-hidden bg-secondary text-white/80">
    <div class="pattern-batik absolute inset-0 opacity-[0.15]" />
    <div class="container-app relative">
      <!-- top -->
      <div class="grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-5">
        <div class="lg:col-span-2">
          <div class="flex items-center gap-3">
            <img v-if="village.logo" :src="village.logo" alt="" class="h-11 w-11 rounded-md bg-white/10 object-contain p-1">
            <span v-else class="grid h-11 w-11 place-items-center rounded-md bg-white/10 font-heading text-lg font-bold text-white">
              {{ village.villageName.charAt(0) }}
            </span>
            <div>
              <p class="font-heading text-lg font-semibold text-white">{{ village.villageName }}</p>
              <p class="text-xs uppercase tracking-wide opacity-70">
                {{ [village.district, village.regency].filter(Boolean).join(', ') }}
              </p>
            </div>
          </div>
          <p class="mt-4 max-w-sm text-sm leading-relaxed">{{ footer.description }}</p>
          <div v-if="socials.length" class="mt-5 flex gap-2">
            <a
              v-for="s in socials"
              :key="s.k"
              :href="s.url"
              target="_blank"
              rel="noopener"
              class="grid h-9 w-9 place-items-center rounded-full bg-white/10 transition hover:bg-white/20"
              :aria-label="s.k"
            >
              <AppIcon :name="s.k" :size="16" />
            </a>
          </div>
        </div>

        <div v-for="col in footer.columns" :key="col.title">
          <h3 class="text-sm font-semibold uppercase tracking-wide text-white">{{ col.title }}</h3>
          <ul class="mt-4 space-y-2.5 text-sm">
            <li v-for="l in col.links" :key="l.url">
              <NuxtLink :to="l.url" class="transition hover:text-white hover:underline">{{ l.label }}</NuxtLink>
            </li>
          </ul>
        </div>

        <div>
          <h3 class="text-sm font-semibold uppercase tracking-wide text-white">Kontak</h3>
          <ul class="mt-4 space-y-3 text-sm">
            <li v-if="village.contact.address" class="flex gap-2.5">
              <AppIcon name="mapPin" :size="16" class="mt-0.5 shrink-0 opacity-70" />
              <span>{{ village.contact.address }}</span>
            </li>
            <li v-if="village.contact.phone" class="flex gap-2.5">
              <AppIcon name="phone" :size="16" class="mt-0.5 shrink-0 opacity-70" />
              <a :href="`tel:${village.contact.phone}`" class="hover:text-white">{{ village.contact.phone }}</a>
            </li>
            <li v-if="village.contact.email" class="flex gap-2.5">
              <AppIcon name="mail" :size="16" class="mt-0.5 shrink-0 opacity-70" />
              <a :href="`mailto:${village.contact.email}`" class="hover:text-white">{{ village.contact.email }}</a>
            </li>
          </ul>
        </div>
      </div>

      <!-- KKT credit -->
      <div
        v-if="footer.showCredit"
        class="flex flex-col gap-3 border-t border-white/15 py-6 text-sm sm:flex-row sm:items-center sm:justify-between"
      >
        <p class="max-w-2xl opacity-80">
          {{ footer.creditText }}
        </p>
        <NuxtLink
          v-if="footer.showDeveloperLink"
          :to="footer.developerLinkUrl"
          class="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-white/25 px-4 py-2 font-medium text-white transition hover:bg-white/10"
        >
          {{ footer.developerLinkLabel }}
          <AppIcon name="arrowRight" :size="15" />
        </NuxtLink>
      </div>

      <div class="flex flex-col gap-2 border-t border-white/15 py-5 text-xs opacity-70 sm:flex-row sm:items-center sm:justify-between">
        <p>{{ bottom }}</p>
        <p class="flex items-center gap-3">
          <NuxtLink to="/tentang-website" class="hover:text-white">Tentang Website</NuxtLink>
          <NuxtLink to="/kebijakan-privasi" class="hover:text-white">Kebijakan Privasi</NuxtLink>
        </p>
      </div>
    </div>
  </footer>
</template>
