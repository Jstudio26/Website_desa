<script setup lang="ts">
import type { Database } from '~/types/supabase'
import type { Official, SettingsData } from '~/types/database'
import { DEFAULT_SETTINGS } from '~/composables/useSettings'
import { formatNumber } from '~/utils/format'
import { AGE_BANDS, ageBandLabel } from '~/config/penduduk'

definePageMeta({ layout: 'admin' })

const supabase = useSupabaseClient<Database>()
const toast = useToast()
const { upload, remove: removeMedia } = useMedia()
const { refresh: refreshSettings } = useSettings()

// ---- Settings form -------------------------------------------------------
const form = reactive<SettingsData>({
  ...DEFAULT_SETTINGS,
  social: { ...DEFAULT_SETTINGS.social },
  demographics: { ...DEFAULT_SETTINGS.demographics },
})
const missionText = ref('')
const loading = ref(true)
const saving = ref(false)

const { data: loaded } = await useAsyncData('admin-settings', async () => {
  const { data } = await supabase.from('settings').select('data').eq('id', 1).maybeSingle()
  return (data?.data as Partial<SettingsData>) ?? {}
})
Object.assign(form, DEFAULT_SETTINGS, loaded.value, {
  social: { ...DEFAULT_SETTINGS.social, ...(loaded.value?.social ?? {}) },
  demographics: { ...DEFAULT_SETTINGS.demographics, ...(loaded.value?.demographics ?? {}) },
  // One editable row per band, so the inputs never write into a shared/missing object.
  ageDistribution: Object.fromEntries(AGE_BANDS.map((b) => [b, {
    male: loaded.value?.ageDistribution?.[b]?.male ?? null,
    female: loaded.value?.ageDistribution?.[b]?.female ?? null,
  }])),
})
missionText.value = (form.mission ?? []).join('\n')
loading.value = false

const ageTotals = computed(() => {
  let male = 0, female = 0
  for (const b of AGE_BANDS) {
    male += numOrNull(form.ageDistribution[b]?.male) ?? 0
    female += numOrNull(form.ageDistribution[b]?.female) ?? 0
  }
  return { male, female }
})
// Hint only, like genderMismatch: point out when the table and the totals above disagree.
const ageTotalsMismatch = computed(() => {
  const { male, female } = ageTotals.value
  if (!male && !female) return false
  const m = numOrNull(form.demographics.male)
  const f = numOrNull(form.demographics.female)
  return (m != null && m !== male) || (f != null && f !== female)
})

// Only a hint: the public chart uses laki-laki + perempuan as its own total.
const genderMismatch = computed(() => {
  const m = numOrNull(form.demographics.male)
  const f = numOrNull(form.demographics.female)
  const p = numOrNull(form.population)
  if (m == null || f == null || p == null || m + f === p) return null
  return { sum: m + f, population: p }
})

async function uploadTo(key: 'logoUrl' | 'heroImageUrl', e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  ;(e.target as HTMLInputElement).value = ''
  if (!file) return
  try {
    const old = form[key]
    // Logo hanya tampil ±32px (header/footer), jadi cukup 256px — file 512px PNG = ~130 KB per halaman.
    // Foto hero cukup 1920px (lebar layar terbesar); foto kamera/HP bisa >5 MB.
    form[key] = await upload(file, 'profil', { maxSize: key === 'logoUrl' ? 256 : 1920 })
    if (old) removeMedia(old)
  }
  catch (err) {
    toast.error('Gagal mengunggah', err instanceof Error ? err.message : '')
  }
}

