<script setup lang="ts">
import { apiFetch, ApiClientError } from '~/composables/useApi'

definePageMeta({ layout: 'admin' })
const toast = useToast()

interface KktSettings {
  programName: string, universityName: string, facultyName: string, year: string, period: string
  postName: string, location: string, villageName: string, description: string
  universityLogo: string | null, kktLogo: string | null, heroImage: string | null, footerCredit: string
}

const { data, pending } = await useAsyncData('admin-kkt', () => apiFetch<KktSettings>('/api/admin/kkt/settings'))
const form = ref<KktSettings | null>(null)
watch(data, (v) => { if (v) form.value = { ...v } }, { immediate: true })

const saving = ref(false)
async function save() {
  if (!form.value) return
  saving.value = true
  try {
    await apiFetch('/api/admin/kkt/settings', { method: 'PUT', body: form.value })
    toast.success('Informasi KKT tersimpan')
  }
  catch (e) { toast.error('Gagal', e instanceof ApiClientError ? e.message : '') }
  finally { saving.value = false }
}
useHead({ title: 'Informasi KKT' })
</script>

<template>
  <div>
    <AdminPageHeader title="Informasi KKT" description="Data umum program KKT yang tampil di halaman Tim Pengembang.">
      <template #actions><UiButton :loading="saving" @click="save">Simpan</UiButton></template>
    </AdminPageHeader>

    <div v-if="pending || !form" class="space-y-3"><UiSkeleton v-for="i in 6" :key="i" class="h-12" /></div>

    <div v-else class="space-y-6">
      <UiCard>
        <h3 class="mb-4 font-heading font-semibold">Program</h3>
        <div class="grid gap-4 sm:grid-cols-2">
          <UiInput v-model="form.programName" label="Nama Program" />
          <UiInput v-model="form.year" label="Tahun" />
          <UiInput v-model="form.universityName" label="Universitas" />
          <UiInput v-model="form.facultyName" label="Fakultas" />
          <UiInput v-model="form.period" label="Periode" />
          <UiInput v-model="form.postName" label="Nama Posko" />
          <UiInput v-model="form.location" label="Lokasi Posko" />
          <UiInput v-model="form.villageName" label="Nama Desa" />
        </div>
        <div class="mt-4">
          <UiTextarea v-model="form.description" label="Deskripsi Program" rows="3" />
        </div>
      </UiCard>

      <UiCard>
        <h3 class="mb-4 font-heading font-semibold">Aset & Kredit</h3>
        <div class="grid gap-4 sm:grid-cols-3">
          <UiInput v-model="form.universityLogo" label="URL Logo Universitas" />
          <UiInput v-model="form.kktLogo" label="URL Logo KKT" />
          <UiInput v-model="form.heroImage" label="URL Gambar Hero" />
        </div>
        <div class="mt-4">
          <UiTextarea v-model="form.footerCredit" label="Teks Kredit Footer" rows="2" />
        </div>
      </UiCard>
    </div>
  </div>
</template>
