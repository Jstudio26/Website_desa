<script setup lang="ts">
import type { Database } from '~/types/supabase'
import type { LetterRequest, LetterRequestEvent, LetterRequestStatus, LetterTypeConfig } from '~/types/database'
import { DEFAULT_LETTER_TYPES, LETTER_STATUS, OTHER_LETTER_TYPE } from '~/config/layanan'
import { patchSettings } from '~/composables/useSettings'
import { formatDate, formatDateTime } from '~/utils/format'

definePageMeta({ layout: 'admin' })

const supabase = useSupabaseClient<Database>()
const toast = useToast()
const { settings, refresh: refreshSettings } = useSettings()

const { data: items, pending, refresh } = await useAsyncData('admin-layanan-surat', async () => {
  const { data, error } = await supabase.from('letter_requests').select('*').order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as LetterRequest[]
})

const STATUS_KEYS = Object.keys(LETTER_STATUS) as LetterRequestStatus[]
const STATUS_OPTIONS = STATUS_KEYS.map((s) => ({ label: LETTER_STATUS[s].label, value: s }))

const filter = ref<'semua' | LetterRequestStatus>('semua')
const counts = computed(() => {
  const list = items.value ?? []
  return Object.fromEntries(STATUS_KEYS.map((s) => [s, list.filter((i) => i.status === s).length])) as Record<LetterRequestStatus, number>
})
const filters = computed(() => [
  { v: 'semua' as const, l: 'Semua', n: items.value?.length ?? 0 },
  ...STATUS_KEYS.map((s) => ({ v: s, l: LETTER_STATUS[s].label, n: counts.value[s] })),
])
const search = ref('')
const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  return (items.value ?? [])
    .filter((i) => filter.value === 'semua' || i.status === filter.value)
    .filter((i) => !q || [i.name, i.code, i.phone, i.type].some((v) => v.toLowerCase().includes(q)))
})

// ---- Detail ----------------------------------------------------------------
const active = ref<LetterRequest | null>(null)
const open = ref(false)
const editForm = reactive({ status: 'diajukan' as LetterRequestStatus, note: '' })
const saving = ref(false)
const history = ref<LetterRequestEvent[]>([])

async function view(item: LetterRequest) {
  active.value = item
  editForm.status = item.status
  editForm.note = item.note ?? ''
  history.value = []
  open.value = true
  const { data } = await supabase
    .from('letter_request_events')
    .select('*')
    .eq('request_id', item.id)
    .order('created_at', { ascending: false })
  history.value = (data ?? []) as LetterRequestEvent[]
}

const origin = useRequestURL().origin

/** 08xx / +62 8xx → 628xx for wa.me. */
function waNumber(phone: string) {
  const d = phone.replace(/\D/g, '')
  return d.startsWith('0') ? `62${d.slice(1)}` : d
}
const waLink = computed(() => {
  const a = active.value
  if (!a) return ''
  const status = LETTER_STATUS[editForm.status].label
  const lines = [
    `Halo ${a.name},`,
    `permohonan ${a.type} Anda (kode ${a.code}) saat ini berstatus: ${status}.`,
    editForm.note.trim(),
    `Cek status: ${origin}/cek-status?kode=${a.code}`,
    `- ${settings.value.villageName}`,
  ].filter(Boolean)
  return `https://wa.me/${waNumber(a.phone)}?text=${encodeURIComponent(lines.join('\n'))}`
})

async function saveStatus() {
  if (!active.value) return
  if (editForm.status === 'ditolak' && !editForm.note.trim()) {
    toast.error('Isi alasan penolakan', 'Pemohon akan melihat catatan ini saat cek status.')
    return
  }
  saving.value = true
  try {
    const { error } = await supabase
      .from('letter_requests')
      .update({ status: editForm.status, note: editForm.note.trim() || null, updated_at: new Date().toISOString() })
      .eq('id', active.value.id)
    if (error) throw error
    toast.success('Status diperbarui', 'Kabari pemohon lewat tombol WhatsApp bila perlu.')
    await refresh()
    const updated = items.value?.find((i) => i.id === active.value?.id)
    if (updated) await view(updated)
  }
  catch (e) {
    toast.error('Gagal menyimpan', e instanceof Error ? e.message : '')
  }
  finally {
    saving.value = false
  }
}

const confirmId = ref<string | null>(null)
async function remove() {
  if (!confirmId.value) return
  const { error } = await supabase.from('letter_requests').delete().eq('id', confirmId.value)
  if (error) { toast.error('Gagal menghapus', error.message); confirmId.value = null; return }
  toast.success('Permohonan dihapus')
  if (active.value?.id === confirmId.value) open.value = false
  confirmId.value = null
  refresh()
}

// ---- Jenis surat & persyaratan ----------------------------------------------
const typesOpen = ref(false)
const typeRows = ref<LetterTypeConfig[]>([])
const savingTypes = ref(false)

