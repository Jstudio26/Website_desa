<script setup lang="ts">
import { apiFetch, ApiClientError } from '~/composables/useApi'

definePageMeta({ layout: 'admin' })
const toast = useToast()

interface Member {
  id: string, name: string, photo: string | null, studentId: string | null, studyProgram: string | null
  faculty: string | null, university: string | null, role: string, position: string | null
  fieldId: string | null, displayOrder: number, isActive: boolean
  instagram: string | null, linkedin: string | null, email: string | null
  field?: { name: string } | null
}
interface Field { id: string, name: string }

const roleFilter = ref('')
const fieldFilter = ref('')
const q = ref('')

const { data: fields } = await useAsyncData('kkt-fields-opt', () => apiFetch<Field[]>('/api/admin/kkt/fields'))
const { data, refresh, pending } = await useAsyncData<Member[]>(
  'admin-kkt-members',
  () => apiFetch('/api/admin/kkt/members', { query: { role: roleFilter.value || undefined, fieldId: fieldFilter.value || undefined, q: q.value || undefined } }),
  { watch: [roleFilter, fieldFilter] },
)
watchDebounced(q, () => refresh(), { debounce: 400 })

const ROLES = [
  { label: 'Koordinator Posko', value: 'KOORDINATOR' },
  { label: 'Sekretaris Posko', value: 'SEKRETARIS' },
  { label: 'Bendahara Posko', value: 'BENDAHARA' },
  { label: 'Anggota', value: 'ANGGOTA' },
]

const showForm = ref(false)
const editing = ref<Partial<Member> | null>(null)
const saving = ref(false)
const confirmId = ref<string | null>(null)

function create() {
  editing.value = { name: '', role: 'ANGGOTA', fieldId: null, displayOrder: 0, isActive: true, photo: '' }
  showForm.value = true
}
function edit(m: Member) { editing.value = { ...m }; showForm.value = true }

async function save() {
  if (!editing.value) return
  saving.value = true
  try {
    if (editing.value.id) await apiFetch(`/api/admin/kkt/members/${editing.value.id}`, { method: 'PUT', body: editing.value })
    else await apiFetch('/api/admin/kkt/members', { method: 'POST', body: editing.value })
    showForm.value = false
    await refresh()
    toast.success('Anggota tersimpan')
  }
  catch (e) { toast.error('Gagal', e instanceof ApiClientError ? e.message : '') }
  finally { saving.value = false }
}

async function remove() {
  if (!confirmId.value) return
  try {
    await apiFetch(`/api/admin/kkt/members/${confirmId.value}`, { method: 'DELETE' })
    await refresh()
    toast.success('Anggota dihapus')
  }
  catch (e) { toast.error('Gagal', e instanceof ApiClientError ? e.message : '') }
  finally { confirmId.value = null }
}
useHead({ title: 'Anggota Tim KKT' })
</script>

<template>
  <div>
    <AdminPageHeader title="Anggota Tim KKT" description="Kelola koordinator, sekretaris, bendahara, dan anggota tiap bidang.">
      <template #actions>
        <UiButton @click="create"><template #icon><AppIcon name="plus" :size="15" /></template> Anggota</UiButton>
      </template>
    </AdminPageHeader>

    <div class="mb-4 grid gap-3 sm:grid-cols-3">
      <label class="relative">
        <AppIcon name="search" :size="16" class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
        <input v-model="q" type="search" placeholder="Cari nama..." class="w-full rounded-theme border border-line bg-surface py-2 pl-9 pr-3 text-sm outline-none focus:border-primary">
      </label>
      <UiSelect v-model="roleFilter" :options="[{ label: 'Semua jabatan', value: '' }, ...ROLES]" />
      <UiSelect v-model="fieldFilter" :options="[{ label: 'Semua bidang', value: '' }, ...(fields || []).map((f) => ({ label: f.name, value: f.id }))]" />
    </div>

    <div v-if="pending" class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"><UiSkeleton v-for="i in 6" :key="i" class="h-24" /></div>

    <div v-else-if="data && data.length" class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <div v-for="m in data" :key="m.id" class="flex gap-3 rounded-theme border border-line bg-surface p-3">
        <img v-if="m.photo" :src="m.photo" alt="" class="h-16 w-16 shrink-0 rounded-md object-cover">
        <div v-else class="grid h-16 w-16 shrink-0 place-items-center rounded-md bg-surface-muted text-ink-muted">
          <AppIcon name="user" :size="22" />
        </div>
        <div class="min-w-0 flex-1">
          <p class="truncate text-sm font-semibold">{{ m.name }}</p>
          <p class="text-xs text-primary">{{ ROLES.find((r) => r.value === m.role)?.label }}</p>
          <p class="truncate text-xs text-ink-muted">{{ m.field?.name || m.studyProgram || '—' }}</p>
          <div class="mt-1.5 flex gap-1">
            <button class="p-1 text-ink-muted hover:text-primary" @click="edit(m)"><AppIcon name="edit" :size="14" /></button>
            <button class="p-1 text-ink-muted hover:text-red-500" @click="confirmId = m.id"><AppIcon name="trash" :size="14" /></button>
            <span v-if="!m.isActive" class="ml-auto self-center text-xs text-amber-600">nonaktif</span>
          </div>
        </div>
      </div>
    </div>

    <UiEmptyState v-else title="Belum ada anggota" message="Tambahkan anggota tim KKT.">
      <UiButton size="sm" @click="create">Tambah Anggota</UiButton>
    </UiEmptyState>

    <UiModal v-model:open="showForm" :title="editing?.id ? 'Ubah Anggota' : 'Anggota Baru'" size="lg">
      <div v-if="editing" class="grid gap-4 sm:grid-cols-2">
        <UiInput v-model="editing.name" label="Nama Lengkap" required class="sm:col-span-2" />
        <UiInput v-model="editing.photo" label="URL Foto" class="sm:col-span-2" />
        <UiInput v-model="editing.studentId" label="NIM" />
        <UiInput v-model="editing.studyProgram" label="Program Studi" />
        <UiInput v-model="editing.faculty" label="Fakultas" />
        <UiInput v-model="editing.university" label="Universitas" />
        <UiSelect v-model="editing.role" label="Jabatan" :options="ROLES" />
        <UiSelect
          v-model="editing.fieldId"
          label="Bidang"
          placeholder="Tanpa bidang"
          :options="(fields || []).map((f) => ({ label: f.name, value: f.id }))"
        />
        <UiInput v-model.number="editing.displayOrder" label="Urutan Tampilan" type="number" />
        <div class="flex items-end"><UiToggle v-model="editing.isActive" label="Aktif" /></div>
        <UiInput v-model="editing.instagram" label="Instagram (URL)" />
        <UiInput v-model="editing.linkedin" label="LinkedIn (URL)" />
        <UiInput v-model="editing.email" label="Email" class="sm:col-span-2" />
      </div>
      <template #footer>
        <div class="flex justify-end gap-2">
          <UiButton variant="ghost" @click="showForm = false">Batal</UiButton>
          <UiButton :loading="saving" @click="save">Simpan</UiButton>
        </div>
      </template>
    </UiModal>

    <UiConfirmDialog :open="!!confirmId" danger title="Hapus anggota" confirm-label="Hapus" @update:open="confirmId = null" @confirm="remove" />
  </div>
</template>
