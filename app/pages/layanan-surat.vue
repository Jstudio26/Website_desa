<script setup lang="ts">
import type { Database } from '~/types/supabase'
import { DEFAULT_LETTER_TYPES, OTHER_LETTER_TYPE, requirementList } from '~/config/layanan'

const supabase = useSupabaseClient<Database>()
const { settings } = useSettings()
const toast = useToast()

const letterTypes = computed(() => (settings.value.letterTypes?.length ? settings.value.letterTypes : DEFAULT_LETTER_TYPES))
const typeOptions = computed(() => [...letterTypes.value.map((t) => t.name), OTHER_LETTER_TYPE].map((t) => ({ label: t, value: t })))

const STEPS = [
  { title: 'Isi formulir', text: 'Pilih jenis surat dan isi data diri. Tidak perlu membuat akun.' },
  { title: 'Simpan kode tiket', text: 'Setelah terkirim, Anda mendapat kode untuk mengecek status permohonan.' },
  { title: 'Verifikasi petugas', text: 'Petugas memeriksa permohonan dan menghubungi Anda bila ada yang perlu dilengkapi.' },
  { title: 'Ambil surat', text: 'Bila status "Selesai", ambil surat di kantor dengan membawa persyaratan asli.' },
]

const form = reactive({ type: '', name: '', phone: '', address: '', purpose: '' })
const errors = reactive<Record<string, string>>({})
const sending = ref(false)
const ticket = ref<string | null>(null)
const formEl = ref<HTMLElement | null>(null)

watchEffect(() => {
  if (!form.type) form.type = typeOptions.value[0]?.value ?? OTHER_LETTER_TYPE
})
const isOther = computed(() => form.type === OTHER_LETTER_TYPE)
const selectedRequirements = computed(() =>
  requirementList(letterTypes.value.find((t) => t.name === form.type)?.requirements ?? ''))

