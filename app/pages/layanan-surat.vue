<script setup lang="ts">
import type { Database } from '~/types/supabase'
import { LETTER_TYPES } from '~/config/layanan'

const supabase = useSupabaseClient<Database>()
const { settings } = useSettings()
const toast = useToast()

const form = reactive({ type: LETTER_TYPES[0], name: '', nik: '', phone: '', address: '', purpose: '' })
const errors = reactive<Record<string, string>>({})
const sending = ref(false)
const sent = ref(false)

function validate() {
  errors.name = form.name.trim() ? '' : 'Nama wajib diisi.'
  errors.nik = /^\d{16}$/.test(form.nik.trim()) ? '' : 'NIK harus 16 digit angka.'
  errors.phone = form.phone.trim() ? '' : 'Nomor telepon/WA wajib diisi.'
  return !errors.name && !errors.nik && !errors.phone
}

async function submit() {
  if (!validate()) return
  sending.value = true
  try {
    const { error } = await supabase.from('letter_requests').insert({
      type: form.type,
      name: form.name.trim(),
      nik: form.nik.trim(),
      phone: form.phone.trim(),
      address: form.address.trim() || null,
      purpose: form.purpose.trim() || null,
    })
    if (error) throw error
    sent.value = true
    toast.success('Permohonan terkirim', 'Kami akan menghubungi Anda melalui telepon/WA.')
    form.name = form.nik = form.phone = form.address = form.purpose = ''
    form.type = LETTER_TYPES[0]
  }
  catch (e) {
    toast.error('Gagal mengirim', e instanceof Error ? e.message : 'Coba lagi beberapa saat.')
  }
  finally {
    sending.value = false
  }
}

useHead({ title: 'Layanan Surat Online' })
</script>

<template>
  <div>
    <PageHero
      title="Layanan Surat Online"
      subtitle="Ajukan permohonan surat keterangan tanpa perlu datang ke kantor kelurahan."
      :breadcrumb="[{ label: 'Layanan Surat' }]"
    />

    <div class="section container-app grid gap-10 lg:grid-cols-2">
      <div>
        <span class="eyebrow"><span class="h-px w-6 bg-primary" /> Informasi</span>
        <h2 class="mt-4 font-heading text-2xl font-extrabold">Jenis Surat yang Tersedia</h2>
        <ul class="mt-6 space-y-3">
          <li v-for="t in LETTER_TYPES.slice(0, -1)" :key="t" class="flex items-start gap-3 rounded-theme border border-line/80 bg-surface p-4 shadow-card">
            <span class="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
              <AppIcon name="fileText" :size="16" />
            </span>
            <p class="pt-1 text-sm font-medium text-ink">{{ t }}</p>
          </li>
        </ul>
        <p class="mt-6 rounded-theme border border-dashed border-line bg-surface-muted/50 p-4 text-sm text-ink-muted">
          Setelah mengajukan, petugas {{ settings.villageName }} akan menghubungi Anda melalui nomor telepon/WA yang
          didaftarkan untuk proses lebih lanjut atau pengambilan surat.
        </p>
      </div>

      <div class="accent-top rounded-theme border border-line/80 bg-surface p-6 shadow-card sm:p-8">
        <h2 class="font-heading text-2xl font-extrabold">Formulir Permohonan</h2>
        <p class="mt-1.5 text-sm text-ink-muted">Isi data di bawah ini dengan benar.</p>
        <form class="mt-6 space-y-4" @submit.prevent="submit">
          <UiSelect
            v-model="form.type"
            label="Jenis Surat"
            required
            :options="LETTER_TYPES.map((t) => ({ label: t, value: t }))"
          />
          <UiInput v-model="form.name" label="Nama Lengkap" required :error="errors.name" />
          <div class="grid gap-4 sm:grid-cols-2">
            <UiInput v-model="form.nik" label="NIK (KTP)" required :error="errors.nik" placeholder="16 digit" />
            <UiInput v-model="form.phone" label="Telepon / WA" required :error="errors.phone" />
          </div>
          <UiInput v-model="form.address" label="Alamat" placeholder="opsional" />
          <UiTextarea v-model="form.purpose" label="Keperluan" :rows="3" placeholder="Untuk keperluan apa surat ini dibutuhkan? (opsional)" />
          <UiButton type="submit" :loading="sending" block size="lg">Ajukan Permohonan</UiButton>
          <p v-if="sent" class="flex items-center gap-2 text-sm font-medium text-primary">
            <AppIcon name="check" :size="16" /> Permohonan Anda sudah terkirim. Terima kasih!
          </p>
        </form>
      </div>
    </div>
  </div>
</template>