function openTypes() {
  const current = settings.value.letterTypes?.length ? settings.value.letterTypes : DEFAULT_LETTER_TYPES
  typeRows.value = current.map((t) => ({ ...t }))
  typesOpen.value = true
}
function addType() {
  typeRows.value.push({ name: '', requirements: '', duration: '' })
}
function moveType(i: number, dir: -1 | 1) {
  const j = i + dir
  if (j < 0 || j >= typeRows.value.length) return
  const rows = typeRows.value
  ;[rows[i], rows[j]] = [rows[j]!, rows[i]!]
}

async function saveTypes() {
  const rows = typeRows.value
    .map((t) => ({ name: t.name.trim(), requirements: t.requirements.trim(), duration: t.duration.trim() }))
    .filter((t) => t.name)
  const names = rows.map((t) => t.name.toLowerCase())
  if (!rows.length) { toast.error('Minimal satu jenis surat'); return }
  if (new Set(names).size !== names.length) { toast.error('Ada nama jenis surat yang sama'); return }
  if (names.includes(OTHER_LETTER_TYPE.toLowerCase())) {
    toast.error(`"${OTHER_LETTER_TYPE}" sudah otomatis ada`, 'Hapus baris tersebut dari daftar.')
    return
  }
  savingTypes.value = true
  try {
    await patchSettings(supabase, () => ({ letterTypes: rows }))
    await refreshSettings()
    toast.success('Jenis surat disimpan')
    typesOpen.value = false
  }
  catch (e) {
    toast.error('Gagal menyimpan', e instanceof Error ? e.message : '')
  }
  finally {
    savingTypes.value = false
  }
}

useHead({ title: 'Layanan Surat' })
</script>

