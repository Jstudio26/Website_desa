<script setup lang="ts">
import type { Database } from '~/types/supabase'
import { COMPLAINT_CATEGORIES } from '~/config/layanan'

const supabase = useSupabaseClient<Database>()
const toast = useToast()
const { upload } = useMedia()

const form = reactive({ name: '', phone: '', category: COMPLAINT_CATEGORIES[0], location: '', description: '', photo_url: '' as string | null })
const errors = reactive<Record<string, string>>({})
const sending = ref(false)
const uploading = ref(false)
const sent = ref(false)

function validate() {
  errors.name = form.name.trim() ? '' : 'Nama wajib diisi.'
  errors.description = form.description.trim().length >= 10 ? '' : 'Uraian minimal 10 karakter.'
  return !errors.name && !errors.description
}

async function onPhoto(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  ;(e.target as HTMLInputElement).value = ''
  if (!file) return
  uploading.value = true
  try {
    form.photo_url = await upload(file, 'pengaduan')
  }
  catch (err) {
    toast.error('Gagal mengunggah foto', err instanceof Error ? err.message : '')
  }
  finally {
    uploading.value = false
  }
}

async function submit() {
  if (!validate()) return
  sending.value = true
  try {
    const { error } = await supabase.from('complaints').insert({
      name: form.name.trim(),
      phone: form.phone.trim() || null,
      category: form.category,
      location: form.location.trim() || null,
      description: form.description.trim(),
      photo_url: form.photo_url || null,
    })
    if (error) throw error
    sent.value = true
    toast.success('Pengaduan terkirim', 'Terima kasih, laporan Anda akan kami tindak lanjuti.')
    form.name = form.phone = form.location = form.description = ''
    form.category = COMPLAINT_CATEGORIES[0]
    form.photo_url = null
  }
  catch (e) {
    toast.error('Gagal mengirim', e instanceof Error ? e.message : 'Coba lagi beberapa saat.')
  }
  finally {
    sending.value = false
  }
}

useHead({ title: 'Pengaduan Masyarakat' })
</script>

<template>
  <div>
    <PageHero
      title="Pengaduan Masyarakat"
      subtitle="Laporkan keluhan atau masalah di lingkungan Anda kepada pemerintah kelurahan."
      :breadcrumb="[{ label: 'Pengaduan' }]"
    />

    <div class="section container-app">
      <div class="mx-auto max-w-2xl accent-top rounded-theme border border-line/80 bg-surface p-6 shadow-card sm:p-8">
        <h2 class="font-heading text-2xl font-extrabold">Formulir Pengaduan</h2>
        <p class="mt-1.5 text-sm text-ink-muted">Sertakan foto jika ada, agar penanganan lebih cepat dan akurat.</p>
        <form class="mt-6 space-y-4" @submit.prevent="submit">
          <div class="grid gap-4 sm:grid-cols-2">
            <UiInput v-model="form.name" label="Nama" required :error="errors.name" />
            <UiInput v-model="form.phone" label="Telepon / WA" placeholder="opsional" />
          </div>
          <UiSelect
            v-model="form.category"
            label="Kategori"
            required
            :options="COMPLAINT_CATEGORIES.map((c) => ({ label: c, value: c }))"
          />
          <UiInput v-model="form.location" label="Lokasi" placeholder="Alamat / lingkungan tempat kejadian" />
          <UiTextarea v-model="form.description" label="Uraian Pengaduan" required :rows="5" :error="errors.description" />

          <div>
            <span class="mb-1.5 block text-sm font-medium text-ink">Foto Pendukung</span>
            <div class="flex items-center gap-3">
              <img v-if="form.photo_url" :src="form.photo_url" alt="" class="h-16 w-16 rounded-theme border border-line object-cover">
              <label class="cursor-pointer rounded-theme border border-dashed border-line px-4 py-3 text-sm text-ink-muted hover:bg-surface-muted">
                {{ uploading ? 'Mengunggah…' : 'Pilih foto (opsional)' }}
                <input type="file" accept="image/*" class="hidden" :disabled="uploading" @change="onPhoto">
              </label>
              <button v-if="form.photo_url" type="button" class="text-sm text-red-500 hover:underline" @click="form.photo_url = null">Hapus</button>
            </div>
          </div>

          <UiButton type="submit" :loading="sending" block size="lg">Kirim Pengaduan</UiButton>
          <p v-if="sent" class="flex items-center gap-2 text-sm font-medium text-primary">
            <AppIcon name="check" :size="16" /> Pengaduan Anda sudah terkirim. Terima kasih!
          </p>
        </form>
      </div>
    </div>
  </div>
</template>
