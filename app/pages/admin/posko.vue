<script setup lang="ts">
import type { Database } from '~/types/supabase'
import type { PoskoInfo, PoskoPerson, PoskoProgram, ProgramStatus } from '~/types/database'
import { POSKO_POSITIONS } from '~/config/posko'
import { patchSettings, withPoskoDefaults } from '~/composables/useSettings'

definePageMeta({ layout: 'admin' })

const supabase = useSupabaseClient<Database>()
const toast = useToast()
const { remove: removeMedia } = useMedia()
const { settings, refresh: refreshSettings } = useSettings()

const posko = computed(() => withPoskoDefaults(settings.value.posko))

/** Save one part of the posko object, merged into the freshly stored version. */
async function savePosko(part: Partial<PoskoInfo>) {
  await patchSettings(supabase, (cur) => ({ posko: { ...withPoskoDefaults(cur.posko), ...part } }))
  await refreshSettings()
}

// ---- Informasi posko -----------------------------------------------------
// Filled once: re-syncing on every settings refresh would wipe unsaved edits here
// whenever someone in the structure or a program is saved.
const { title, university, period, intro } = posko.value
const info = reactive({ title, university, period, intro })
const savingInfo = ref(false)
async function saveInfo() {
  if (!info.title.trim()) { toast.error('Nama posko wajib diisi'); return }
  savingInfo.value = true
  try {
    await savePosko({
      title: info.title.trim(),
      university: info.university.trim(),
      period: info.period.trim(),
      intro: info.intro.trim(),
    })
    toast.success('Informasi posko disimpan')
  }
  catch (err) {
    toast.error('Gagal menyimpan', err instanceof Error ? err.message : '')
  }
  finally {
    savingInfo.value = false
  }
}

// ---- Struktur organisasi ------------------------------------------------
type Position = typeof POSKO_POSITIONS[number]
const peopleOf = (key: string) => (posko.value.structure[key] ?? []).filter((p) => p?.name)
const filledCount = computed(() => POSKO_POSITIONS.reduce((n, pos) => n + Math.min(peopleOf(pos.key).length, pos.capacity), 0))
const totalSlots = POSKO_POSITIONS.reduce((n, pos) => n + pos.capacity, 0)

const personOpen = ref(false)
const personPosition = ref<Position | null>(null)
const personId = ref<string | null>(null)
const personForm = reactive({ name: '', detail: '' })
const photo = useDraftImage('posko')
const savingPerson = ref(false)

function openPerson(pos: Position, person?: PoskoPerson) {
  personPosition.value = pos
  personId.value = person?.id ?? null
  Object.assign(personForm, { name: person?.name ?? '', detail: person?.detail ?? '' })
  photo.start(person?.photoUrl ?? '')
  personOpen.value = true
}
function cancelPerson() {
  photo.discard()
  personOpen.value = false
}
async function savePerson() {
  const pos = personPosition.value
  if (!pos) return
  if (!personForm.name.trim()) { toast.error('Nama wajib diisi'); return }
  const current = peopleOf(pos.key)
  if (!personId.value && current.length >= pos.capacity) {
    toast.error(`${pos.label} sudah penuh (${pos.capacity} orang)`)
    return
  }
  savingPerson.value = true
  try {
    const row: PoskoPerson = {
      id: personId.value ?? crypto.randomUUID(),
      name: personForm.name.trim(),
      detail: personForm.detail.trim(),
      photoUrl: photo.url.value,
    }
    const list = personId.value ? current.map((p) => (p.id === personId.value ? row : p)) : [...current, row]
    await savePosko({ structure: { ...posko.value.structure, [pos.key]: list } })
    photo.commit()
    toast.success('Tersimpan')
    personOpen.value = false
  }
  catch (err) {
    toast.error('Gagal menyimpan', err instanceof Error ? err.message : '')
  }
  finally {
    savingPerson.value = false
  }
}

// ---- Program kerja -------------------------------------------------------
const STATUS_OPTIONS: { value: ProgramStatus, label: string }[] = [
  { value: 'rencana', label: 'Rencana' },
  { value: 'berjalan', label: 'Berjalan' },
  { value: 'selesai', label: 'Selesai' },
]
const statusLabel = (s: ProgramStatus) => STATUS_OPTIONS.find((o) => o.value === s)?.label ?? s

const programOpen = ref(false)
const programId = ref<string | null>(null)
const programForm = reactive({ title: '', description: '', status: 'rencana' as ProgramStatus })
const savingProgram = ref(false)

function openProgram(p?: PoskoProgram) {
  programId.value = p?.id ?? null
  Object.assign(programForm, { title: p?.title ?? '', description: p?.description ?? '', status: p?.status ?? 'rencana' })
  programOpen.value = true
}
async function saveProgram() {
  if (!programForm.title.trim()) { toast.error('Nama program wajib diisi'); return }
  savingProgram.value = true
  try {
    const row: PoskoProgram = {
      id: programId.value ?? crypto.randomUUID(),
      title: programForm.title.trim(),
      description: programForm.description.trim(),
      status: programForm.status,
    }
    const list = programId.value
      ? posko.value.programs.map((p) => (p.id === programId.value ? row : p))
      : [...posko.value.programs, row]
    await savePosko({ programs: list })
    toast.success('Program kerja disimpan')
    programOpen.value = false
  }
  catch (err) {
    toast.error('Gagal menyimpan', err instanceof Error ? err.message : '')
  }
  finally {
    savingProgram.value = false
  }
}