<template>
  <div>
    <AdminPageHeader title="Layanan Surat" description="Permohonan surat keterangan dari warga.">
      <template #actions>
        <UiButton size="sm" variant="outline" @click="openTypes">
          <template #icon><AppIcon name="settings" :size="14" /></template> Jenis Surat & Persyaratan
        </UiButton>
      </template>
    </AdminPageHeader>

    <div class="mb-4 flex flex-wrap items-center gap-2">
      <button
        v-for="f in filters"
        :key="f.v"
        class="rounded-full border px-3.5 py-1.5 text-xs font-medium transition"
        :class="filter === f.v ? 'border-primary bg-primary text-white' : 'border-line bg-surface text-ink-muted hover:bg-surface-muted'"
        @click="filter = f.v"
      >
        {{ f.l }} <span class="opacity-70">({{ f.n }})</span>
      </button>
      <div class="ml-auto w-full sm:w-64">
        <UiInput v-model="search" placeholder="Cari nama, kode, nomor…" />
      </div>
    </div>

    <div v-if="pending" class="space-y-2">
      <UiSkeleton v-for="i in 6" :key="i" class="h-16" />
    </div>

    <div v-else-if="filtered.length" class="overflow-hidden rounded-theme border border-line bg-surface">
      <ul class="divide-y divide-line">
        <li v-for="item in filtered" :key="item.id" class="flex items-start gap-3 px-4 py-3 transition hover:bg-surface-muted/40">
          <button class="min-w-0 flex-1 text-left" @click="view(item)">
            <p class="text-sm font-medium text-ink">
              {{ item.name }}
              <span class="font-normal text-ink-muted">· {{ formatDate(item.created_at, 'long') }}</span>
            </p>
            <p class="mt-0.5 line-clamp-1 text-sm text-ink-muted">{{ item.type }}</p>
            <p class="mt-0.5 text-xs text-ink-muted">
              <span class="font-mono font-semibold text-ink">{{ item.code }}</span> · {{ item.phone }}
            </p>
          </button>
          <StatusBadge :meta="LETTER_STATUS[item.status]" />
          <button class="p-1.5 text-ink-muted hover:text-red-500" aria-label="Hapus" @click="confirmId = item.id">
            <AppIcon name="trash" :size="15" />
          </button>
        </li>
      </ul>
    </div>

    <UiEmptyState
      v-else
      :title="items?.length ? 'Tidak ada yang cocok' : 'Belum ada permohonan'"
      :message="items?.length ? 'Ubah filter atau kata pencarian.' : 'Permohonan surat dari warga akan muncul di sini.'"
    />

    <!-- Detail permohonan -->
    <UiModal v-model:open="open" :title="active?.name || 'Permohonan Surat'" size="lg">
      <div v-if="active" class="space-y-5 text-sm">
        <div class="space-y-1.5 rounded-theme bg-surface-muted/50 p-4">
          <p><span class="text-ink-muted">Kode:</span> <span class="font-mono font-semibold text-ink">{{ active.code }}</span></p>
          <p><span class="text-ink-muted">Jenis surat:</span> <span class="font-medium text-ink">{{ active.type }}</span></p>
          <p v-if="active.nik"><span class="text-ink-muted">NIK (data lama):</span> <span class="font-medium text-ink">{{ active.nik }}</span></p>
          <p><span class="text-ink-muted">Telepon:</span> <a :href="`tel:${active.phone}`" class="font-medium text-primary hover:underline">{{ active.phone }}</a></p>
          <p v-if="active.address"><span class="text-ink-muted">Alamat:</span> <span class="font-medium text-ink">{{ active.address }}</span></p>
          <p v-if="active.purpose"><span class="text-ink-muted">Keperluan:</span> <span class="font-medium text-ink">{{ active.purpose }}</span></p>
          <p class="text-xs text-ink-muted">Diajukan {{ formatDateTime(active.created_at) }}</p>
        </div>

        <div class="grid gap-4 sm:grid-cols-[12rem_1fr]">
          <UiSelect v-model="editForm.status" label="Status" :options="STATUS_OPTIONS" />
          <UiTextarea
            v-model="editForm.note"
            label="Catatan untuk pemohon"
            :required="editForm.status === 'ditolak'"
            :rows="3"
            hint="Terlihat oleh pemohon saat cek status. Wajib diisi bila ditolak."
            :placeholder="editForm.status === 'ditolak' ? 'Alasan penolakan, mis. data tidak sesuai' : 'Mis. Surat bisa diambil Senin, bawa KTP asli'"
          />
        </div>

        <div v-if="history.length">
          <p class="font-semibold text-ink">Riwayat</p>
          <ol class="mt-2 space-y-2 border-l-2 border-line pl-4">
            <li v-for="e in history" :key="e.id">
              <div class="flex flex-wrap items-center gap-2">
                <StatusBadge :meta="LETTER_STATUS[e.status]" />
                <span class="text-xs text-ink-muted">{{ formatDateTime(e.created_at) }}</span>
              </div>
              <p v-if="e.note" class="mt-0.5 whitespace-pre-line text-xs text-ink-muted">{{ e.note }}</p>
            </li>
          </ol>
        </div>
      </div>
      <template #footer>
        <div class="flex flex-wrap justify-between gap-2">
          <UiButton variant="ghost" size="sm" @click="confirmId = active?.id ?? null">
            <template #icon><AppIcon name="trash" :size="14" /></template> Hapus
          </UiButton>
          <div class="flex flex-wrap gap-2">
            <UiButton variant="outline" size="sm" :href="waLink" target="_blank" rel="noopener">
              <template #icon><AppIcon name="whatsapp" :size="14" /></template> Kabari via WA
            </UiButton>
            <UiButton size="sm" :loading="saving" @click="saveStatus">Simpan Status</UiButton>
          </div>
        </div>
      </template>
    </UiModal>

    <!-- Jenis surat & persyaratan -->
    <UiModal v-model:open="typesOpen" title="Jenis Surat & Persyaratan" size="lg">
      <p class="text-sm text-ink-muted">
        Tampil di halaman Layanan Surat. Tulis satu persyaratan per baris. Pilihan "{{ OTHER_LETTER_TYPE }}" selalu ada otomatis.
      </p>
      <div class="mt-4 space-y-4">
        <div v-for="(t, i) in typeRows" :key="i" class="space-y-3 rounded-theme border border-line p-4">
          <div class="flex items-start gap-2">
            <div class="flex-1"><UiInput v-model="t.name" label="Nama surat" placeholder="Mis. Surat Keterangan Domisili" /></div>
            <div class="mt-7 flex shrink-0">
              <button type="button" class="p-1.5 text-ink-muted hover:text-primary disabled:opacity-30" :disabled="i === 0" aria-label="Naikkan" @click="moveType(i, -1)">
                <AppIcon name="chevronDown" :size="16" class="rotate-180" />
              </button>
              <button type="button" class="p-1.5 text-ink-muted hover:text-primary disabled:opacity-30" :disabled="i === typeRows.length - 1" aria-label="Turunkan" @click="moveType(i, 1)">
                <AppIcon name="chevronDown" :size="16" />
              </button>
              <button type="button" class="p-1.5 text-ink-muted hover:text-red-500" aria-label="Hapus" @click="typeRows.splice(i, 1)">
                <AppIcon name="trash" :size="15" />
              </button>
            </div>
          </div>
          <UiTextarea v-model="t.requirements" label="Persyaratan (satu per baris)" :rows="3" placeholder="Fotokopi KTP&#10;Fotokopi Kartu Keluarga&#10;Surat pengantar RT" />
          <UiInput v-model="t.duration" label="Perkiraan lama proses" placeholder="Opsional, mis. 1 hari kerja" />
        </div>
        <UiButton variant="outline" size="sm" @click="addType">
          <template #icon><AppIcon name="plus" :size="14" /></template> Tambah Jenis Surat
        </UiButton>
      </div>
      <template #footer>
        <div class="flex justify-end gap-2">
          <UiButton variant="ghost" size="sm" @click="typesOpen = false">Batal</UiButton>
          <UiButton size="sm" :loading="savingTypes" @click="saveTypes">Simpan</UiButton>
        </div>
      </template>
    </UiModal>

    <UiConfirmDialog
      :open="!!confirmId"
      danger
      title="Hapus permohonan"
      message="Data permohonan beserta riwayatnya akan dihapus permanen. Kode tiket tidak bisa dicek lagi."
      confirm-label="Hapus"
      @update:open="confirmId = null"
      @confirm="remove"
    />
  </div>
</template>