async function saveSettings() {
  saving.value = true
  try {
    const payload: SettingsData = {
      ...form,
      mission: missionText.value.split('\n').map((s) => s.trim()).filter(Boolean),
      population: numOrNull(form.population),
      households: numOrNull(form.households),
      hamlets: numOrNull(form.hamlets),
      areaKm2: numOrNull(form.areaKm2),
      demographics: {
        male: numOrNull(form.demographics.male),
        female: numOrNull(form.demographics.female),
        balita0_11: numOrNull(form.demographics.balita0_11),
        balita1_2: numOrNull(form.demographics.balita1_2),
        balita2_3: numOrNull(form.demographics.balita2_3),
        balita3_4: numOrNull(form.demographics.balita3_4),
        balita4_5: numOrNull(form.demographics.balita4_5),
        ibuHamil: numOrNull(form.demographics.ibuHamil),
        lansia60_69: numOrNull(form.demographics.lansia60_69),
        lansia70_79: numOrNull(form.demographics.lansia70_79),
        lansia80Plus: numOrNull(form.demographics.lansia80Plus),
      },
      ageDistribution: Object.fromEntries(AGE_BANDS.map((b) => [b, {
        male: numOrNull(form.ageDistribution[b]?.male),
        female: numOrNull(form.ageDistribution[b]?.female),
      }])),
    }
    const { error } = await supabase
      .from('settings')
      .update({ data: payload, updated_at: new Date().toISOString() })
      .eq('id', 1)
    if (error) throw error
    await refreshSettings()
    toast.success('Profil kelurahan disimpan')
  }
  catch (e) {
    toast.error('Gagal menyimpan', e instanceof Error ? e.message : '')
  }
  finally {
    saving.value = false
  }
}
function numOrNull(v: unknown) {
  const n = Number(v)
  return v === '' || v == null || Number.isNaN(n) ? null : n
}

// ---- Officials ---------------------------------------------------------
const { data: officials, refresh: refreshOfficials } = await useAsyncData('admin-officials', async () => {
  const { data } = await supabase.from('officials').select('*').order('display_order').order('created_at')
  return (data ?? []) as Official[]
})

const modalOpen = ref(false)
const editing = ref<Official | null>(null)
const oForm = reactive({ name: '', position: '', photo_url: '' as string | null, display_order: 0 })

function newOfficial() {
  editing.value = null
  Object.assign(oForm, { name: '', position: '', photo_url: null, display_order: (officials.value?.length ?? 0) })
  modalOpen.value = true
}
function editOfficial(o: Official) {
  editing.value = o
  Object.assign(oForm, { name: o.name, position: o.position, photo_url: o.photo_url, display_order: o.display_order })
  modalOpen.value = true
}
async function onOfficialPhoto(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  ;(e.target as HTMLInputElement).value = ''
  if (!file) return
  try {
    oForm.photo_url = await upload(file, 'perangkat')
  }
  catch (err) {
    toast.error('Gagal mengunggah', err instanceof Error ? err.message : '')
  }
}
async function saveOfficial() {
  if (!oForm.name.trim() || !oForm.position.trim()) {
    toast.error('Nama dan jabatan wajib diisi')
    return
  }
  const row = {
    name: oForm.name.trim(),
    position: oForm.position.trim(),
    photo_url: oForm.photo_url || null,
    display_order: Number(oForm.display_order) || 0,
  }
  const { error } = editing.value
    ? await supabase.from('officials').update(row).eq('id', editing.value.id)
    : await supabase.from('officials').insert(row)
  if (error) { toast.error('Gagal menyimpan', error.message); return }
  toast.success('Tersimpan')
  modalOpen.value = false
  refreshOfficials()
}

const confirmId = ref<string | null>(null)
async function removeOfficial() {
  const o = officials.value?.find((x) => x.id === confirmId.value)
  if (!o) return
  const { error } = await supabase.from('officials').delete().eq('id', o.id)
  if (error) { toast.error('Gagal menghapus', error.message); confirmId.value = null; return }
  if (o.photo_url) removeMedia(o.photo_url)
  toast.success('Dihapus')
  confirmId.value = null
  refreshOfficials()
}

useHead({ title: 'Profil Kelurahan' })
</script>