// ---- Hapus (orang di struktur / program) --------------------------------
const confirmDelete = ref<{ kind: 'person' | 'program', id: string, position?: string } | null>(null)
async function removeConfirmed() {
  const target = confirmDelete.value
  confirmDelete.value = null
  if (!target) return
  try {
    if (target.kind === 'person' && target.position) {
      const key = target.position
      const person = peopleOf(key).find((p) => p.id === target.id)
      await savePosko({ structure: { ...posko.value.structure, [key]: peopleOf(key).filter((p) => p.id !== target.id) } })
      removeMedia(person?.photoUrl)
    }
    else {
      await savePosko({ programs: posko.value.programs.filter((p) => p.id !== target.id) })
    }
    toast.success('Dihapus')
  }
  catch (err) {
    toast.error('Gagal menghapus', err instanceof Error ? err.message : '')
  }
}

useHead({ title: 'Posko KKT' })
</script>

<template>
  <div>
    <AdminPageHeader title="Posko KKT" description="Kelola halaman Posko KKT: informasi posko, anggota, dan program kerja.">
      <template #actions>
        <UiButton size="sm" variant="outline" to="/posko-kkt">
          <template #icon><AppIcon name="eye" :size="14" /></template> Lihat Halaman
        </UiButton>
      </template>
    </AdminPageHeader>

    <div class="space-y-6">
      <!-- Informasi -->
      <section class="rounded-theme border border-line bg-surface p-5 sm:p-6">
        <div class="flex flex-col gap-5 sm:flex-row">
          <img src="/images/logo-kkt149-matani3.webp" alt="Logo posko" class="h-28 w-28 shrink-0 self-center object-contain sm:self-start">
          <div class="min-w-0 flex-1 space-y-4">
            <h2 class="font-heading text-lg font-semibold">Informasi Posko</h2>
            <div class="grid gap-4 sm:grid-cols-2">
              <UiInput v-model="info.title" label="Nama posko" required />
              <UiInput v-model="info.university" label="Perguruan tinggi" />
              <UiInput v-model="info.period" label="Periode" placeholder="Mis. Juli – Agustus 2026" />
            </div>
            <UiTextarea v-model="info.intro" label="Tentang posko" :rows="5" />
            <UiButton size="sm" :loading="savingInfo" @click="saveInfo">Simpan Informasi</UiButton>
          </div>
        </div>
      </section>

      <!-- Struktur organisasi -->
      <section class="rounded-theme border border-line bg-surface p-5 sm:p-6">
        <h2 class="font-heading text-lg font-semibold">Struktur Organisasi ({{ filledCount }}/{{ totalSlots }})</h2>
        <p class="mt-1 text-sm text-ink-muted">Isi setiap jabatan beserta fotonya. Hanya jabatan yang sudah diisi yang tampil di halaman publik.</p>
        <div class="mt-4 grid gap-4 md:grid-cols-2">
          <div v-for="pos in POSKO_POSITIONS" :key="pos.key" class="rounded-theme border border-line">
            <div class="flex items-center justify-between gap-2 border-b border-line bg-surface-muted/60 px-4 py-2.5">
              <p class="text-sm font-semibold text-ink">{{ pos.label }}</p>
              <span class="text-xs tabular-nums text-ink-muted">{{ peopleOf(pos.key).length }}/{{ pos.capacity }}</span>
            </div>
            <div class="divide-y divide-line">
              <div v-for="p in peopleOf(pos.key)" :key="p.id" class="flex items-center gap-3 px-4 py-2.5">
                <div class="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-primary/10">
                  <img v-if="p.photoUrl" :src="p.photoUrl" alt="" class="h-full w-full object-cover">
                  <div v-else class="grid h-full place-items-center text-primary"><AppIcon name="user" :size="18" /></div>
                </div>
                <div class="min-w-0 flex-1">
                  <p class="truncate text-sm font-medium text-ink">{{ p.name }}</p>
                  <p class="truncate text-xs text-ink-muted">{{ p.detail || (p.photoUrl ? '' : 'Belum ada foto') }}</p>
                </div>
                <button class="p-1.5 text-ink-muted hover:text-primary" aria-label="Ubah" @click="openPerson(pos, p)"><AppIcon name="edit" :size="15" /></button>
                <button class="p-1.5 text-ink-muted hover:text-red-500" aria-label="Hapus" @click="confirmDelete = { kind: 'person', id: p.id, position: pos.key }"><AppIcon name="trash" :size="15" /></button>
              </div>
              <button
                v-for="n in Math.max(0, pos.capacity - peopleOf(pos.key).length)"
                :key="`empty-${n}`"
                type="button"
                class="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-ink-muted transition hover:bg-surface-muted hover:text-primary"
                @click="openPerson(pos)"
              >
                <span class="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-dashed border-line"><AppIcon name="plus" :size="16" /></span>
                Isi {{ pos.capacity > 1 ? `anggota ke-${peopleOf(pos.key).length + n}` : 'jabatan ini' }}
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- Program kerja -->
      <section class="rounded-theme border border-line bg-surface p-5 sm:p-6">
        <div class="flex items-center justify-between gap-3">
          <h2 class="font-heading text-lg font-semibold">Program Kerja ({{ posko.programs.length }})</h2>
          <UiButton variant="outline" size="sm" @click="openProgram()">
            <template #icon><AppIcon name="plus" :size="14" /></template> Tambah Program
          </UiButton>
        </div>
        <div v-if="posko.programs.length" class="mt-4 divide-y divide-line">
          <div v-for="p in posko.programs" :key="p.id" class="flex items-center gap-3 py-3">
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-medium text-ink">{{ p.title }}</p>
              <p class="truncate text-xs text-ink-muted">{{ p.description || 'Tanpa deskripsi' }}</p>
            </div>
            <UiBadge :tone="p.status === 'selesai' ? 'solid' : 'soft'">{{ statusLabel(p.status) }}</UiBadge>
            <button class="p-1.5 text-ink-muted hover:text-primary" aria-label="Ubah" @click="openProgram(p)"><AppIcon name="edit" :size="15" /></button>
            <button class="p-1.5 text-ink-muted hover:text-red-500" aria-label="Hapus" @click="confirmDelete = { kind: 'program', id: p.id }"><AppIcon name="trash" :size="15" /></button>
          </div>
        </div>
        <p v-else class="mt-4 text-sm text-ink-muted">Belum ada program kerja.</p>
      </section>
    </div>

    <!-- Modal orang di struktur -->
    <UiModal :open="personOpen" :title="personPosition ? `${personId ? 'Ubah' : 'Isi'}: ${personPosition.label}` : 'Struktur'" size="md" @update:open="(v: boolean) => { if (!v) cancelPerson() }">
      <div class="space-y-4">
        <UiInput v-model="personForm.name" label="Nama lengkap (beserta gelar)" required />
        <UiInput
          v-model="personForm.detail"
          label="Keterangan"
          :placeholder="personPosition && personPosition.tier < 3 ? 'Mis. Fakultas / NIP' : 'Mis. Program studi / Fakultas'"
        />
        <div>
          <span class="mb-1.5 block text-sm font-medium text-ink">Foto</span>
          <div class="flex items-center gap-3">
            <img v-if="photo.url.value" :src="photo.url.value" alt="" class="h-20 w-20 rounded-theme border border-line object-cover">
            <label class="cursor-pointer rounded-theme border border-dashed border-line px-4 py-3 text-sm text-ink-muted hover:bg-surface-muted">
              {{ photo.uploading.value ? 'Mengunggah…' : photo.url.value ? 'Ganti foto' : 'Pilih foto' }}
              <input type="file" accept="image/*" class="hidden" :disabled="photo.uploading.value" @change="photo.pick">
            </label>
            <button v-if="photo.url.value" type="button" class="text-sm text-red-500 hover:underline" @click="photo.clear">Hapus</button>
          </div>
          <p class="mt-1.5 text-xs text-ink-muted">Disarankan foto persegi (1:1), maksimal 5 MB.</p>
        </div>
      </div>
      <template #footer>
        <div class="flex justify-end gap-2">
          <UiButton variant="ghost" size="sm" @click="cancelPerson">Batal</UiButton>
          <UiButton size="sm" :loading="savingPerson" :disabled="photo.uploading.value" @click="savePerson">Simpan</UiButton>
        </div>
      </template>
    </UiModal>

    <!-- Modal program -->
    <UiModal v-model:open="programOpen" :title="programId ? 'Ubah Program Kerja' : 'Tambah Program Kerja'" size="md">
      <div class="space-y-4">
        <UiInput v-model="programForm.title" label="Nama program" required />
        <UiSelect v-model="programForm.status" label="Status" required :options="STATUS_OPTIONS" />
        <UiTextarea v-model="programForm.description" label="Deskripsi" :rows="4" />
      </div>
      <template #footer>
        <div class="flex justify-end gap-2">
          <UiButton variant="ghost" size="sm" @click="programOpen = false">Batal</UiButton>
          <UiButton size="sm" :loading="savingProgram" @click="saveProgram">Simpan</UiButton>
        </div>
      </template>
    </UiModal>

    <UiConfirmDialog
      :open="!!confirmDelete"
      danger
      :title="confirmDelete?.kind === 'person' ? 'Hapus dari struktur' : 'Hapus program kerja'"
      message="Data ini akan dihapus permanen."
      confirm-label="Hapus"
      @update:open="confirmDelete = null"
      @confirm="removeConfirmed"
    />
  </div>
</template>
