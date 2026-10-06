<script setup lang="ts">
import type { Database } from '~/types/supabase'
import type { TicketStatus } from '~/types/database'
import { COMPLAINT_STATUS, LETTER_STATUS } from '~/config/layanan'
import { formatDateTime } from '~/utils/format'

const route = useRoute()
const router = useRouter()
const supabase = useSupabaseClient<Database>()

const CODE_PATTERN = /^(SR|PG)-[0-9A-F]{8}$/

const code = ref(String(route.query.kode ?? ''))
const result = ref<TicketStatus | null>(null)
const searched = ref('')
const loading = ref(false)
const error = ref('')

const normalized = computed(() => code.value.toUpperCase().replace(/\s+/g, ''))

async function check() {
  error.value = ''
  const c = normalized.value
  if (!CODE_PATTERN.test(c)) {
    error.value = 'Kode tidak sesuai format. Contoh: SR-4F09A2C1 (surat) atau PG-4F09A2C1 (pengaduan).'
    return
  }
  loading.value = true
  try {
    const { data, error: rpcError } = await supabase.rpc('cek_status', { p_code: c })
    if (rpcError) throw rpcError
    result.value = data
    searched.value = c
    router.replace({ query: { kode: c } })
  }
  catch {
    error.value = 'Gagal memeriksa status. Periksa koneksi lalu coba lagi.'
  }
  finally {
    loading.value = false
  }
}

onMounted(() => {
  if (code.value) check()
})

const meta = computed(() => {
  const r = result.value
  if (!r) return null
  return r.kind === 'surat' ? LETTER_STATUS[r.status] : COMPLAINT_STATUS[r.status]
})
/** Newest first, so the latest note is what the citizen reads first. */
const events = computed(() => (result.value?.kind === 'surat' ? [...result.value.events].reverse() : []))

useHead({ title: 'Cek Status Permohonan & Pengaduan' })
</script>

<template>
  <div>
    <PageHero
      title="Cek Status"
      subtitle="Lihat perkembangan permohonan surat atau pengaduan Anda dengan kode tiket."
      :breadcrumb="[{ label: 'Cek Status' }]"
    />

    <section class="section container-app">
      <div class="mx-auto max-w-2xl space-y-6">
        <form class="accent-top rounded-theme border border-line/80 bg-surface p-6 shadow-card sm:p-8" novalidate @submit.prevent="check">
          <h2 class="font-heading text-xl font-extrabold">Masukkan Kode Tiket</h2>
          <p class="mt-1.5 text-sm text-ink-muted">Kode diberikan setelah Anda mengirim permohonan surat atau pengaduan.</p>
          <div class="mt-5 flex flex-col gap-3 sm:flex-row sm:items-start">
            <div class="flex-1">
              <UiInput
                v-model="code"
                label="Kode tiket"
                placeholder="SR-XXXXXXXX atau PG-XXXXXXXX"
                autocomplete="off"
                :error="error"
              />
            </div>
            <UiButton type="submit" :loading="loading" class="sm:mt-[1.85rem]">
              <template #icon><AppIcon name="search" :size="16" /></template> Cek
            </UiButton>
          </div>
        </form>

        <div
          v-if="searched && !result && !loading"
          class="rounded-theme border border-dashed border-line bg-surface p-6 text-center"
          role="status"
        >
          <p class="font-heading font-bold text-ink">Kode {{ searched }} tidak ditemukan</p>
          <p class="mt-1 text-sm text-ink-muted">
            Periksa kembali penulisan kode. Bila masih tidak ditemukan, hubungi
            <NuxtLink to="/kontak" class="font-semibold text-primary hover:underline">kantor kelurahan</NuxtLink>.
          </p>
        </div>

        <article v-if="result && meta" class="rounded-theme border border-line/80 bg-surface p-6 shadow-card sm:p-8" role="status">
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p class="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                {{ result.kind === 'surat' ? 'Permohonan Surat' : 'Pengaduan' }} · {{ result.code }}
              </p>
              <h2 class="mt-1 font-heading text-xl font-extrabold">{{ result.title }}</h2>
              <p class="mt-1 text-sm text-ink-muted">Dikirim {{ formatDateTime(result.created_at) }}</p>
            </div>
            <StatusBadge :meta="meta" size="md" />
          </div>
          <p class="mt-4 rounded-theme bg-surface-muted px-4 py-3 text-sm text-ink">{{ meta.hint }}</p>

          <!-- Pengaduan: tanggapan petugas -->
          <div v-if="result.kind === 'pengaduan'" class="mt-6">
            <h3 class="font-heading font-bold">Tanggapan Petugas</h3>
            <p v-if="result.response" class="mt-2 whitespace-pre-line text-sm text-ink">{{ result.response }}</p>
            <p v-else class="mt-2 text-sm text-ink-muted">Belum ada tanggapan.</p>
            <p class="mt-3 text-xs text-ink-muted">Diperbarui {{ formatDateTime(result.updated_at) }}</p>
          </div>

          <!-- Surat: riwayat status -->
          <div v-else class="mt-6">
            <h3 class="font-heading font-bold">Riwayat</h3>
            <ol class="mt-4 space-y-5 border-l-2 border-line pl-5">
              <li v-for="(e, i) in events" :key="i" class="relative">
                <span
                  class="absolute -left-[1.6rem] top-1 h-3 w-3 rounded-full border-2 border-surface"
                  :class="i === 0 ? 'bg-primary' : 'bg-line'"
                />
                <div class="flex flex-wrap items-center gap-2">
                  <StatusBadge :meta="LETTER_STATUS[e.status]" />
                  <span class="text-xs text-ink-muted">{{ formatDateTime(e.at) }}</span>
                </div>
                <p v-if="e.note" class="mt-1.5 whitespace-pre-line text-sm text-ink">{{ e.note }}</p>
              </li>
            </ol>
          </div>
        </article>

        <OfficeHours />
      </div>
    </section>
  </div>
</template>