<template>
  <div>
    <AdminPageHeader title="Profil Kelurahan" description="Identitas, kontak, dan data kelurahan.">
      <template #actions>
        <UiButton :loading="saving" @click="saveSettings">Simpan Profil</UiButton>
      </template>
    </AdminPageHeader>

    <div v-if="loading" class="space-y-4">
      <UiSkeleton class="h-40" /><UiSkeleton class="h-40" />
    </div>

    <div v-else class="space-y-6">
      <!-- Identitas -->
      <section class="rounded-theme border border-line bg-surface p-5 sm:p-6">
        <h2 class="font-heading text-lg font-semibold">Identitas</h2>
        <div class="mt-4 grid gap-4 sm:grid-cols-2">
          <UiInput v-model="form.villageName" label="Nama Kelurahan" required />
          <UiInput v-model="form.tagline" label="Tagline" />
          <div class="sm:col-span-2">
            <UiTextarea v-model="form.shortDescription" label="Deskripsi singkat" :rows="2" />
          </div>
          <UiInput v-model="form.district" label="Kecamatan" />
          <UiInput v-model="form.regency" label="Kabupaten" />
          <UiInput v-model="form.province" label="Provinsi" />
          <UiInput v-model="form.address" label="Alamat kantor kelurahan" />
        </div>

        <div class="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <span class="mb-1.5 block text-sm font-medium text-ink">Logo</span>
            <div class="flex items-center gap-3">
              <img v-if="form.logoUrl" :src="form.logoUrl" alt="" class="h-16 w-16 rounded-theme border border-line object-contain">
              <label class="cursor-pointer rounded-theme border border-dashed border-line px-4 py-3 text-sm text-ink-muted hover:bg-surface-muted">
                Pilih file
                <input type="file" accept="image/*" class="hidden" @change="(e) => uploadTo('logoUrl', e)">
              </label>
              <button v-if="form.logoUrl" class="text-sm text-red-500 hover:underline" @click="form.logoUrl = ''">Hapus</button>
            </div>
          </div>
          <div>
            <span class="mb-1.5 block text-sm font-medium text-ink">Gambar hero (beranda)</span>
            <div class="flex items-center gap-3">
              <img v-if="form.heroImageUrl" :src="form.heroImageUrl" alt="" class="h-16 w-28 rounded-theme border border-line object-cover">
              <label class="cursor-pointer rounded-theme border border-dashed border-line px-4 py-3 text-sm text-ink-muted hover:bg-surface-muted">
                Pilih file
                <input type="file" accept="image/*" class="hidden" @change="(e) => uploadTo('heroImageUrl', e)">
              </label>
              <button v-if="form.heroImageUrl" class="text-sm text-red-500 hover:underline" @click="form.heroImageUrl = ''">Hapus</button>
            </div>
          </div>
        </div>
      </section>

      <!-- Kontak & sosial -->
      <section class="rounded-theme border border-line bg-surface p-5 sm:p-6">
        <h2 class="font-heading text-lg font-semibold">Kontak & Media Sosial</h2>
        <div class="mt-4 grid gap-4 sm:grid-cols-2">
          <UiInput v-model="form.phone" label="Telepon" />
          <UiInput v-model="form.email" label="Email" type="email" />
          <UiInput v-model="form.whatsapp" label="WhatsApp" hint="Nomor, mis. 6281234567890" />
          <UiInput v-model="form.mapEmbedUrl" label="URL Embed Peta (Google Maps)" hint="Bagikan → Sematkan peta → salin src iframe." />
          <div class="sm:col-span-2">
            <UiTextarea
              v-model="form.officeHours"
              label="Jam Pelayanan"
              :rows="3"
              placeholder="Senin–Kamis: 08.00–15.00&#10;Jumat: 08.00–11.30&#10;Sabtu, Minggu & hari libur: tutup"
              hint="Satu baris per hari/rentang. Tampil di halaman Kontak, Layanan Surat, dan Cek Status."
            />
          </div>
          <UiInput v-model="form.social.instagram" label="Instagram (URL)" />
          <UiInput v-model="form.social.facebook" label="Facebook (URL)" />
          <UiInput v-model="form.social.youtube" label="YouTube (URL)" />
          <UiInput v-model="form.social.tiktok" label="TikTok (URL)" />
        </div>
      </section>

      <!-- Data kelurahan -->
      <section class="rounded-theme border border-line bg-surface p-5 sm:p-6">
        <h2 class="font-heading text-lg font-semibold">Data Kelurahan</h2>
        <div class="mt-4 grid gap-4 sm:grid-cols-4">
          <UiInput v-model="form.population" label="Jumlah penduduk" type="number" />
          <UiInput v-model="form.households" label="Kepala keluarga" type="number" />
          <UiInput v-model="form.hamlets" label="Jumlah lingkungan" type="number" />
          <UiInput v-model="form.areaKm2" label="Luas wilayah (km²)" type="number" />
        </div>
      </section>

      <!-- Data kependudukan -->
      <section class="rounded-theme border border-line bg-surface p-5 sm:p-6">
        <h2 class="font-heading text-lg font-semibold">Data Kependudukan</h2>
        <p class="mt-1 text-sm text-ink-muted">Rincian jumlah penduduk menurut jenis kelamin dan kelompok umur.</p>

        <p class="mt-4 text-xs font-semibold uppercase tracking-wide text-ink-muted">Jenis Kelamin</p>
        <div class="mt-2 grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
          <UiInput v-model="form.demographics.male" label="Laki-laki" type="number" />
          <UiInput v-model="form.demographics.female" label="Perempuan" type="number" />
        </div>
        <p
          v-if="genderMismatch"
          class="mt-2 text-xs text-ink-muted"
        >
          Laki-laki + perempuan = {{ formatNumber(genderMismatch.sum) }}, berbeda dari jumlah penduduk ({{ formatNumber(genderMismatch.population) }}).
        </p>

        <p class="mt-6 text-xs font-semibold uppercase tracking-wide text-ink-muted">Balita</p>
        <div class="mt-2 grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
          <UiInput v-model="form.demographics.balita0_11" label="0 - 11 bulan" type="number" />
          <UiInput v-model="form.demographics.balita1_2" label="1 - 2 tahun" type="number" />
          <UiInput v-model="form.demographics.balita2_3" label="2 - 3 tahun" type="number" />
          <UiInput v-model="form.demographics.balita3_4" label="3 - 4 tahun" type="number" />
          <UiInput v-model="form.demographics.balita4_5" label="4 - 5 tahun" type="number" />
        </div>

        <p class="mt-6 text-xs font-semibold uppercase tracking-wide text-ink-muted">Ibu Hamil</p>
        <div class="mt-2 grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
          <UiInput v-model="form.demographics.ibuHamil" label="Jumlah ibu hamil" type="number" />
        </div>

        <p class="mt-6 text-xs font-semibold uppercase tracking-wide text-ink-muted">Lansia</p>
        <div class="mt-2 grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
          <UiInput v-model="form.demographics.lansia60_69" label="60 - 69 tahun" type="number" />
          <UiInput v-model="form.demographics.lansia70_79" label="70 - 79 tahun" type="number" />
          <UiInput v-model="form.demographics.lansia80Plus" label="80 tahun ke atas" type="number" />
        </div>

        <p class="mt-6 text-xs font-semibold uppercase tracking-wide text-ink-muted">Persebaran Umur (Piramida Penduduk)</p>
        <p class="mt-1 text-xs text-ink-muted">Jumlah penduduk per kelompok umur lima tahunan. Kosongkan jika belum ada data.</p>
        <div class="mt-2 max-w-xl overflow-hidden rounded-theme border border-line">
          <table class="w-full text-sm">
            <thead class="bg-surface-muted text-left text-xs text-ink-muted">
              <tr>
                <th scope="col" class="px-3 py-2 font-semibold">Kelompok Umur</th>
                <th scope="col" class="px-3 py-2 font-semibold">Laki-laki</th>
                <th scope="col" class="px-3 py-2 font-semibold">Perempuan</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-line">
              <tr v-for="b in AGE_BANDS" :key="b">
                <th scope="row" class="whitespace-nowrap px-3 py-1.5 text-left font-medium text-ink">{{ ageBandLabel(b) }}</th>
                <td v-for="sex in (['male', 'female'] as const)" :key="sex" class="px-3 py-1.5">
                  <input
                    v-model="form.ageDistribution[b]![sex]"
                    type="number"
                    min="0"
                    :aria-label="`${sex === 'male' ? 'Laki-laki' : 'Perempuan'}, ${ageBandLabel(b)}`"
                    class="w-full rounded-md border border-line bg-surface px-2.5 py-1.5 text-sm tabular-nums text-ink outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                  >
                </td>
              </tr>
            </tbody>
            <tfoot class="border-t border-line bg-surface-muted/60 font-semibold tabular-nums">
              <tr>
                <th scope="row" class="px-3 py-2 text-left">Total</th>
                <td class="px-3 py-2">{{ formatNumber(ageTotals.male) }}</td>
                <td class="px-3 py-2">{{ formatNumber(ageTotals.female) }}</td>
              </tr>
            </tfoot>
          </table>
        </div>
        <p v-if="ageTotalsMismatch" class="mt-2 text-xs text-ink-muted">
          Total tabel berbeda dari isian Laki-laki / Perempuan di atas. Periksa kembali agar diagram konsisten.
        </p>
      </section>

      <!-- Visi misi -->
      <section class="rounded-theme border border-line bg-surface p-5 sm:p-6">
        <h2 class="font-heading text-lg font-semibold">Visi & Misi</h2>
        <div class="mt-4 space-y-4">
          <UiTextarea v-model="form.vision" label="Visi" :rows="2" />
          <UiTextarea v-model="missionText" label="Misi" :rows="4" hint="Satu poin misi per baris." />
        </div>
      </section>

      <!-- Sejarah -->
      <section class="rounded-theme border border-line bg-surface p-5 sm:p-6">
        <h2 class="font-heading text-lg font-semibold">Sejarah Kelurahan</h2>
        <div class="mt-4">
          <RichTextEditor v-model="form.history" folder="profil" />
        </div>
      </section>

      <!-- Perangkat kelurahan -->
      <section class="rounded-theme border border-line bg-surface p-5 sm:p-6">
        <div class="flex items-center justify-between">
          <h2 class="font-heading text-lg font-semibold">Perangkat Kelurahan</h2>
          <UiButton size="sm" variant="outline" @click="newOfficial">
            <template #icon><AppIcon name="plus" :size="14" /></template> Tambah
          </UiButton>
        </div>

        <div v-if="officials && officials.length" class="mt-4 divide-y divide-line">
          <div v-for="o in officials" :key="o.id" class="flex items-center gap-3 py-3">
            <div class="h-11 w-11 shrink-0 overflow-hidden rounded-full bg-surface-muted">
              <img v-if="o.photo_url" :src="o.photo_url" alt="" class="h-full w-full object-cover">
              <span v-else class="grid h-full place-items-center text-ink-muted/50"><AppIcon name="user" :size="18" /></span>
            </div>
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-medium text-ink">{{ o.name }}</p>
              <p class="truncate text-xs text-ink-muted">{{ o.position }}</p>
            </div>
            <button class="p-1.5 text-ink-muted hover:text-primary" @click="editOfficial(o)"><AppIcon name="edit" :size="15" /></button>
            <button class="p-1.5 text-ink-muted hover:text-red-500" @click="confirmId = o.id"><AppIcon name="trash" :size="15" /></button>
          </div>
        </div>
        <p v-else class="mt-4 text-sm text-ink-muted">Belum ada data perangkat kelurahan.</p>
      </section>
    </div>

    <UiModal v-model:open="modalOpen" :title="editing ? 'Ubah Perangkat' : 'Tambah Perangkat'" size="md">
      <div class="space-y-4">
        <div class="flex items-center gap-3">
          <div class="h-16 w-16 shrink-0 overflow-hidden rounded-full bg-surface-muted">
            <img v-if="oForm.photo_url" :src="oForm.photo_url" alt="" class="h-full w-full object-cover">
            <span v-else class="grid h-full place-items-center text-ink-muted/50"><AppIcon name="user" :size="22" /></span>
          </div>
          <label class="cursor-pointer rounded-theme border border-dashed border-line px-4 py-2 text-sm text-ink-muted hover:bg-surface-muted">
            Foto
            <input type="file" accept="image/*" class="hidden" @change="onOfficialPhoto">
          </label>
        </div>
        <UiInput v-model="oForm.name" label="Nama" required />
        <UiInput v-model="oForm.position" label="Jabatan" required />
        <UiInput v-model="oForm.display_order" label="Urutan" type="number" />
      </div>
      <template #footer>
        <div class="flex justify-end gap-2">
          <UiButton variant="ghost" size="sm" @click="modalOpen = false">Batal</UiButton>
          <UiButton size="sm" @click="saveOfficial">Simpan</UiButton>
        </div>
      </template>
    </UiModal>

    <UiConfirmDialog
      :open="!!confirmId"
      danger
      title="Hapus perangkat"
      message="Data akan dihapus permanen."
      confirm-label="Hapus"
      @update:open="confirmId = null"
      @confirm="removeOfficial"
    />
  </div>
</template>
