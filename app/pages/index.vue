<script setup lang="ts">
import type { Post, GalleryItem } from '~/types/database'
import type { Database } from '~/types/supabase'
import { formatDate, formatNumber } from '~/utils/format'

definePageMeta({ transparentHeader: true })

const supabase = useSupabaseClient<Database>()
const { settings } = useSettings()

const { data } = await useAsyncData('home', async () => {
  const [berita, pengumuman, galeri] = await Promise.all([
    supabase.from('posts')
      .select('id,type,title,slug,excerpt,cover_url,published_at,created_at')
      .eq('type', 'berita').eq('published', true)
      .order('published_at', { ascending: false, nullsFirst: false }).limit(3),
    supabase.from('posts')
      .select('id,type,title,slug,published_at,created_at')
      .eq('type', 'pengumuman').eq('published', true)
      .order('published_at', { ascending: false, nullsFirst: false }).limit(4),
    supabase.from('gallery')
      .select('id,title,image_url,caption')
      .order('display_order', { ascending: true }).order('created_at', { ascending: false }).limit(6),
  ])
  return {
    berita: (berita.data ?? []) as Post[],
    pengumuman: (pengumuman.data ?? []) as Post[],
    galeri: (galeri.data ?? []) as GalleryItem[],
  }
})

const facts = computed(() => {
  const s = settings.value
  return [
    { icon: 'users', label: 'Jumlah Penduduk', value: s.population },
    { icon: 'home', label: 'Kepala Keluarga', value: s.households },
    { icon: 'mapPin', label: 'Jumlah Lingkungan', value: s.hamlets },
    { icon: 'compass', label: 'Luas Wilayah', value: s.areaKm2, suffix: ' km²' },
  ].filter((f) => f.value != null)
})

useHead(() => ({
  title: settings.value.villageName,
  meta: [{ name: 'description', content: settings.value.shortDescription }],
}))
</script>

