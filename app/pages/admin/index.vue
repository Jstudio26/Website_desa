<script setup lang="ts">
import { apiFetch } from '~/composables/useApi'

definePageMeta({ layout: 'admin' })

interface Summary {
  counts: Record<string, number>
  visitors30: number
  activity: Array<{ id: string, action: string, entity: string, summary?: string, createdAt: string, user?: { name: string } | null }>
}

const { data, pending } = await useAsyncData('admin-dashboard', () => apiFetch<Summary>('/api/admin/dashboard'))

const cards = computed(() => {
  const c = data.value?.counts ?? {}
  return [
    { label: 'Berita', value: c.news, icon: 'news', to: '/admin/news' },
    { label: 'Pengumuman', value: c.announcements, icon: 'megaphone', to: '/admin/announcements' },
    { label: 'Agenda', value: c.events, icon: 'calendar', to: '/admin/events' },
    { label: 'UMKM', value: c.umkm, icon: 'store', to: '/admin/umkm' },
    { label: 'Wisata', value: c.tourism, icon: 'mountain', to: '/admin/tourism' },
    { label: 'Dokumen', value: c.documents, icon: 'fileText', to: '/admin/documents' },
    { label: 'Galeri', value: c.galleries, icon: 'gallery', to: '/admin/gallery' },
    { label: 'Media', value: c.media, icon: 'folder', to: '/admin/media' },
  ]
})

const fmt = (d: string) => new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(d))
useHead({ title: 'Dashboard' })
</script>

<template>
  <div>
    <AdminPageHeader title="Dashboard" description="Ringkasan aktivitas dan konten situs desa." />

    <div v-if="pending" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <UiSkeleton v-for="i in 8" :key="i" class="h-24" />
    </div>

    <div v-else class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <NuxtLink
        v-for="c in cards"
        :key="c.label"
        :to="c.to"
        class="group rounded-theme border border-line bg-surface p-5 transition hover:shadow-md"
      >
        <div class="flex items-start justify-between">
          <span class="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
            <AppIcon :name="c.icon" :size="19" />
          </span>
          <AppIcon name="arrowRight" :size="16" class="text-ink-muted opacity-0 transition group-hover:opacity-100" />
        </div>
        <p class="mt-3 font-heading text-2xl font-bold">{{ (c.value ?? 0).toLocaleString('id-ID') }}</p>
        <p class="text-sm text-ink-muted">{{ c.label }}</p>
      </NuxtLink>
    </div>

    <div class="mt-6 grid gap-6 lg:grid-cols-3">
      <div class="rounded-theme border border-line bg-gradient-to-br from-primary to-secondary p-6 text-white">
        <p class="text-sm text-white/70">Pengunjung 30 hari terakhir</p>
        <p class="mt-2 font-heading text-4xl font-bold">{{ (data?.visitors30 ?? 0).toLocaleString('id-ID') }}</p>
        <p class="mt-1 text-xs text-white/60">Berdasarkan sesi unik.</p>
      </div>

      <div class="rounded-theme border border-line bg-surface p-6 lg:col-span-2">
        <h3 class="font-heading font-semibold">Aktivitas Terbaru</h3>
        <ul class="mt-4 divide-y divide-line">
          <li v-for="a in data?.activity" :key="a.id" class="flex items-start gap-3 py-3 text-sm">
            <span class="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-surface-muted text-ink-muted">
              <AppIcon :name="a.action === 'delete' ? 'trash' : a.action === 'create' ? 'plus' : 'edit'" :size="13" />
            </span>
            <div class="min-w-0 flex-1">
              <p class="text-ink">{{ a.summary || `${a.action} ${a.entity}` }}</p>
              <p class="text-xs text-ink-muted">{{ a.user?.name || 'Sistem' }} · {{ fmt(a.createdAt) }}</p>
            </div>
          </li>
          <li v-if="!data?.activity?.length" class="py-6 text-center text-sm text-ink-muted">Belum ada aktivitas.</li>
        </ul>
      </div>
    </div>
  </div>
</template>