function choose(name: string) {
  form.type = name
  formEl.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function validate() {
  const digits = form.phone.replace(/\D/g, '')
  errors.name = form.name.trim().length >= 2 ? '' : 'Nama wajib diisi.'
  errors.phone = digits.length >= 9 && digits.length <= 15 ? '' : 'Isi nomor telepon/WA yang aktif (9–15 digit).'
  errors.purpose = isOther.value && form.purpose.trim().length < 5 ? 'Sebutkan surat yang Anda butuhkan.' : ''
  return !errors.name && !errors.phone && !errors.purpose
}

async function submit() {
  if (!validate()) return
  sending.value = true
  try {
    const { data, error } = await supabase.rpc('ajukan_surat', {
      p_type: form.type,
      p_name: form.name.trim(),
      p_phone: form.phone.trim(),
      p_address: form.address.trim() || null,
      p_purpose: form.purpose.trim() || null,
    })
    if (error) throw error
    ticket.value = data
    form.name = form.phone = form.address = form.purpose = ''
    formEl.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
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
      subtitle="Ajukan permohonan surat keterangan tanpa perlu antre di kantor kelurahan."
      :breadcrumb="[{ label: 'Layanan Surat' }]"
    />

    <div class="section container-app grid gap-10 lg:grid-cols-2">
      <div class="space-y-10">
        <div v-reveal>
          <span class="eyebrow"><span class="h-px w-6 bg-primary" /> Informasi</span>
          <h2 class="mt-4 font-heading text-2xl font-extrabold">Jenis Surat & Persyaratan</h2>
          <ul class="mt-6 space-y-3">
            <li v-for="t in letterTypes" :key="t.name" class="rounded-theme border border-line/80 bg-surface p-4 shadow-card">
              <div class="flex items-start gap-3">
                <span class="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                  <AppIcon name="fileText" :size="16" />
                </span>
                <div class="min-w-0 flex-1">
                  <p class="pt-1 text-sm font-semibold text-ink">{{ t.name }}</p>
                  <p v-if="t.duration" class="mt-0.5 flex items-center gap-1 text-xs text-ink-muted">
                    <AppIcon name="clock" :size="12" /> Perkiraan proses: {{ t.duration }}
                  </p>
                  <ul v-if="requirementList(t.requirements).length" class="mt-2 list-disc space-y-0.5 pl-4 text-sm text-ink-muted">
                    <li v-for="r in requirementList(t.requirements)" :key="r">{{ r }}</li>
                  </ul>
                  <p v-else class="mt-1 text-xs text-ink-muted">Persyaratan akan disampaikan petugas saat verifikasi.</p>
                </div>
                <button type="button" class="shrink-0 text-sm font-semibold text-primary hover:underline" @click="choose(t.name)">
                  Ajukan
                </button>
              </div>
            </li>
          </ul>
        </div>

        <div v-reveal>
          <h2 class="font-heading text-xl font-extrabold">Alur Permohonan</h2>
          <ol class="mt-5 space-y-4">
            <li v-for="(s, i) in STEPS" :key="s.title" class="flex gap-4">
              <span class="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary text-sm font-bold text-white">{{ i + 1 }}</span>
              <div>
                <p class="font-semibold text-ink">{{ s.title }}</p>
                <p class="text-sm text-ink-muted">{{ s.text }}</p>
              </div>
            </li>
          </ol>
          <p class="mt-6 text-sm text-ink-muted">
            Sudah pernah mengajukan?
            <NuxtLink to="/cek-status" class="font-semibold text-primary hover:underline">Cek status permohonan</NuxtLink>
          </p>
        </div>

        <OfficeHours v-reveal />
      </div>

      <div ref="formEl" v-reveal="1" class="accent-top scroll-mt-28 self-start rounded-theme border border-line/80 bg-surface p-6 shadow-card sm:p-8">
        <TicketSuccess
          v-if="ticket"
          :code="ticket"
          title="Permohonan terkirim"
          message="Petugas akan memeriksa permohonan Anda dan menghubungi nomor telepon/WA yang Anda isi."
          @again="ticket = null"
        />

        <template v-else>
          <h2 class="font-heading text-2xl font-extrabold">Formulir Permohonan</h2>
          <p class="mt-1.5 text-sm text-ink-muted">Kolom bertanda <span class="text-red-500">*</span> wajib diisi.</p>
          <form class="mt-6 space-y-4" novalidate @submit.prevent="submit">
            <div>
              <UiSelect v-model="form.type" label="Jenis Surat" required :options="typeOptions" />
              <div v-if="selectedRequirements.length" class="mt-2 rounded-theme bg-surface-muted px-3 py-2 text-xs text-ink-muted">
                <span class="font-semibold text-ink">Siapkan:</span> {{ selectedRequirements.join(' · ') }}
              </div>
            </div>
            <UiInput v-model="form.name" label="Nama Lengkap" required autocomplete="name" :error="errors.name" />
            <UiInput
              v-model="form.phone"
              label="Telepon / WA"
              type="tel"
              inputmode="tel"
              autocomplete="tel"
              required
              placeholder="08xxxxxxxxxx"
              hint="Petugas akan menghubungi nomor ini."
              :error="errors.phone"
            />
            <UiInput v-model="form.address" label="Alamat" autocomplete="street-address" placeholder="Opsional, mis. Lingkungan II, RT 03" />
            <UiTextarea
              v-model="form.purpose"
              :label="isOther ? 'Surat yang dibutuhkan & keperluannya' : 'Keperluan'"
              :required="isOther"
              :rows="3"
              :placeholder="isOther ? 'Mis. Surat keterangan kelakuan baik untuk melamar kerja' : 'Opsional, mis. untuk pendaftaran sekolah'"
              :error="errors.purpose"
            />
            <p class="flex gap-2 rounded-theme bg-surface-muted px-3 py-2.5 text-xs text-ink-muted">
              <AppIcon name="shield" :size="15" class="mt-0.5 shrink-0 text-primary" />
              <span>Data Anda hanya dipakai untuk memproses permohonan ini dan hanya dapat dilihat oleh petugas kelurahan.</span>
            </p>
            <UiButton type="submit" :loading="sending" block size="lg">Ajukan Permohonan</UiButton>
          </form>
        </template>
      </div>
    </div>
  </div>
</template>
