<script setup lang="ts">
import { apiFetch, ApiClientError } from '~/composables/useApi'

definePageMeta({ layout: 'admin' })
const toast = useToast()
const { refresh: refreshConfig } = useSiteConfig()

interface Item {
  id: string, menuId: string, parentId: string | null, label: string, url: string
  icon: string | null, target: string, visible: boolean, order: number
}
interface Menu { id: string, name: string, location: string, items: Item[] }

const { data, refresh, pending } = await useAsyncData('admin-menus', () => apiFetch<Menu[]>('/api/admin/menus'))

const activeMenuId = ref<string>('')
watch(data, (v) => { if (v?.length && !activeMenuId.value) activeMenuId.value = v[0]!.id }, { immediate: true })
const activeMenu = computed(() => data.value?.find((m) => m.id === activeMenuId.value) ?? null)

const tree = computed(() => {
  const items = activeMenu.value?.items ?? []
  const roots = items.filter((i) => !i.parentId).sort((a, b) => a.order - b.order)
  return roots.map((r) => ({ ...r, children: items.filter((i) => i.parentId === r.id).sort((a, b) => a.order - b.order) }))
})

const showForm = ref(false)
const editing = ref<Partial<Item> | null>(null)

function newItem(parentId: string | null = null) {
  editing.value = { menuId: activeMenuId.value, parentId, label: '', url: '/', target: '_self', visible: true, order: 999 }
  showForm.value = true
}
function editItem(it: Item) {
  editing.value = { ...it }
  showForm.value = true
}

const saving = ref(false)
async function saveItem() {
  if (!editing.value) return
  saving.value = true
  try {
    if (editing.value.id) {
      await apiFetch(`/api/admin/menus/items/${editing.value.id}`, { method: 'PUT', body: editing.value })
    }
    else {
      await apiFetch('/api/admin/menus/items', { method: 'POST', body: editing.value })
    }
    showForm.value = false
    await refresh()
    await refreshConfig()
    toast.success('Menu tersimpan')
  }
  catch (e) { toast.error('Gagal', e instanceof ApiClientError ? e.message : '') }
  finally { saving.value = false }
}

const confirmId = ref<string | null>(null)
async function removeItem() {
  if (!confirmId.value) return
  try {
    await apiFetch(`/api/admin/menus/items/${confirmId.value}`, { method: 'DELETE' })
    await refresh(); await refreshConfig()
    toast.success('Item menu dihapus')
  }
  catch (e) { toast.error('Gagal', e instanceof ApiClientError ? e.message : '') }
  finally { confirmId.value = null }
}

async function move(list: Item[], idx: number, dir: -1 | 1) {
  const target = idx + dir
  if (target < 0 || target >= list.length) return
  const reordered = [...list]
  const [m] = reordered.splice(idx, 1)
  reordered.splice(target, 0, m!)
  await apiFetch('/api/admin/menus/reorder', {
    method: 'PUT',
    body: { items: reordered.map((it, i) => ({ id: it.id, parentId: it.parentId, order: i })) },
  })
  await refresh(); await refreshConfig()
}
</script>

