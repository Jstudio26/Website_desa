<script setup lang="ts">
import type { Database } from '~/types/supabase'
import type { CommunityGroup, CommunityGroupMember } from '~/types/database'

definePageMeta({ layout: 'admin' })

const supabase = useSupabaseClient<Database>()
const toast = useToast()

// ---- Groups --------------------------------------------------------------
const { data: groups, refresh: refreshGroups } = await useAsyncData('admin-community-groups', async () => {
  const { data, error } = await supabase
    .from('community_groups')
    .select('*')
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: true })
  if (error) throw error
  return (data ?? []) as CommunityGroup[]
})

const categories = computed(() => {
  const list = groups.value ?? []
  const order: string[] = []
  const byCategory = new Map<string, CommunityGroup[]>()
  for (const g of list) {
    if (!byCategory.has(g.category)) {
      byCategory.set(g.category, [])
      order.push(g.category)
    }
    byCategory.get(g.category)!.push(g)
  }
  return order.map((category) => ({ category, groups: byCategory.get(category)! }))
})

const groupModalOpen = ref(false)
const editingGroup = ref<CommunityGroup | null>(null)
const gForm = reactive({ category: '', name: '', description: '', display_order: 0 })

function newGroup() {
  editingGroup.value = null
  Object.assign(gForm, { category: '', name: '', description: '', display_order: groups.value?.length ?? 0 })
  groupModalOpen.value = true
}
function editGroup(g: CommunityGroup) {
  editingGroup.value = g
  Object.assign(gForm, { category: g.category, name: g.name, description: g.description ?? '', display_order: g.display_order })
  groupModalOpen.value = true
}
async function saveGroup() {
  if (!gForm.category.trim() || !gForm.name.trim()) {
    toast.error('Kategori dan nama unit wajib diisi')
    return
  }
  const row = {
    category: gForm.category.trim(),
    name: gForm.name.trim(),
    description: gForm.description.trim() || null,
    display_order: Number(gForm.display_order) || 0,
  }
  const { error } = editingGroup.value
    ? await supabase.from('community_groups').update(row).eq('id', editingGroup.value.id)
    : await supabase.from('community_groups').insert(row)
  if (error) { toast.error('Gagal menyimpan', error.message); return }
  toast.success('Tersimpan')
  groupModalOpen.value = false
  refreshGroups()
}

const confirmGroupId = ref<string | null>(null)
async function removeGroup() {
  if (!confirmGroupId.value) return
  const { error } = await supabase.from('community_groups').delete().eq('id', confirmGroupId.value)
  if (error) { toast.error('Gagal menghapus', error.message); confirmGroupId.value = null; return }
  toast.success('Unit dihapus')
  confirmGroupId.value = null
  refreshGroups()
}

// ---- Members ---------------------------------------------------------
const membersModalOpen = ref(false)
const activeGroup = ref<CommunityGroup | null>(null)
const members = ref<CommunityGroupMember[]>([])
const membersLoading = ref(false)

async function openMembers(g: CommunityGroup) {
  activeGroup.value = g
  membersModalOpen.value = true
  membersLoading.value = true
  try {
    const { data, error } = await supabase
      .from('community_group_members')
      .select('*')
      .eq('group_id', g.id)
      .order('display_order', { ascending: true })
    if (error) throw error
    members.value = (data ?? []) as CommunityGroupMember[]
  }
  catch (err) {
    toast.error('Gagal memuat anggota', err instanceof Error ? err.message : '')
  }
  finally {
    membersLoading.value = false
  }
}

const memberModalOpen = ref(false)
const editingMember = ref<CommunityGroupMember | null>(null)
const mForm = reactive({ name: '', role: '', note: '', display_order: 0 })

function newMember() {
  editingMember.value = null
  Object.assign(mForm, { name: '', role: '', note: '', display_order: members.value.length })
  memberModalOpen.value = true
}
function editMember(m: CommunityGroupMember) {
  editingMember.value = m
  Object.assign(mForm, { name: m.name, role: m.role, note: m.note ?? '', display_order: m.display_order })
  memberModalOpen.value = true
}
async function saveMember() {
  if (!activeGroup.value) return
  if (!mForm.name.trim() || !mForm.role.trim()) {
    toast.error('Nama dan peran wajib diisi')
    return
  }
  const row = {
    group_id: activeGroup.value.id,
    name: mForm.name.trim(),
    role: mForm.role.trim(),
    note: mForm.note.trim() || null,
    display_order: Number(mForm.display_order) || 0,
  }
  const { error } = editingMember.value
    ? await supabase.from('community_group_members').update(row).eq('id', editingMember.value.id)
    : await supabase.from('community_group_members').insert(row)
  if (error) { toast.error('Gagal menyimpan', error.message); return }
  toast.success('Tersimpan')
  memberModalOpen.value = false
  openMembers(activeGroup.value)
}

const confirmMemberId = ref<string | null>(null)
async function removeMember() {
  if (!confirmMemberId.value || !activeGroup.value) return
  const { error } = await supabase.from('community_group_members').delete().eq('id', confirmMemberId.value)
  if (error) { toast.error('Gagal menghapus', error.message); confirmMemberId.value = null; return }
  toast.success('Anggota dihapus')
  confirmMemberId.value = null
  openMembers(activeGroup.value)
}

useHead({ title: 'Organisasi Kemasyarakatan' })
</script>

