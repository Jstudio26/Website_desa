<script setup lang="ts">
import type { Database } from '~/types/supabase'
import type { LetterRequest, LetterRequestStatus } from '~/types/database'
import { formatDate } from '~/utils/format'

definePageMeta({ layout: 'admin' })

const supabase = useSupabaseClient<Database>()
const toast = useToast()

const { data: items, pending, refresh } = await useAsyncData('admin-layanan-surat', async () => {
  const { data, error } = await supabase.from('letter_requests').select('*').order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as LetterRequest[]
})

const STATUS_LABEL: Record<LetterRequestStatus, string> = {
  diajukan: 'Diajukan',
  diproses: 'Diproses',
  selesai: 'Selesai',
  ditolak: 'Ditolak',
}
const STATUS_COLOR: Record<LetterRequestStatus, string> = {
  diajukan: '#D97706',
  diproses: '#2563EB',
  selesai: '#16A34A',
  ditolak: '#DC2626',
}
const STATUS_OPTIONS = (Object.keys(STATUS_LABEL) as LetterRequestStatus[]).map((s) => ({ label: STATUS_LABEL[s], value: s }))

const filter = ref<'semua' | LetterRequestStatus>('semua')
const filtered = computed(() => {
  const list = items.value ?? []
  return filter.value === 'semua' ? list : list.filter((i) => i.status === filter.value)
})

const active = ref<LetterRequest | null>(null)
const open = ref(false)
const editForm = reactive({ status: 'diajukan' as LetterRequestStatus, note: '' })
const saving = ref(false)

function view(item: LetterRequest) {
  active.value = item
  editForm.status = item.status
  editForm.note = item.note ?? ''
  open.value = true
}

async function saveStatus() {
  if (!active.value) return
  saving.value = true
  try {
    const { error } = await supabase
      .from('letter_requests')
      .update({ status: editForm.status, note: editForm.note.trim() || null, updated_at: new Date().toISOString() })
      .eq('id', active.value.id)
    if (error) throw error
    toast.success('Status diperbarui')
    open.value = false
    refresh()
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

useHead({ title: 'Layanan Surat' })
</script>

<template>
  <div>
    <AdminPageHeader title="Layanan Surat" description="Permohonan surat keterangan dari warga." />

    <div class="mb-4 flex flex-wrap gap-2">
      <button
        v-for="f in [{ v: 'semua', l: 'Semua' }, ...STATUS_OPTIONS.map((s) => ({ v: s.value, l: s.label }))]"
        :key="f.v"
        class="rounded-full border px-3.5 py-1.5 text-xs font-medium transition"
        :class="filter === f.v ? 'border-primary bg-primary text-white' : 'border-line bg-surface text-ink-muted hover:bg-surface-muted'"
        @click="filter = f.v as typeof filter"
      >
        {{ f.l }}
      </button>
    </div>

    <div v-if="pending" class="space-y-2">
      <UiSkeleton v-for="i in 6" :key="i" class="h-16" />
    </div>

    <div v-else-if="filtered.length" class="overflow-hidden rounded-theme border border-line">
      <ul class="divide-y divide-line">
        <li v-for="item in filtered" :key="item.id" class="flex items-start gap-3 px-4 py-3 transition hover:bg-surface-muted/40">
          <button class="min-w-0 flex-1 text-left" @click="view(item)">
            <p class="text-sm font-medium text-ink">
              {{ item.name }}
              <span class="font-normal text-ink-muted">· {{ formatDate(item.created_at, 'long') }}</span>
            </p>
            <p class="mt-0.5 line-clamp-1 text-sm text-ink-muted">{{ item.type }}</p>
            <p class="mt-0.5 text-xs text-ink-muted">NIK {{ item.nik }} · {{ item.phone }}</p>
          </button>
          <UiBadge :color="STATUS_COLOR[item.status]">{{ STATUS_LABEL[item.status] }}</UiBadge>
          <button class="p-1.5 text-ink-muted hover:text-red-500" @click="confirmId = item.id">
            <AppIcon name="trash" :size="15" />
          </button>
        </li>
      </ul>
    </div>

    <UiEmptyState v-else title="Belum ada permohonan" message="Permohonan surat dari warga akan muncul di sini." />

    <UiModal v-model:open="open" :title="active?.name || 'Permohonan Surat'" size="md">
      <div v-if="active" class="space-y-4 text-sm">
        <div class="space-y-1.5 rounded-theme bg-surface-muted/50 p-4">
          <p><span class="text-ink-muted">Jenis surat:</span> <span class="font-medium text-ink">{{ active.type }}</span></p>
          <p><span class="text-ink-muted">NIK:</span> <span class="font-medium text-ink">{{ active.nik }}</span></p>
          <p><span class="text-ink-muted">Telepon:</span> <a :href="`tel:${active.phone}`" class="font-medium text-primary hover:underline">{{ active.phone }}</a></p>
          <p v-if="active.address"><span class="text-ink-muted">Alamat:</span> <span class="font-medium text-ink">{{ active.address }}</span></p>
          <p v-if="active.purpose"><span class="text-ink-muted">Keperluan:</span> <span class="font-medium text-ink">{{ active.purpose }}</span></p>
          <p class="text-xs text-ink-muted">Diajukan {{ formatDate(active.created_at, 'long') }}</p>
        </div>

        <UiSelect v-model="editForm.status" label="Status" :options="STATUS_OPTIONS" />
        <UiTextarea v-model="editForm.note" label="Catatan Admin" :rows="3" placeholder="Opsional, mis. alasan ditolak atau info pengambilan." />
      </div>
      <template #footer>
        <div class="flex justify-between gap-2">
          <UiButton variant="danger" size="sm" @click="confirmId = active?.id ?? null">Hapus</UiButton>
          <div class="flex gap-2">
            <UiButton variant="ghost" size="sm" @click="open = false">Tutup</UiButton>
            <UiButton size="sm" :loading="saving" @click="saveStatus">Simpan</UiButton>
          </div>
        </div>
      </template>
    </UiModal>

    <UiConfirmDialog
      :open="!!confirmId"
      danger
      title="Hapus permohonan"
      message="Data permohonan akan dihapus permanen."
      confirm-label="Hapus"
      @update:open="confirmId = null"
      @confirm="remove"
    />
  </div>
</template>
