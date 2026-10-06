<script setup lang="ts">
const open = defineModel<boolean>('open', { default: false })
const route = useRoute()
const { settings } = useSettings()

const links = [
  { label: 'Dashboard', to: '/admin', icon: 'chart' },
  { label: 'Berita', to: '/admin/berita', icon: 'news' },
  { label: 'Pengumuman', to: '/admin/pengumuman', icon: 'megaphone' },
  { label: 'Galeri', to: '/admin/galeri', icon: 'gallery' },
  { label: 'Organisasi', to: '/admin/organisasi', icon: 'users' },
  { label: 'Peta Wilayah', to: '/admin/peta', icon: 'mapPin' },
  { label: 'Landmark & Fasilitas', to: '/admin/landmark', icon: 'compass' },
  { label: 'Potensi Kelurahan', to: '/admin/potensi', icon: 'leaf' },
  { label: 'Layanan Surat', to: '/admin/layanan-surat', icon: 'fileText' },
  { label: 'Pengaduan', to: '/admin/pengaduan', icon: 'shield' },
  { label: 'Profil Kelurahan', to: '/admin/profil', icon: 'home' },
  { label: 'Pesan Masuk', to: '/admin/pesan', icon: 'inbox' },
  { label: 'Posko KKT', to: '/admin/posko', icon: 'graduation' },
]

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
        {{ settings.villageName.charAt(0) }}
      </span>
      <div class="min-w-0">
        <p class="truncate text-sm font-semibold">{{ settings.villageName }}</p>
        <p class="text-[11px] text-ink-muted">Panel Admin</p>
      </div>
    </div>

    <nav class="flex-1 space-y-1 overflow-y-auto px-3 py-4">
      <NuxtLink
        v-for="l in links"
        :key="l.to"
        :to="l.to"
        class="flex items-center gap-3 rounded-theme px-3 py-2 text-sm transition"
        :class="isActive(l.to) ? 'bg-primary text-white' : 'text-ink-muted hover:bg-surface-muted hover:text-ink'"
      >
        <AppIcon :name="l.icon" :size="17" />
        {{ l.label }}
      </NuxtLink>
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
