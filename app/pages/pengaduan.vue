<script setup lang="ts">
import type { Database } from '~/types/supabase'
import { COMPLAINT_CATEGORIES } from '~/config/layanan'

const supabase = useSupabaseClient<Database>()
const toast = useToast()
const { upload } = useMedia()

const form = reactive({ name: '', phone: '', category: COMPLAINT_CATEGORIES[0] as string, location: '', description: '', photo_url: '' as string | null })
const errors = reactive<Record<string, string>>({})
const sending = ref(false)
const uploading = ref(false)
const ticket = ref<string | null>(null)
const formEl = ref<HTMLElement | null>(null)

function validate() {
  const digits = form.phone.replace(/D/g, '')
  errors.name = form.name.trim().length >= 2 ? '' : 'Nama wajib diisi.'
  errors.phone = !digits || (digits.length >= 9 && digits.length <= 15) ? '' : 'Nomor telepon/WA tidak valid.'
  errors.description = form.description.trim().length >= 10 ? '' : 'Uraian minimal 10 karakter.'
  return !errors.name && !errors.phone && !errors.description
}

async function onPhoto(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  ;(e.target as HTMLInputElement).value = ''
  if (!file) return
  uploading.value = true
  try {
    // Foto HP bisa >5 MB; perkecil dulu (1600px cukup untuk bukti lapangan).
    form.photo_url = await upload(file, 'pengaduan', { maxSize: 1600 })
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
    const { data, error } = await supabase.rpc('kirim_pengaduan', {
      p_name: form.name.trim(),
      p_category: form.category,
      p_description: form.description.trim(),
      p_phone: form.phone.trim() || null,
      p_location: form.location.trim() || null,
      p_photo_url: form.photo_url || null,
    })
    if (error) throw error
    ticket.value = data
    form.name = form.phone = form.location = form.description = ''
    form.category = COMPLAINT_CATEGORIES[0] as string
    form.photo_url = null
    formEl.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
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
      <div ref="formEl" v-reveal class="mx-auto max-w-2xl scroll-mt-28 accent-top rounded-theme border border-line/80 bg-surface p-6 shadow-card sm:p-8">
        <TicketSuccess
          v-if="ticket"
          :code="ticket"
          title="Pengaduan terkirim"
          message="Terima kasih. Tanggapan petugas bisa Anda lihat lewat Cek Status dengan kode di bawah."
          @again="ticket = null"
        />
        <template v-else>
        <h2 class="font-heading text-2xl font-extrabold">Formulir Pengaduan</h2>
        <p class="mt-1.5 text-sm text-ink-muted">
          Sertakan foto jika ada, agar penanganan lebih cepat dan akurat. Sudah pernah melapor?
          <NuxtLink to="/cek-status" class="font-semibold text-primary hover:underline">Cek status pengaduan</NuxtLink>
        </p>
        <form class="mt-6 space-y-4" novalidate @submit.prevent="submit">
          <div class="grid gap-4 sm:grid-cols-2">
            <UiInput v-model="form.name" label="Nama" required autocomplete="name" :error="errors.name" />
            <UiInput
              v-model="form.phone"
              label="Telepon / WA"
              type="tel"
              inputmode="tel"
              autocomplete="tel"
              placeholder="Opsional"
              hint="Agar petugas bisa menghubungi bila perlu."
              :error="errors.phone"
            />
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

          <p class="flex gap-2 rounded-theme bg-surface-muted px-3 py-2.5 text-xs text-ink-muted">
            <AppIcon name="shield" :size="15" class="mt-0.5 shrink-0 text-primary" />
            <span>Nama dan nomor Anda hanya dapat dilihat petugas kelurahan dan tidak ditampilkan ke publik.</span>
          </p>
          <UiButton type="submit" :loading="sending" :disabled="uploading" block size="lg">Kirim Pengaduan</UiButton>
        </form>
        </template>
      </div>
    </div>
  </div>
</template>