<template>
  <div>
    <AdminPageHeader title="Navigasi" description="Menu tidak di-hardcode. Susun label, URL, urutan, dan dropdown di sini.">
      <template #actions>
        <UiButton @click="newItem(null)"><template #icon><AppIcon name="plus" :size="15" /></template> Item Menu</UiButton>
      </template>
    </AdminPageHeader>

    <div v-if="pending" class="space-y-3"><UiSkeleton v-for="i in 5" :key="i" class="h-12" /></div>

    <div v-else>
      <div class="mb-5 flex gap-2">
        <button
          v-for="m in data"
          :key="m.id"
          class="rounded-theme border px-3 py-1.5 text-sm capitalize"
          :class="activeMenuId === m.id ? 'border-primary bg-primary text-white' : 'border-line hover:bg-surface-muted'"
          @click="activeMenuId = m.id"
        >
          {{ m.name }} <span class="opacity-60">({{ m.location }})</span>
        </button>
      </div>

      <div class="space-y-2">
        <div v-for="(root, ri) in tree" :key="root.id" class="rounded-theme border border-line bg-surface">
          <div class="flex items-center gap-2 p-3">
            <div class="flex flex-col">
              <button class="text-ink-muted hover:text-ink disabled:opacity-30" :disabled="ri === 0" @click="move(tree, ri, -1)"><AppIcon name="chevronDown" :size="14" class="rotate-180" /></button>
              <button class="text-ink-muted hover:text-ink disabled:opacity-30" :disabled="ri === tree.length - 1" @click="move(tree, ri, 1)"><AppIcon name="chevronDown" :size="14" /></button>
            </div>
            <div class="flex-1">
              <p class="text-sm font-medium">{{ root.label }} <span v-if="!root.visible" class="ml-1 text-xs text-amber-600">(disembunyikan)</span></p>
              <p class="text-xs text-ink-muted">{{ root.url }}</p>
            </div>
            <UiButton size="sm" variant="ghost" @click="newItem(root.id)">+ Sub</UiButton>
            <button class="p-1.5 text-ink-muted hover:text-primary" @click="editItem(root)"><AppIcon name="edit" :size="15" /></button>
            <button class="p-1.5 text-ink-muted hover:text-red-500" @click="confirmId = root.id"><AppIcon name="trash" :size="15" /></button>
          </div>
          <div v-if="root.children.length" class="border-t border-line bg-surface-muted/30 px-3 py-2">
            <div v-for="(child, ci) in root.children" :key="child.id" class="flex items-center gap-2 py-1.5">
              <div class="flex flex-col">
                <button class="text-ink-muted hover:text-ink disabled:opacity-30" :disabled="ci === 0" @click="move(root.children, ci, -1)"><AppIcon name="chevronDown" :size="12" class="rotate-180" /></button>
                <button class="text-ink-muted hover:text-ink disabled:opacity-30" :disabled="ci === root.children.length - 1" @click="move(root.children, ci, 1)"><AppIcon name="chevronDown" :size="12" /></button>
              </div>
              <span class="flex-1 text-sm">{{ child.label }} <span class="text-xs text-ink-muted">— {{ child.url }}</span></span>
              <button class="p-1 text-ink-muted hover:text-primary" @click="editItem(child)"><AppIcon name="edit" :size="14" /></button>
              <button class="p-1 text-ink-muted hover:text-red-500" @click="confirmId = child.id"><AppIcon name="trash" :size="14" /></button>
            </div>
          </div>
        </div>
        <UiEmptyState v-if="!tree.length" title="Menu kosong" message="Tambahkan item menu pertama." />
      </div>
    </div>

    <UiModal v-model:open="showForm" :title="editing?.id ? 'Ubah Item Menu' : 'Item Menu Baru'">
      <div v-if="editing" class="space-y-4">
        <UiInput v-model="editing.label" label="Label" required />
        <UiInput v-model="editing.url" label="URL" required hint="mis. /profil atau https://..." />
        <UiInput v-model="editing.icon" label="Ikon (opsional)" />
        <UiSelect v-model="editing.target" label="Target" :options="[{ label: 'Tab yang sama', value: '_self' }, { label: 'Tab baru', value: '_blank' }]" />
        <UiToggle v-model="editing.visible" label="Tampilkan di navigasi" />
      </div>
      <template #footer>
        <div class="flex justify-end gap-2">
          <UiButton variant="ghost" @click="showForm = false">Batal</UiButton>
          <UiButton :loading="saving" @click="saveItem">Simpan</UiButton>
        </div>
      </template>
    </UiModal>

    <UiConfirmDialog
      :open="!!confirmId"
      danger
      title="Hapus item menu"
      message="Sub-menu di bawahnya akan dinaikkan ke level atas."
      confirm-label="Hapus"
      @update:open="confirmId = null"
      @confirm="removeItem"
    />
  </div>
</template>
