<script setup lang="ts">
import type { Database } from '~/types/supabase'
import type { Official, SettingsData } from '~/types/database'
import { DEFAULT_SETTINGS } from '~/composables/useSettings'

definePageMeta({ layout: 'admin' })

const supabase = useSupabaseClient<Database>()
const toast = useToast()
const { upload, remove: removeMedia } = useMedia()
const { refresh: refreshSettings } = useSettings()

// ---- Settings form -------------------------------------------------------
const form = reactive<SettingsData>({ ...DEFAULT_SETTINGS, social: { ...DEFAULT_SETTINGS.social } })
const missionText = ref('')
const loading = ref(true)
const saving = ref(false)

const { data: loaded } = await useAsyncData('admin-settings', async () => {
  const { data } = await supabase.from('settings').select('data').eq('id', 1).maybeSingle()
  return (data?.data as Partial<SettingsData>) ?? {}
})
Object.assign(form, DEFAULT_SETTINGS, loaded.value, {
  social: { ...DEFAULT_SETTINGS.social, ...(loaded.value?.social ?? {}) },
})
missionText.value = (form.mission ?? []).join('\n')
loading.value = false

async function uploadTo(key: 'logoUrl' | 'heroImageUrl', e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  ;(e.target as HTMLInputElement).value = ''
  if (!file) return
  try {
    const old = form[key]
    form[key] = await upload(file, 'profil')
    if (old) removeMedia(old)
  }
  catch (err) {
    toast.error('Gagal mengunggah', err instanceof Error ? err.message : '')
  }
}

async function saveSettings() {
  saving.value = true
  try {
    const payload: SettingsData = {
      ...form,
      mission: missionText.value.split('\n').map((s) => s.trim()).filter(Boolean),
      population: numOrNull(form.population),
      households: numOrNull(form.households),
      hamlets: numOrNull(form.hamlets),
      areaKm2: numOrNull(form.areaKm2),
    }
    const { error } = await supabase
      .from('settings')
      .update({ data: payload, updated_at: new Date().toISOString() })
      .eq('id', 1)
    if (error) throw error
    await refreshSettings()
    toast.success('Profil desa disimpan')
  }
  catch (e) {
    toast.error('Gagal menyimpan', e instanceof Error ? e.message : '')
  }
  finally {
    saving.value = false
  }
}
function numOrNull(v: unknown) {
  const n = Number(v)
  return v === '' || v == null || Number.isNaN(n) ? null : n
}

// ---- Officials ---------------------------------------------------------
const { data: officials, refresh: refreshOfficials } = await useAsyncData('admin-officials', async () => {
  const { data } = await supabase.from('officials').select('*').order('display_order').order('created_at')
  return (data ?? []) as Official[]
})

const modalOpen = ref(false)
const editing = ref<Official | null>(null)
const oForm = reactive({ name: '', position: '', photo_url: '' as string | null, display_order: 0 })

function newOfficial() {
  editing.value = null
  Object.assign(oForm, { name: '', position: '', photo_url: null, display_order: (officials.value?.length ?? 0) })
  modalOpen.value = true
}
function editOfficial(o: Official) {
  editing.value = o
  Object.assign(oForm, { name: o.name, position: o.position, photo_url: o.photo_url, display_order: o.display_order })
  modalOpen.value = true
}
async function onOfficialPhoto(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  ;(e.target as HTMLInputElement).value = ''
  if (!file) return
  try {
    oForm.photo_url = await upload(file, 'perangkat')
  }
  catch (err) {
    toast.error('Gagal mengunggah', err instanceof Error ? err.message : '')
  }
}
async function saveOfficial() {
  if (!oForm.name.trim() || !oForm.position.trim()) {
    toast.error('Nama dan jabatan wajib diisi')
    return
  }
  const row = {
    name: oForm.name.trim(),
    position: oForm.position.trim(),
    photo_url: oForm.photo_url || null,
    display_order: Number(oForm.display_order) || 0,
  }
  const { error } = editing.value
    ? await supabase.from('officials').update(row).eq('id', editing.value.id)
    : await supabase.from('officials').insert(row)
  if (error) { toast.error('Gagal menyimpan', error.message); return }
  toast.success('Tersimpan')
  modalOpen.value = false
  refreshOfficials()
}

