<script setup lang="ts">
import type { Database } from '~/types/supabase'
const supabase = useSupabaseClient<Database>()
const { settings } = useSettings()
const toast = useToast()

const form = reactive({ name: '', email: '', phone: '', message: '' })
const errors = reactive<Record<string, string>>({})
const sending = ref(false)
const sent = ref(false)

const info = computed(() => [
  { icon: 'mapPin', label: 'Alamat', value: settings.value.address },
  { icon: 'phone', label: 'Telepon', value: settings.value.phone, href: `tel:${settings.value.phone}` },
  { icon: 'mail', label: 'Email', value: settings.value.email, href: `mailto:${settings.value.email}` },
  {
    icon: 'whatsapp',
    label: 'WhatsApp',
    value: settings.value.whatsapp,
    href: `https://wa.me/${settings.value.whatsapp.replace(/\D/g, '')}`,
  },
].filter((i) => i.value))

function validate() {
  errors.name = form.name.trim() ? '' : 'Nama wajib diisi.'
  errors.message = form.message.trim().length >= 10 ? '' : 'Pesan minimal 10 karakter.'
  errors.email = !form.email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email) ? '' : 'Email tidak valid.'
  return !errors.name && !errors.message && !errors.email
}

async function submit() {
  if (!validate()) return
  sending.value = true
  try {
    const { error } = await supabase.from('messages').insert({
      name: form.name.trim(),
      email: form.email.trim() || null,
      phone: form.phone.trim() || null,
      message: form.message.trim(),
    })
    if (error) throw error
    sent.value = true
    toast.success('Pesan terkirim', 'Terima kasih, pesan Anda sudah kami terima.')
    form.name = form.email = form.phone = form.message = ''
  }
  catch (e) {
    toast.error('Gagal mengirim', e instanceof Error ? e.message : 'Coba lagi beberapa saat.')
  }
  finally {
    sending.value = false
  }
}

useHead({ title: 'Kontak' })
</script>

<template>
  <div>
    <PageHero
      title="Kontak"
      subtitle="Hubungi pemerintah kelurahan untuk informasi, pengaduan, atau kerja sama."
      :breadcrumb="[{ label: 'Kontak' }]"
    />

    <div class="section container-app grid gap-10 lg:grid-cols-2">
      <!-- Info + map -->
      <div>
        <span class="eyebrow"><span class="h-px w-6 bg-primary" /> Kontak</span>
        <h2 class="mt-4 font-heading text-2xl font-extrabold">Informasi Kontak</h2>
        <ul class="mt-6 space-y-3">
          <li v-for="i in info" :key="i.label" class="flex gap-4 rounded-theme border border-line/80 bg-surface p-4 shadow-card">
            <span class="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
              <AppIcon :name="i.icon" :size="19" />
            </span>
            <div class="min-w-0">
              <p class="text-xs font-semibold uppercase tracking-wide text-ink-muted">{{ i.label }}</p>
              <a v-if="i.href" :href="i.href" class="break-words font-semibold text-ink transition hover:text-primary">{{ i.value }}</a>
              <p v-else class="font-semibold text-ink">{{ i.value }}</p>
            </div>
          </li>
        </ul>

        <div v-if="settings.mapEmbedUrl" class="mt-4 overflow-hidden rounded-theme border border-line/80 shadow-card">
          <iframe :src="settings.mapEmbedUrl" class="h-72 w-full" loading="lazy" referrerpolicy="no-referrer-when-downgrade" />
        </div>
      </div>

      <!-- Form -->
      <div class="accent-top rounded-theme border border-line/80 bg-surface p-6 shadow-card sm:p-8">
        <h2 class="font-heading text-2xl font-extrabold">Kirim Pesan</h2>
        <p class="mt-1.5 text-sm text-ink-muted">Isi formulir di bawah, kami akan menindaklanjuti.</p>
        <form class="mt-6 space-y-4" @submit.prevent="submit">
          <UiInput v-model="form.name" label="Nama" required :error="errors.name" placeholder="Nama lengkap" />
          <div class="grid gap-4 sm:grid-cols-2">
            <UiInput v-model="form.email" label="Email" type="email" :error="errors.email" placeholder="opsional" />
            <UiInput v-model="form.phone" label="Telepon / WA" :error="errors.phone" placeholder="opsional" />
          </div>
          <UiTextarea v-model="form.message" label="Pesan" required :rows="6" :error="errors.message" placeholder="Tulis pesan Anda…" />
          <UiButton type="submit" :loading="sending" block size="lg">Kirim Pesan</UiButton>
          <p v-if="sent" class="flex items-center gap-2 text-sm font-medium text-primary">
            <AppIcon name="check" :size="16" /> Pesan Anda sudah terkirim. Terima kasih!
          </p>
        </form>
      </div>
    </div>
  </div>
</template>