<template>
  <div>
    <AdminPageHeader title="Organisasi Kemasyarakatan" description="Kelola unit organisasi (PIK-R, BKB, BKR, BKL, POKJA KB, UPPKS, PKK) dan pengurusnya.">
      <template #actions>
        <UiButton size="sm" @click="newGroup">
          <template #icon><AppIcon name="plus" :size="14" /></template> Tambah Unit
        </UiButton>
      </template>
    </AdminPageHeader>

    <div v-if="categories.length" class="space-y-8">
      <section v-for="c in categories" :key="c.category" class="rounded-theme border border-line bg-surface p-5 sm:p-6">
        <h2 class="font-heading text-lg font-semibold">{{ c.category }}</h2>
        <div class="mt-4 divide-y divide-line">
          <div v-for="g in c.groups" :key="g.id" class="flex flex-wrap items-center gap-3 py-3">
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-medium text-ink">{{ g.name }}</p>
              <p v-if="g.description" class="truncate text-xs text-ink-muted">{{ g.description }}</p>
            </div>
            <UiButton variant="outline" size="sm" @click="openMembers(g)">
              <template #icon><AppIcon name="users" :size="14" /></template> Anggota
            </UiButton>
            <button class="p-1.5 text-ink-muted hover:text-primary" @click="editGroup(g)"><AppIcon name="edit" :size="15" /></button>
            <button class="p-1.5 text-ink-muted hover:text-red-500" @click="confirmGroupId = g.id"><AppIcon name="trash" :size="15" /></button>
          </div>
        </div>
      </section>
    </div>
    <UiEmptyState v-else title="Belum ada unit organisasi" message="Tambahkan unit pertama, mis. PIK-R atau BKB." />

    <!-- Modal: tambah/ubah unit -->
    <UiModal v-model:open="groupModalOpen" :title="editingGroup ? 'Ubah Unit' : 'Tambah Unit'" size="md">
      <div class="space-y-4">
        <UiInput v-model="gForm.category" label="Kategori" required hint="Mis. Kampung KB, PKK." />
        <UiInput v-model="gForm.name" label="Nama Unit" required />
        <UiTextarea v-model="gForm.description" label="Deskripsi" :rows="2" />
        <UiInput v-model="gForm.display_order" label="Urutan" type="number" />
      </div>
      <template #footer>
        <div class="flex justify-end gap-2">
          <UiButton variant="ghost" size="sm" @click="groupModalOpen = false">Batal</UiButton>
          <UiButton size="sm" @click="saveGroup">Simpan</UiButton>
        </div>
      </template>
    </UiModal>

    <UiConfirmDialog
      :open="!!confirmGroupId"
      danger
      title="Hapus unit"
      message="Unit beserta seluruh anggotanya akan dihapus permanen."
      confirm-label="Hapus"
      @update:open="confirmGroupId = null"
      @confirm="removeGroup"
    />

    <!-- Modal: kelola anggota -->
    <UiModal v-model:open="membersModalOpen" :title="activeGroup ? `Anggota — ${activeGroup.name}` : 'Anggota'" size="lg">
      <div class="flex items-center justify-between">
        <p class="text-sm text-ink-muted">Kelola pengurus dan anggota unit ini.</p>
        <UiButton size="sm" variant="outline" @click="newMember">
          <template #icon><AppIcon name="plus" :size="14" /></template> Tambah Anggota
        </UiButton>
      </div>

      <div v-if="membersLoading" class="mt-4 space-y-2">
        <UiSkeleton class="h-12" /><UiSkeleton class="h-12" />
      </div>
      <div v-else-if="members.length" class="mt-4 divide-y divide-line">
        <div v-for="m in members" :key="m.id" class="flex items-center gap-3 py-3">
          <div class="min-w-0 flex-1">
            <p class="truncate text-sm font-medium text-ink">{{ m.name }}</p>
            <p class="truncate text-xs text-ink-muted">{{ m.role }}<span v-if="m.note"> · {{ m.note }}</span></p>
          </div>
          <button class="p-1.5 text-ink-muted hover:text-primary" @click="editMember(m)"><AppIcon name="edit" :size="15" /></button>
          <button class="p-1.5 text-ink-muted hover:text-red-500" @click="confirmMemberId = m.id"><AppIcon name="trash" :size="15" /></button>
        </div>
      </div>
      <p v-else class="mt-4 text-sm text-ink-muted">Belum ada anggota.</p>
    </UiModal>

    <!-- Modal: tambah/ubah anggota -->
    <UiModal v-model:open="memberModalOpen" :title="editingMember ? 'Ubah Anggota' : 'Tambah Anggota'" size="sm">
      <div class="space-y-4">
        <UiInput v-model="mForm.name" label="Nama" required />
        <UiInput v-model="mForm.role" label="Peran" required hint="Mis. Ketua, Sekretaris, Bendahara, Anggota." />
        <UiInput v-model="mForm.note" label="Keterangan" hint="Mis. Konselor Sebaya, Seksi Agama." />
        <UiInput v-model="mForm.display_order" label="Urutan" type="number" />
      </div>
      <template #footer>
        <div class="flex justify-end gap-2">
          <UiButton variant="ghost" size="sm" @click="memberModalOpen = false">Batal</UiButton>
          <UiButton size="sm" @click="saveMember">Simpan</UiButton>
        </div>
      </template>
    </UiModal>

    <UiConfirmDialog
      :open="!!confirmMemberId"
      danger
      title="Hapus anggota"
      message="Anggota akan dihapus permanen."
      confirm-label="Hapus"
      @update:open="confirmMemberId = null"
      @confirm="removeMember"
    />
  </div>
</template>
