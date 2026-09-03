<script setup lang="ts">
import { apiFetch, ApiClientError } from '~/composables/useApi'
import type { FeatureFlags, FooterConfig } from '~~/shared/types/config'
import { FEATURE_FLAGS } from '~~/shared/types/config'

definePageMeta({ layout: 'admin' })
const toast = useToast()
const { refresh: refreshConfig } = useSiteConfig()

const tab = ref<'features' | 'footer'>('features')

const { data: featData } = await useAsyncData('admin-features', () => apiFetch<FeatureFlags>('/api/admin/settings/features'))
const { data: footerData } = await useAsyncData('admin-footer', () => apiFetch<FooterConfig>('/api/admin/settings/footer'))

const features = ref<FeatureFlags | null>(null)
const footer = ref<FooterConfig | null>(null)
watch(featData, (v) => { if (v) features.value = { ...v } }, { immediate: true })
watch(footerData, (v) => { if (v) footer.value = structuredClone(toRaw(v)) }, { immediate: true })

const flagLabels: Record<string, string> = {
  enableNews: 'Berita', enableAnnouncements: 'Pengumuman', enableEvents: 'Agenda',
  enableUMKM: 'UMKM', enableTourism: 'Wisata', enableGallery: 'Galeri',
  enableTransparency: 'Transparansi', enableDigitalServices: 'Layanan Digital',
  enableStatistics: 'Statistik', enableGovernment: 'Pemerintahan',
  enableKKTDeveloperPage: 'Halaman Tim KKT / Pengembang',
}

const savingF = ref(false)
async function saveFeatures() {
  if (!features.value) return
  savingF.value = true
  try {
    await apiFetch('/api/admin/settings/features', { method: 'PUT', body: features.value })
    await refreshConfig()
    toast.success('Tersimpan', 'Modul yang dinonaktifkan langsung hilang dari menu & situs.')
  }
  catch (e) { toast.error('Gagal', e instanceof ApiClientError ? e.message : '') }
  finally { savingF.value = false }
}

const savingFo = ref(false)
async function saveFooter() {
  if (!footer.value) return
  savingFo.value = true
  try {
    await apiFetch('/api/admin/settings/footer', { method: 'PUT', body: footer.value })
    await refreshConfig()
    toast.success('Footer tersimpan')
  }
  catch (e) { toast.error('Gagal', e instanceof ApiClientError ? e.message : '') }
  finally { savingFo.value = false }
}
</script>

<template>
  <div>
    <AdminPageHeader title="Pengaturan" description="Modul aktif dan struktur footer situs." />

    <div class="mb-6 flex gap-1 border-b border-line">
      <button
        v-for="t in [['features', 'Modul / Fitur'], ['footer', 'Footer']]"
        :key="t[0]"
        class="border-b-2 px-4 py-2.5 text-sm font-medium transition"
        :class="tab === t[0] ? 'border-primary text-primary' : 'border-transparent text-ink-muted hover:text-ink'"
        @click="tab = t[0] as 'features' | 'footer'"
      >
        {{ t[1] }}
      </button>
    </div>

    <!-- FEATURES -->
    <div v-if="tab === 'features' && features" class="space-y-4">
      <UiCard>
        <p class="mb-4 text-sm text-ink-muted">
          Nonaktifkan modul yang belum digunakan. Menu, rute, dan section homepage terkait akan otomatis disembunyikan.
        </p>
        <div class="grid gap-4 sm:grid-cols-2">
          <div v-for="f in FEATURE_FLAGS" :key="f" class="rounded-theme border border-line p-3">
            <UiToggle v-model="features[f]" :label="flagLabels[f] || f" />
          </div>
        </div>
      </UiCard>
      <div class="flex justify-end">
        <UiButton :loading="savingF" @click="saveFeatures">Simpan Modul</UiButton>
      </div>
    </div>

    <!-- FOOTER -->
    <div v-else-if="tab === 'footer' && footer" class="space-y-6">
      <UiCard>
        <h3 class="mb-4 font-heading font-semibold">Umum</h3>
        <UiTextarea v-model="footer.description" label="Deskripsi Footer" rows="3" />
        <div class="mt-4">
          <UiInput v-model="footer.bottomText" label="Teks Copyright" hint="Gunakan {year} dan {village} sebagai placeholder" />
        </div>
      </UiCard>

      <UiCard>
        <h3 class="mb-4 font-heading font-semibold">Kredit KKT / Pengembang</h3>
        <div class="space-y-4">
          <UiToggle v-model="footer.showCredit" label="Tampilkan bagian kredit di footer" />
          <UiTextarea v-model="footer.creditText" label="Teks Kredit" rows="2" />
          <div class="grid gap-4 sm:grid-cols-2">
            <UiInput v-model="footer.programName" label="Nama Program" />
            <UiInput v-model="footer.developerLinkLabel" label="Label Tautan" />
            <UiInput v-model="footer.developerLinkUrl" label="URL Tautan" hint="mis. /about-developer" />
          </div>
          <UiToggle v-model="footer.showDeveloperLink" label="Tampilkan tombol 'Tentang Tim Pengembang'" />
        </div>
      </UiCard>

      <UiCard>
        <div class="mb-4 flex items-center justify-between">
          <h3 class="font-heading font-semibold">Kolom Footer</h3>
          <UiButton size="sm" variant="outline" @click="footer.columns.push({ title: 'Kolom Baru', links: [] })">
            <template #icon><AppIcon name="plus" :size="14" /></template> Kolom
          </UiButton>
        </div>
        <div class="space-y-4">
          <div v-for="(col, ci) in footer.columns" :key="ci" class="rounded-theme border border-line p-4">
            <div class="mb-3 flex items-center gap-2">
              <input v-model="col.title" class="flex-1 rounded-theme border border-line px-3 py-2 text-sm font-medium">
              <button class="text-ink-muted hover:text-red-500" @click="footer.columns.splice(ci, 1)"><AppIcon name="trash" :size="16" /></button>
            </div>
            <div v-for="(l, li) in col.links" :key="li" class="mb-2 flex gap-2">
              <input v-model="l.label" placeholder="Label" class="flex-1 rounded-theme border border-line px-3 py-1.5 text-sm">
              <input v-model="l.url" placeholder="/url" class="flex-1 rounded-theme border border-line px-3 py-1.5 text-sm">
              <button class="text-ink-muted hover:text-red-500" @click="col.links.splice(li, 1)"><AppIcon name="close" :size="15" /></button>
            </div>
            <button class="mt-1 text-xs font-medium text-primary" @click="col.links.push({ label: '', url: '' })">+ tautan</button>
          </div>
        </div>
      </UiCard>

      <div class="flex justify-end">
        <UiButton :loading="savingFo" @click="saveFooter">Simpan Footer</UiButton>
      </div>
    </div>
  </div>
</template>
