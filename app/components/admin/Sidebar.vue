<script setup lang="ts">
import type { Permission } from '~~/shared/types/rbac'

const open = defineModel<boolean>('open', { default: false })
const route = useRoute()
const auth = useAuthStore()
const { village, isEnabled } = useSiteConfig()

interface Link { label: string, to: string, icon: string, perm?: Permission, flag?: string }
interface Group { title: string, links: Link[] }

const groups = computed<Group[]>(() => [
  { title: '', links: [{ label: 'Dashboard', to: '/admin', icon: 'chart' }] },
  {
    title: 'Konten',
    links: [
      { label: 'Halaman', to: '/admin/pages', icon: 'layout', perm: 'page.manage' },
      { label: 'Berita', to: '/admin/news', icon: 'news', perm: 'news.manage', flag: 'enableNews' },
      { label: 'Pengumuman', to: '/admin/announcements', icon: 'megaphone', perm: 'announcement.manage', flag: 'enableAnnouncements' },
      { label: 'Agenda', to: '/admin/events', icon: 'calendar', perm: 'event.manage', flag: 'enableEvents' },
    ],
  },
  {
    title: 'Desa',
    links: [
      { label: 'Profil Desa', to: '/admin/village', icon: 'home', perm: 'settings.manage' },
      { label: 'Pemerintahan', to: '/admin/government', icon: 'building', perm: 'government.manage', flag: 'enableGovernment' },
      { label: 'Statistik', to: '/admin/statistics', icon: 'chartPie', perm: 'statistics.manage', flag: 'enableStatistics' },
    ],
  },
  {
    title: 'Potensi',
    links: [
      { label: 'UMKM', to: '/admin/umkm', icon: 'store', perm: 'umkm.manage', flag: 'enableUMKM' },
      { label: 'Wisata', to: '/admin/tourism', icon: 'mountain', perm: 'tourism.manage', flag: 'enableTourism' },
    ],
  },
  {
    title: 'Media',
    links: [
      { label: 'Galeri', to: '/admin/gallery', icon: 'gallery', perm: 'gallery.manage', flag: 'enableGallery' },
      { label: 'Dokumen', to: '/admin/documents', icon: 'fileText', perm: 'document.manage', flag: 'enableTransparency' },
      { label: 'Pustaka Media', to: '/admin/media', icon: 'folder', perm: 'media.manage' },
    ],
  },
  {
    title: 'Layanan',
    links: [
      { label: 'Layanan Desa', to: '/admin/services', icon: 'fileText', perm: 'service.manage', flag: 'enableDigitalServices' },
      { label: 'Permohonan', to: '/admin/service-requests', icon: 'check', perm: 'service.process', flag: 'enableDigitalServices' },
    ],
  },
  {
    title: 'KKT',
    links: [
      { label: 'Informasi KKT', to: '/admin/kkt', icon: 'graduation', perm: 'kkt.manage', flag: 'enableKKTDeveloperPage' },
      { label: 'Anggota Tim', to: '/admin/kkt/team', icon: 'users', perm: 'kkt.manage', flag: 'enableKKTDeveloperPage' },
      { label: 'Bidang / Divisi', to: '/admin/kkt/fields', icon: 'layers', perm: 'kkt.manage', flag: 'enableKKTDeveloperPage' },
    ],
  },
  {
    title: 'Sistem',
    links: [
      { label: 'Navigasi', to: '/admin/menus', icon: 'menu', perm: 'menu.manage' },
      { label: 'Tema', to: '/admin/theme', icon: 'palette', perm: 'theme.manage' },
      { label: 'Pengaturan', to: '/admin/settings', icon: 'settings', perm: 'settings.manage' },
      { label: 'Pengguna', to: '/admin/users', icon: 'users', perm: 'user.manage' },
    ],
  },
])

const visibleGroups = computed(() =>
  groups.value
    .map((g) => ({
      ...g,
      links: g.links.filter(
        (l) =>
          (!l.perm || auth.can(l.perm))
          && (!l.flag || isEnabled(l.flag as never)),
      ),
    }))
    .filter((g) => g.links.length),
)

const isActive = (to: string) => (to === '/admin' ? route.path === '/admin' : route.path.startsWith(to))
</script>

<template>
  <Transition name="fade">
    <div v-if="open" class="fixed inset-0 z-30 bg-black/40 lg:hidden" @click="open = false" />
  </Transition>

  <aside
    class="fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-line bg-surface transition-transform lg:translate-x-0"
    :class="open ? 'translate-x-0' : '-translate-x-full'"
  >
    <div class="flex h-16 items-center gap-2.5 border-b border-line px-5">
      <span class="grid h-8 w-8 place-items-center rounded-md bg-primary text-sm font-bold text-white">
        {{ village.villageName.charAt(0) }}
      </span>
      <div class="min-w-0">
        <p class="truncate text-sm font-semibold">{{ village.villageName }}</p>
        <p class="text-[11px] text-ink-muted">Panel Admin</p>
      </div>
    </div>

    <nav class="flex-1 space-y-5 overflow-y-auto px-3 py-4">
      <div v-for="g in visibleGroups" :key="g.title">
        <p v-if="g.title" class="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-ink-muted/70">
          {{ g.title }}
        </p>
        <NuxtLink
          v-for="l in g.links"
          :key="l.to"
          :to="l.to"
          class="flex items-center gap-3 rounded-theme px-3 py-2 text-sm transition"
          :class="isActive(l.to) ? 'bg-primary text-white' : 'text-ink-muted hover:bg-surface-muted hover:text-ink'"
        >
          <AppIcon :name="l.icon" :size="17" />
          {{ l.label }}
        </NuxtLink>
      </div>
    </nav>

    <div class="border-t border-line p-3">
      <NuxtLink to="/" target="_blank" class="flex items-center gap-2 rounded-theme px-3 py-2 text-xs text-ink-muted hover:bg-surface-muted">
        <AppIcon name="external" :size="15" /> Lihat situs publik
      </NuxtLink>
    </div>
  </aside>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
