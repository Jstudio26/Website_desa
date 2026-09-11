<script setup lang="ts">
import type { Database } from '~/types/supabase'
import type { GalleryItem } from '~/types/database'

const supabase = useSupabaseClient<Database>()

const { data: items } = await useAsyncData('galeri', async () => {
  const { data } = await supabase
    .from('gallery')
    .select('*')
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: false })
  return (data ?? []) as GalleryItem[]
})

const active = ref<GalleryItem | null>(null)
const open = ref(false)
function show(item: GalleryItem) {
  active.value = item
  open.value = true
}

useHead({ title: 'Galeri' })
</script>

<template>
  <div>
    <PageHero title="Galeri" subtitle="Dokumentasi kegiatan dan potret desa." :breadcrumb="[{ label: 'Galeri' }]" />

    <section class="section container-app">
      <div v-if="items?.length" class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <button
          v-for="g in items"
          :key="g.id"
          class="group relative aspect-square overflow-hidden rounded-xl bg-surface-muted shadow-card ring-1 ring-line/60 transition hover:ring-primary/40"
          @click="show(g)"
        >
          <NuxtImg
            :src="g.image_url"
            :alt="g.title || ''"
            class="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            sizes="400px"
          />
          <span class="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-transparent opacity-0 transition group-hover:opacity-100" />
          <span
            v-if="g.title"
            class="absolute inset-x-0 bottom-0 translate-y-1 p-3 text-left text-xs font-semibold text-white opacity-0 transition group-hover:translate-y-0 group-hover:opacity-100"
          >
            {{ g.title }}
          </span>
          <span class="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-white/90 text-ink opacity-0 shadow transition group-hover:opacity-100">
            <AppIcon name="eye" :size="15" />
          </span>
        </button>
      </div>

      <UiEmptyState v-else icon="gallery" title="Belum ada foto" message="Foto kegiatan akan ditampilkan di sini." />
    </section>

    <UiModal v-model:open="open" size="xl" :title="active?.title || 'Foto'">
      <img v-if="active" :src="active.image_url" :alt="active.title || ''" class="mx-auto max-h-[70vh] w-auto rounded-theme">
      <p v-if="active?.caption" class="mt-3 text-center text-sm text-ink-muted">{{ active.caption }}</p>
    </UiModal>
  </div>
</template>