<template>
  <div>
    <!-- ---------------- Hero ---------------- -->
    <section class="grain relative overflow-hidden bg-primary-deep text-white">
      <NuxtImg
        v-if="settings.heroImageUrl"
        :src="settings.heroImageUrl"
        alt=""
        class="absolute inset-0 h-full w-full object-cover opacity-25"
        sizes="100vw"
        preload
      />
      <div class="bg-mesh absolute inset-0" />
      <div class="pattern-flag absolute inset-0" />
      <div class="absolute -left-24 top-6 h-72 w-72 rounded-full bg-accent/30 blur-3xl animate-float-slow" />

      <div class="container-app relative pb-24 pt-24 sm:pb-28 sm:pt-32">
        <span class="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3.5 py-1.5 text-xs font-semibold tracking-wide backdrop-blur">
          <AppIcon name="mapPin" :size="14" />
          {{ [settings.district, settings.regency, settings.province].filter(Boolean).join(', ') || 'Sistem Informasi Kelurahan' }}
        </span>

        <h1 class="mt-6 max-w-3xl text-fluid-h1 font-extrabold tracking-tight text-white">
          {{ settings.villageName }}
        </h1>
        <p class="mt-4 max-w-xl text-lg leading-relaxed text-white/85">{{ settings.tagline }}</p>

        <div class="mt-8 flex flex-wrap gap-3">
          <UiButton to="/profil" size="lg" class="bg-white !text-primary hover:!bg-white/90">
            Profil Kelurahan
          </UiButton>
          <UiButton to="/berita" size="lg" variant="ghost" class="border border-white/40 !text-white hover:!bg-white/10">
            <template #icon><AppIcon name="news" :size="17" /></template>
            Berita Terbaru
          </UiButton>
        </div>
      </div>

      <WaveDivider class="relative -mb-px" color="text-canvas" />
    </section>

    <!-- ---------------- Quick facts ---------------- -->
    <div v-if="facts.length" v-reveal class="container-app relative z-10 -mt-14 sm:-mt-16">
      <div class="grid grid-cols-2 divide-line overflow-hidden rounded-theme border border-line/80 bg-surface shadow-card md:grid-cols-4 md:divide-x">
        <div v-for="f in facts" :key="f.label" class="flex items-center gap-3.5 p-5">
          <span class="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
            <AppIcon :name="f.icon" :size="21" />
          </span>
          <span>
            <span class="block font-heading text-2xl font-extrabold text-ink">
              {{ formatNumber(Number(f.value)) }}{{ f.suffix || '' }}
            </span>
            <span class="block text-xs font-medium text-ink-muted">{{ f.label }}</span>
          </span>
        </div>
      </div>
    </div>

    <!-- ---------------- Intro + Pengumuman ---------------- -->
    <section class="section container-app">
      <div class="grid gap-10 lg:grid-cols-[1.5fr_1fr]">
        <div v-reveal>
          <span class="eyebrow"><span class="h-px w-6 bg-primary" /> Selamat Datang</span>
          <h2 class="mt-4 text-fluid-h3 font-extrabold">
            Portal resmi warga {{ settings.villageName }}
          </h2>
          <p class="mt-4 max-w-2xl text-ink-muted">{{ settings.shortDescription }}</p>
          <UiButton to="/profil" variant="ghost" class="mt-5 !px-0 hover:!bg-transparent hover:!text-primary">
            Pelajari lebih lanjut
            <AppIcon name="arrowRight" :size="16" class="transition group-hover/btn:translate-x-1" />
          </UiButton>
        </div>

        <div v-reveal="1" class="accent-top rounded-theme border border-line/80 bg-surface p-6 shadow-card">
          <div class="flex items-center gap-2.5">
            <span class="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary">
              <AppIcon name="megaphone" :size="17" />
            </span>
            <h3 class="font-heading text-lg font-bold">Pengumuman</h3>
          </div>
          <ul v-if="data?.pengumuman.length" class="mt-4 divide-y divide-line">
            <li v-for="p in data.pengumuman" :key="p.id">
              <NuxtLink :to="`/pengumuman/${p.slug}`" class="group flex gap-3 py-3">
                <span class="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                <span class="min-w-0">
                  <span class="block text-sm font-medium text-ink transition group-hover:text-primary">{{ p.title }}</span>
                  <span class="mt-0.5 block text-xs text-ink-muted">{{ formatDate(p.published_at || p.created_at) }}</span>
                </span>
              </NuxtLink>
            </li>
          </ul>
          <p v-else class="mt-4 text-sm text-ink-muted">Belum ada pengumuman.</p>
          <NuxtLink to="/pengumuman" class="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:gap-1.5">
            Lihat semua <AppIcon name="arrowRight" :size="14" />
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- ---------------- Berita ---------------- -->
    <section class="section bg-surface-muted/50">
      <div class="container-app">
        <div v-reveal class="flex flex-wrap items-end justify-between gap-4">
          <div>
            <span class="eyebrow"><span class="h-px w-6 bg-primary" /> Informasi</span>
            <h2 class="mt-4 text-fluid-h3 font-extrabold">Berita Terkini</h2>
          </div>
          <NuxtLink to="/berita" class="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-4 py-2 text-sm font-semibold text-ink transition hover:border-primary/40 hover:text-primary">
            Semua berita <AppIcon name="arrowRight" :size="14" />
          </NuxtLink>
        </div>

        <div v-if="data?.berita.length" class="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <NuxtLink
            v-for="(b, i) in data.berita"
            :key="b.id"
            v-reveal="i"
            :to="`/berita/${b.slug}`"
            class="card card-hover group flex flex-col overflow-hidden"
          >
            <div class="relative aspect-[16/10] overflow-hidden bg-surface-muted">
              <NuxtImg
                v-if="b.cover_url"
                :src="b.cover_url"
                alt=""
                class="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                sizes="420px"
              />
              <div v-else class="grid h-full place-items-center text-ink-muted/30">
                <AppIcon name="image" :size="34" />
              </div>
              <span class="absolute left-3 top-3 rounded-md bg-primary px-2.5 py-1 text-[0.7rem] font-bold uppercase tracking-wide text-white shadow-sm">
                {{ formatDate(b.published_at || b.created_at) }}
              </span>
            </div>
            <div class="flex flex-1 flex-col p-5">
              <h3 class="font-heading text-lg font-bold leading-snug text-ink transition group-hover:text-primary">
                {{ b.title }}
              </h3>
              <p v-if="b.excerpt" class="mt-2 line-clamp-2 text-sm text-ink-muted">{{ b.excerpt }}</p>
              <span class="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary">
                Baca <AppIcon name="arrowRight" :size="14" class="transition group-hover:translate-x-1" />
              </span>
            </div>
          </NuxtLink>
        </div>
        <UiEmptyState v-else class="mt-10" title="Belum ada berita" message="Berita akan muncul di sini setelah dipublikasikan." />
      </div>
    </section>

    <!-- ---------------- Galeri ---------------- -->
    <section v-if="data?.galeri.length" class="section container-app">
      <div v-reveal class="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span class="eyebrow"><span class="h-px w-6 bg-primary" /> Dokumentasi</span>
          <h2 class="mt-4 text-fluid-h3 font-extrabold">Galeri Kegiatan</h2>
        </div>
        <NuxtLink to="/galeri" class="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-4 py-2 text-sm font-semibold text-ink transition hover:border-primary/40 hover:text-primary">
          Semua foto <AppIcon name="arrowRight" :size="14" />
        </NuxtLink>
      </div>
      <div class="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <NuxtLink
          v-for="(g, i) in data.galeri"
          :key="g.id"
          v-reveal="i"
          to="/galeri"
          class="group relative overflow-hidden rounded-xl bg-surface-muted"
          :class="i === 0 ? 'col-span-2 row-span-2 aspect-square sm:aspect-auto' : 'aspect-square'"
        >
          <NuxtImg :src="g.image_url" :alt="g.title || ''" class="h-full w-full object-cover transition duration-500 group-hover:scale-105" sizes="400px" />
          <div class="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 transition group-hover:opacity-100" />
        </NuxtLink>
      </div>
    </section>

    <!-- ---------------- CTA ---------------- -->
    <section class="pb-20 sm:pb-28">
      <div class="container-app">
        <div v-reveal class="grain relative overflow-hidden rounded-theme bg-primary px-6 py-14 text-center text-white sm:px-12">
          <div class="pattern-flag absolute inset-0 opacity-80" />
          <div class="absolute -right-10 -top-10 h-52 w-52 rounded-full bg-white/10 blur-2xl" />
          <div class="relative mx-auto max-w-xl">
            <h2 class="font-heading text-2xl font-extrabold text-white sm:text-3xl">Ada pertanyaan atau aspirasi?</h2>
            <p class="mt-3 text-white/85">
              Sampaikan langsung kepada pemerintah kelurahan melalui halaman kontak. Kami siap membantu.
            </p>
            <UiButton to="/kontak" size="lg" class="mt-7 bg-white !text-primary hover:!bg-white/90">
              Hubungi Kami
            </UiButton>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
