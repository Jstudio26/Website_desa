<script setup lang="ts">
import { apiFetch, ApiClientError } from '~/composables/useApi'
import type { VillageConfig } from '~~/shared/types/config'

definePageMeta({ layout: 'admin' })
const toast = useToast()
const { refresh: refreshConfig } = useSiteConfig()

const { data, pending } = await useAsyncData('admin-village', () => apiFetch<VillageConfig>('/api/admin/settings/village'))
const form = ref<VillageConfig | null>(null)
watch(data, (v) => { if (v) form.value = structuredClone(toRaw(v)) }, { immediate: true })

const saving = ref(false)
const errors = ref<Record<string, string[]>>({})

async function save() {
  if (!form.value) return
  saving.value = true
  errors.value = {}
  try {
    await apiFetch('/api/admin/settings/village', { method: 'PUT', body: form.value })
    await refreshConfig()
    toast.success('Tersimpan', 'Profil & identitas desa diperbarui.')
  }
  catch (e) {
    if (e instanceof ApiClientError) {
      errors.value = e.fields ?? {}
      toast.error('Gagal menyimpan', e.message)
    }
  }
  finally {
    saving.value = false
  }
}

function addEmergency() {
  form.value?.contact.emergencyContacts.push({ label: '', number: '' })
}
</script>

<template>
  <div>
    <AdminPageHeader title="Profil & Identitas Desa" description="Nama desa, wilayah, kontak, dan media sosial. Perubahan langsung tampil di situs.">
      <template #actions>
        <UiButton :loading="saving" @click="save">Simpan Perubahan</UiButton>
      </template>
    </AdminPageHeader>

    <div v-if="pending || !form" class="space-y-4">
      <UiSkeleton v-for="i in 6" :key="i" class="h-12" />
    </div>

    <div v-else class="space-y-6">
      <UiCard>
        <h3 class="mb-4 font-heading font-semibold">Identitas</h3>
        <div class="grid gap-4 sm:grid-cols-2">
          <UiInput v-model="form.villageName" label="Nama Desa" required :error="errors.villageName" />
          <UiInput v-model="form.district" label="Kecamatan" :error="errors.district" />
          <UiInput v-model="form.regency" label="Kabupaten/Kota" :error="errors.regency" />
          <UiInput v-model="form.province" label="Provinsi" :error="errors.province" />
          <UiInput v-model="form.postalCode" label="Kode Pos" :error="errors.postalCode" />
          <UiInput v-model="form.tagline" label="Tagline" hint="Muncul di hero & footer" />
        </div>
        <div class="mt-4">
          <UiTextarea v-model="form.shortDescription" label="Deskripsi Singkat" rows="3" hint="Dipakai untuk meta description SEO" />
        </div>
        <div class="mt-4 grid gap-4 sm:grid-cols-3">
          <UiInput v-model="form.logo" label="URL Logo" hint="Unggah via Pustaka Media" />
          <UiInput v-model="form.logoDark" label="URL Logo (mode gelap)" />
          <UiInput v-model="form.favicon" label="URL Favicon" />
        </div>
      </UiCard>

      <UiCard>
        <h3 class="mb-4 font-heading font-semibold">Data Wilayah</h3>
        <div class="grid gap-4 sm:grid-cols-3">
          <UiInput v-model.number="form.population" label="Jumlah Penduduk" type="number" />
          <UiInput v-model.number="form.households" label="Jumlah KK" type="number" />
          <UiInput v-model.number="form.hamlets" label="Jumlah Dusun" type="number" />
          <UiInput v-model.number="form.areaKm2" label="Luas Wilayah (km²)" type="number" />
          <UiInput v-model.number="form.latitude" label="Latitude" type="number" />
          <UiInput v-model.number="form.longitude" label="Longitude" type="number" />
        </div>
      </UiCard>

      <UiCard>
        <h3 class="mb-4 font-heading font-semibold">Kontak</h3>
        <div class="grid gap-4 sm:grid-cols-2">
          <UiInput v-model="form.contact.address" label="Alamat Kantor Desa" />
          <UiInput v-model="form.contact.phone" label="Telepon" />
          <UiInput v-model="form.contact.email" label="Email" type="email" />
          <UiInput v-model="form.contact.whatsapp" label="WhatsApp" />
          <UiInput v-model="form.contact.mapEmbedUrl" label="URL Embed Peta (Google Maps)" class="sm:col-span-2" />
        </div>

        <div class="mt-5">
          <div class="mb-2 flex items-center justify-between">
            <p class="text-sm font-medium">Kontak Darurat</p>
            <UiButton size="sm" variant="outline" @click="addEmergency">
              <template #icon><AppIcon name="plus" :size="14" /></template> Tambah
            </UiButton>
          </div>
          <div v-for="(e, i) in form.contact.emergencyContacts" :key="i" class="mb-2 flex gap-2">
            <input v-model="e.label" placeholder="Label (mis. Puskesmas)" class="flex-1 rounded-theme border border-line px-3 py-2 text-sm">
            <input v-model="e.number" placeholder="Nomor" class="w-40 rounded-theme border border-line px-3 py-2 text-sm">
            <button class="grid w-9 place-items-center rounded-theme border border-line text-ink-muted hover:text-red-500" @click="form.contact.emergencyContacts.splice(i, 1)">
              <AppIcon name="trash" :size="15" />
            </button>
          </div>
        </div>
      </UiCard>

      <UiCard>
        <h3 class="mb-4 font-heading font-semibold">Media Sosial</h3>
        <div class="grid gap-4 sm:grid-cols-2">
          <UiInput v-model="form.socialMedia.instagram" label="Instagram" />
          <UiInput v-model="form.socialMedia.facebook" label="Facebook" />
          <UiInput v-model="form.socialMedia.youtube" label="YouTube" />
          <UiInput v-model="form.socialMedia.tiktok" label="TikTok" />
        </div>
      </UiCard>

      <div class="flex justify-end">
        <UiButton :loading="saving" size="lg" @click="save">Simpan Perubahan</UiButton>
      </div>
    </div>
  </div>
</template>
