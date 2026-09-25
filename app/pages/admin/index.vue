<script setup lang="ts">
import type { Database } from '~/types/supabase'
import type { Message } from '~/types/database'
import { formatDate } from '~/utils/format'

definePageMeta({ layout: 'admin' })

const supabase = useSupabaseClient<Database>()

const { data } = await useAsyncData('admin-dashboard', async () => {
  const count = (q: PromiseLike<{ count: number | null }>) => q.then((r) => r.count ?? 0)
  const [berita, pengumuman, foto, pesanBaru, suratBaru, pengaduanBaru, pesan] = await Promise.all([
    count(supabase.from('posts').select('id', { count: 'exact', head: true }).eq('type', 'berita')),
    count(supabase.from('posts').select('id', { count: 'exact', head: true }).eq('type', 'pengumuman')),
    count(supabase.from('gallery').select('id', { count: 'exact', head: true })),
    count(supabase.from('messages').select('id', { count: 'exact', head: true }).eq('is_read', false)),
    count(supabase.from('letter_requests').select('id', { count: 'exact', head: true }).eq('status', 'diajukan')),
    count(supabase.from('complaints').select('id', { count: 'exact', head: true }).eq('status', 'diterima')),
    supabase.from('messages').select('*').order('created_at', { ascending: false }).limit(5),
  ])
  return {
    counts: { berita, pengumuman, foto, pesanBaru, suratBaru, pengaduanBaru },
    pesan: (pesan.data ?? []) as Message[],
  }
})

const cards = computed(() => {
  const c = data.value?.counts ?? { berita: 0, pengumuman: 0, foto: 0, pesanBaru: 0, suratBaru: 0, pengaduanBaru: 0 }
  return [
    { label: 'Berita', value: c.berita, icon: 'news', to: '/admin/berita' },
    { label: 'Pengumuman', value: c.pengumuman, icon: 'megaphone', to: '/admin/pengumuman' },
    { label: 'Foto Galeri', value: c.foto, icon: 'gallery', to: '/admin/galeri' },
    { label: 'Pesan Belum Dibaca', value: c.pesanBaru, icon: 'inbox', to: '/admin/pesan' },
    { label: 'Surat Diajukan', value: c.suratBaru, icon: 'fileText', to: '/admin/layanan-surat' },
    { label: 'Pengaduan Baru', value: c.pengaduanBaru, icon: 'shield', to: '/admin/pengaduan' },
  ]
})

useHead({ title: 'Dashboard' })
</script>

<template>
  <div>
    <AdminPageHeader title="Dashboard" description="Ringkasan konten dan pesan masuk." />

    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
        <p class="mt-3 font-heading text-2xl font-bold">{{ c.value }}</p>
        <p class="text-sm text-ink-muted">{{ c.label }}</p>
      </NuxtLink>
    </div>

    <div class="mt-6 rounded-theme border border-line bg-surface p-6">
      <div class="flex items-center justify-between">
        <h3 class="font-heading font-semibold">Pesan Terbaru</h3>
        <NuxtLink to="/admin/pesan" class="text-sm font-medium text-primary hover:underline">Lihat semua</NuxtLink>
      </div>
      <ul class="mt-4 divide-y divide-line">
        <li v-for="m in data?.pesan" :key="m.id" class="flex items-start gap-3 py-3 text-sm">
          <span class="mt-0.5 h-2 w-2 shrink-0 rounded-full" :class="m.is_read ? 'bg-line' : 'bg-primary'" />
          <div class="min-w-0 flex-1">
            <p class="font-medium text-ink">{{ m.name }} <span class="font-normal text-ink-muted">· {{ formatDate(m.created_at) }}</span></p>
            <p class="line-clamp-1 text-ink-muted">{{ m.message }}</p>
          </div>
        </li>
        <li v-if="!data?.pesan?.length" class="py-6 text-center text-sm text-ink-muted">Belum ada pesan.</li>
      </ul>
    </div>
  </div>
</template>
