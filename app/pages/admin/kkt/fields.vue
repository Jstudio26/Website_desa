<script setup lang="ts">
import { apiFetch, ApiClientError } from '~/composables/useApi'

definePageMeta({ layout: 'admin' })
const toast = useToast()

interface Field {
  id: string, name: string, slug: string, description: string | null, image: string | null
  displayOrder: number, isActive: boolean
}

const { data, refresh, pending } = await useAsyncData('admin-kkt-fields', () => apiFetch<Field[]>('/api/admin/kkt/fields'))

const showForm = ref(false)
const editing = ref<Partial<Field> | null>(null)
const saving = ref(false)
const confirmId = ref<string | null>(null)

function create() {
  editing.value = { name: '', description: '', image: '', displayOrder: (data.value?.length ?? 0), isActive: true }
  showForm.value = true
}
function edit(f: Field) { editing.value = { ...f }; showForm.value = true }

async function save() {
  if (!editing.value) return
  saving.value = true
  try {
    if (editing.value.id) await apiFetch(`/api/admin/kkt/fields/${editing.value.id}`, { method: 'PUT', body: editing.value })
    else await apiFetch('/api/admin/kkt/fields', { method: 'POST', body: editing.value })
    showForm.value = false
    await refresh()
    toast.success('Bidang tersimpan')
  }
  catch (e) { toast.error('Gagal', e instanceof ApiClientError ? e.message : '') }
  finally { saving.value = false }
}

async function remove() {
  if (!confirmId.value) return
  try {
    await apiFetch(`/api/admin/kkt/fields/${confirmId.value}`, { method: 'DELETE' })
    await refresh()
    toast.success('Bidang dihapus', 'Anggota terkait dilepas dari bidang ini.')
  }
  catch (e) { toast.error('Gagal', e instanceof ApiClientError ? e.message : '') }
  finally { confirmId.value = null }
}
useHead({ title: 'Bidang KKT' })
</script>

<template>
  <div>
    <AdminPageHeader title="Bidang / Divisi KKT" description="Struktur bidang bersifat dinamis — tambah atau ubah sesuai posko.">
      <template #actions>
        <UiButton @click="create"><template #icon><AppIcon name="plus" :size="15" /></template> Bidang</UiButton>
      </template>
    </AdminPageHeader>

    <div v-if="pending" class="space-y-2"><UiSkeleton v-for="i in 4" :key="i" class="h-16" /></div>

    <div v-else-if="data && data.length" class="space-y-2">
      <div v-for="f in data" :key="f.id" class="flex items-center gap-4 rounded-theme border border-line bg-surface p-4">
        <span class="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary"><AppIcon name="layers" :size="18" /></span>
        <div class="flex-1">
          <p class="font-medium">{{ f.name }} <span v-if="!f.isActive" class="ml-1 text-xs text-amber-600">(nonaktif)</span></p>
          <p class="line-clamp-1 text-xs text-ink-muted">{{ f.description || '—' }}</p>
        </div>
        <button class="p-1.5 text-ink-muted hover:text-primary" @click="edit(f)"><AppIcon name="edit" :size="15" /></button>
        <button class="p-1.5 text-ink-muted hover:text-red-500" @click="confirmId = f.id"><AppIcon name="trash" :size="15" /></button>
      </div>
    </div>

    <UiEmptyState v-else title="Belum ada bidang" message="Tambahkan bidang seperti Teknologi, Pendidikan, Kesehatan.">
      <UiButton size="sm" @click="create">Tambah Bidang</UiButton>
    </UiEmptyState>

    <UiModal v-model:open="showForm" :title="editing?.id ? 'Ubah Bidang' : 'Bidang Baru'">
      <div v-if="editing" class="space-y-4">
        <UiInput v-model="editing.name" label="Nama Bidang" required />
        <UiInput v-model="editing.slug" label="Slug (opsional)" hint="Dibuat otomatis bila kosong" />
        <UiTextarea v-model="editing.description" label="Deskripsi" rows="3" />
        <UiInput v-model="editing.image" label="URL Cover (opsional)" />
        <UiInput v-model.number="editing.displayOrder" label="Urutan Tampilan" type="number" />
        <UiToggle v-model="editing.isActive" label="Aktif" />
      </div>
      <template #footer>
        <div class="flex justify-end gap-2">
          <UiButton variant="ghost" @click="showForm = false">Batal</UiButton>
          <UiButton :loading="saving" @click="save">Simpan</UiButton>
        </div>
      </template>
    </UiModal>

    <UiConfirmDialog :open="!!confirmId" danger title="Hapus bidang" confirm-label="Hapus" @update:open="confirmId = null" @confirm="remove" />
  </div>
</template>