const confirmId = ref<string | null>(null)
async function removeOfficial() {
  const o = officials.value?.find((x) => x.id === confirmId.value)
  if (!o) return
  const { error } = await supabase.from('officials').delete().eq('id', o.id)
  if (error) { toast.error('Gagal menghapus', error.message); confirmId.value = null; return }
  if (o.photo_url) removeMedia(o.photo_url)
  toast.success('Dihapus')
  confirmId.value = null
  refreshOfficials()
}

useHead({ title: 'Profil Desa' })
</script>

<template>
  <div>
    <AdminPageHeader title="Profil Desa" description="Identitas, kontak, dan data desa.">
      <template #actions>
        <UiButton :loading="saving" @click="saveSettings">Simpan Profil</UiButton>
      </template>
    </AdminPageHeader>

    <div v-if="loading" class="space-y-4">
      <UiSkeleton class="h-40" /><UiSkeleton class="h-40" />
    </div>

    <div v-else class="space-y-6">
      <!-- Identitas -->
      <section class="rounded-theme border border-line bg-surface p-5 sm:p-6">
        <h2 class="font-heading text-lg font-semibold">Identitas</h2>
        <div class="mt-4 grid gap-4 sm:grid-cols-2">
          <UiInput v-model="form.villageName" label="Nama Desa" required />
          <UiInput v-model="form.tagline" label="Tagline" />
          <div class="sm:col-span-2">
            <UiTextarea v-model="form.shortDescription" label="Deskripsi singkat" :rows="2" />
          </div>
          <UiInput v-model="form.district" label="Kecamatan" />
          <UiInput v-model="form.regency" label="Kabupaten" />
          <UiInput v-model="form.province" label="Provinsi" />
          <UiInput v-model="form.address" label="Alamat kantor desa" />
        </div>

        <div class="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <span class="mb-1.5 block text-sm font-medium text-ink">Logo</span>
            <div class="flex items-center gap-3">
              <img v-if="form.logoUrl" :src="form.logoUrl" alt="" class="h-16 w-16 rounded-theme border border-line object-contain">
              <label class="cursor-pointer rounded-theme border border-dashed border-line px-4 py-3 text-sm text-ink-muted hover:bg-surface-muted">
                Pilih file
                <input type="file" accept="image/*" class="hidden" @change="(e) => uploadTo('logoUrl', e)">
              </label>
              <button v-if="form.logoUrl" class="text-sm text-red-500 hover:underline" @click="form.logoUrl = ''">Hapus</button>
            </div>
          </div>
          <div>
            <span class="mb-1.5 block text-sm font-medium text-ink">Gambar hero (beranda)</span>
            <div class="flex items-center gap-3">
              <img v-if="form.heroImageUrl" :src="form.heroImageUrl" alt="" class="h-16 w-28 rounded-theme border border-line object-cover">
              <label class="cursor-pointer rounded-theme border border-dashed border-line px-4 py-3 text-sm text-ink-muted hover:bg-surface-muted">
                Pilih file
                <input type="file" accept="image/*" class="hidden" @change="(e) => uploadTo('heroImageUrl', e)">
              </label>
              <button v-if="form.heroImageUrl" class="text-sm text-red-500 hover:underline" @click="form.heroImageUrl = ''">Hapus</button>
            </div>
          </div>
        </div>
      </section>

      <!-- Kontak & sosial -->
      <section class="rounded-theme border border-line bg-surface p-5 sm:p-6">
        <h2 class="font-heading text-lg font-semibold">Kontak & Media Sosial</h2>
        <div class="mt-4 grid gap-4 sm:grid-cols-2">
          <UiInput v-model="form.phone" label="Telepon" />
          <UiInput v-model="form.email" label="Email" type="email" />
          <UiInput v-model="form.whatsapp" label="WhatsApp" hint="Nomor, mis. 6281234567890" />
          <UiInput v-model="form.mapEmbedUrl" label="URL Embed Peta (Google Maps)" hint="Bagikan → Sematkan peta → salin src iframe." />
          <UiInput v-model="form.social.instagram" label="Instagram (URL)" />
          <UiInput v-model="form.social.facebook" label="Facebook (URL)" />
          <UiInput v-model="form.social.youtube" label="YouTube (URL)" />
          <UiInput v-model="form.social.tiktok" label="TikTok (URL)" />
        </div>
      </section>

      <!-- Data desa -->
      <section class="rounded-theme border border-line bg-surface p-5 sm:p-6">
        <h2 class="font-heading text-lg font-semibold">Data Desa</h2>
        <div class="mt-4 grid gap-4 sm:grid-cols-4">
          <UiInput v-model="form.population" label="Jumlah penduduk" type="number" />
          <UiInput v-model="form.households" label="Kepala keluarga" type="number" />
          <UiInput v-model="form.hamlets" label="Jumlah dusun" type="number" />
          <UiInput v-model="form.areaKm2" label="Luas wilayah (km²)" type="number" />
        </div>
      </section>

      <!-- Visi misi -->
      <section class="rounded-theme border border-line bg-surface p-5 sm:p-6">
        <h2 class="font-heading text-lg font-semibold">Visi & Misi</h2>
        <div class="mt-4 space-y-4">
          <UiTextarea v-model="form.vision" label="Visi" :rows="2" />
          <UiTextarea v-model="missionText" label="Misi" :rows="4" hint="Satu poin misi per baris." />
        </div>
      </section>

      <!-- Sejarah -->
      <section class="rounded-theme border border-line bg-surface p-5 sm:p-6">
        <h2 class="font-heading text-lg font-semibold">Sejarah Desa</h2>
        <div class="mt-4">
          <RichTextEditor v-model="form.history" folder="profil" />
        </div>
      </section>

      <!-- Perangkat desa -->
      <section class="rounded-theme border border-line bg-surface p-5 sm:p-6">
        <div class="flex items-center justify-between">
          <h2 class="font-heading text-lg font-semibold">Perangkat Desa</h2>
          <UiButton size="sm" variant="outline" @click="newOfficial">
            <template #icon><AppIcon name="plus" :size="14" /></template> Tambah
          </UiButton>
        </div>

        <div v-if="officials && officials.length" class="mt-4 divide-y divide-line">
          <div v-for="o in officials" :key="o.id" class="flex items-center gap-3 py-3">
            <div class="h-11 w-11 shrink-0 overflow-hidden rounded-full bg-surface-muted">
              <img v-if="o.photo_url" :src="o.photo_url" alt="" class="h-full w-full object-cover">
              <span v-else class="grid h-full place-items-center text-ink-muted/50"><AppIcon name="user" :size="18" /></span>
            </div>
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-medium text-ink">{{ o.name }}</p>
              <p class="truncate text-xs text-ink-muted">{{ o.position }}</p>
            </div>
            <button class="p-1.5 text-ink-muted hover:text-primary" @click="editOfficial(o)"><AppIcon name="edit" :size="15" /></button>
            <button class="p-1.5 text-ink-muted hover:text-red-500" @click="confirmId = o.id"><AppIcon name="trash" :size="15" /></button>
          </div>
        </div>
        <p v-else class="mt-4 text-sm text-ink-muted">Belum ada data perangkat desa.</p>
      </section>
    </div>

    <UiModal v-model:open="modalOpen" :title="editing ? 'Ubah Perangkat' : 'Tambah Perangkat'" size="md">
      <div class="space-y-4">
        <div class="flex items-center gap-3">
          <div class="h-16 w-16 shrink-0 overflow-hidden rounded-full bg-surface-muted">
            <img v-if="oForm.photo_url" :src="oForm.photo_url" alt="" class="h-full w-full object-cover">
            <span v-else class="grid h-full place-items-center text-ink-muted/50"><AppIcon name="user" :size="22" /></span>
          </div>
          <label class="cursor-pointer rounded-theme border border-dashed border-line px-4 py-2 text-sm text-ink-muted hover:bg-surface-muted">
            Foto
            <input type="file" accept="image/*" class="hidden" @change="onOfficialPhoto">
          </label>
        </div>
        <UiInput v-model="oForm.name" label="Nama" required />
        <UiInput v-model="oForm.position" label="Jabatan" required />
        <UiInput v-model="oForm.display_order" label="Urutan" type="number" />
      </div>
      <template #footer>
        <div class="flex justify-end gap-2">
          <UiButton variant="ghost" size="sm" @click="modalOpen = false">Batal</UiButton>
          <UiButton size="sm" @click="saveOfficial">Simpan</UiButton>
        </div>
      </template>
    </UiModal>

    <UiConfirmDialog
      :open="!!confirmId"
      danger
      title="Hapus perangkat"
      message="Data akan dihapus permanen."
      confirm-label="Hapus"
      @update:open="confirmId = null"
      @confirm="removeOfficial"
    />
  </div>
</template>
