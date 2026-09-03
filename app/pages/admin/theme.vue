<script setup lang="ts">
import { apiFetch, ApiClientError } from '~/composables/useApi'
import type { ThemeConfig } from '~~/shared/types/config'
import { THEME_PRESETS } from '~~/config/defaults'
import { hexToRgbChannels } from '~~/shared/utils/color'

definePageMeta({ layout: 'admin' })
const toast = useToast()
const { refresh: refreshConfig } = useSiteConfig()

const { data, pending } = await useAsyncData('admin-theme', () => apiFetch<ThemeConfig>('/api/admin/settings/theme'))
const form = ref<ThemeConfig | null>(null)
watch(data, (v) => { if (v) form.value = structuredClone(toRaw(v)) }, { immediate: true })

const saving = ref(false)
const errors = ref<Record<string, string[]>>({})

const colorFields: { key: keyof ThemeConfig['colors'], label: string }[] = [
  { key: 'primary', label: 'Primary' },
  { key: 'secondary', label: 'Secondary' },
  { key: 'accent', label: 'Accent' },
  { key: 'surface', label: 'Background' },
  { key: 'surfaceMuted', label: 'Background Muted' },
  { key: 'ink', label: 'Teks' },
  { key: 'inkMuted', label: 'Teks Muted' },
  { key: 'line', label: 'Garis / Border' },
]

// live preview vars for this page only
const previewStyle = computed(() => {
  if (!form.value) return {}
  const c = form.value.colors
  return {
    '--p': hexToRgbChannels(c.primary),
    '--s': hexToRgbChannels(c.secondary),
    '--a': hexToRgbChannels(c.accent),
    'fontFamily': form.value.typography.fontBody,
  } as Record<string, string>
})

function applyPreset(key: string) {
  if (!form.value) return
  const p = THEME_PRESETS[key]
  if (!p) return
  Object.assign(form.value.colors, { primary: p.primary, secondary: p.secondary, accent: p.accent })
}

async function save() {
  if (!form.value) return
  saving.value = true
  errors.value = {}
  try {
    await apiFetch('/api/admin/settings/theme', { method: 'PUT', body: form.value })
    await refreshConfig()
    toast.success('Tema tersimpan', 'Muat ulang situs publik untuk melihat perubahan penuh.')
  }
  catch (e) {
    if (e instanceof ApiClientError) { errors.value = e.fields ?? {}; toast.error('Gagal menyimpan', e.message) }
  }
  finally { saving.value = false }
}
</script>

<template>
  <div>
    <AdminPageHeader title="Tema Tampilan" description="Warna, tipografi, dan gaya komponen. Berubah tanpa perlu rebuild.">
      <template #actions><UiButton :loading="saving" @click="save">Simpan Tema</UiButton></template>
    </AdminPageHeader>

    <div v-if="pending || !form" class="space-y-4"><UiSkeleton v-for="i in 6" :key="i" class="h-12" /></div>

    <div v-else class="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div class="space-y-6">
        <UiCard>
          <h3 class="mb-3 font-heading font-semibold">Preset Cepat</h3>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="(p, key) in THEME_PRESETS"
              :key="key"
              class="flex items-center gap-2 rounded-theme border border-line px-3 py-2 text-sm hover:bg-surface-muted"
              @click="applyPreset(key)"
            >
              <span class="flex gap-0.5">
                <span class="h-4 w-4 rounded-sm" :style="{ background: p.primary }" />
                <span class="h-4 w-4 rounded-sm" :style="{ background: p.accent }" />
              </span>
              {{ p.label }}
            </button>
          </div>
        </UiCard>

        <UiCard>
          <h3 class="mb-4 font-heading font-semibold">Warna</h3>
          <div class="grid gap-4 sm:grid-cols-2">
            <label v-for="f in colorFields" :key="f.key" class="flex items-center justify-between gap-3 rounded-theme border border-line px-3 py-2">
              <span class="text-sm">{{ f.label }}</span>
              <span class="flex items-center gap-2">
                <input v-model="form.colors[f.key]" type="text" class="w-24 rounded border border-line px-2 py-1 text-xs font-mono">
                <input v-model="form.colors[f.key]" type="color" class="h-8 w-8 cursor-pointer rounded border border-line bg-transparent">
              </span>
            </label>
          </div>
        </UiCard>

        <UiCard>
          <h3 class="mb-4 font-heading font-semibold">Tipografi</h3>
          <div class="grid gap-4 sm:grid-cols-2">
            <UiInput v-model="form.typography.fontHeading" label="Font Heading (CSS family)" />
            <UiInput v-model="form.typography.fontBody" label="Font Body (CSS family)" />
            <UiInput v-model.number="form.typography.fontScale" label="Skala Font" type="number" hint="0.8 – 1.25" />
            <UiInput
              :model-value="form.typography.googleFonts.join(', ')"
              label="Google Fonts"
              hint="Pisahkan dengan koma, mis. Playfair Display:wght@600, Inter:wght@400;600"
              @update:model-value="form.typography.googleFonts = String($event).split(',').map((s) => s.trim()).filter(Boolean)"
            />
          </div>
        </UiCard>

        <UiCard>
          <h3 class="mb-4 font-heading font-semibold">Layout & Mode</h3>
          <div class="grid gap-4 sm:grid-cols-2">
            <UiInput v-model="form.layout.containerWidth" label="Lebar Container" hint="mis. 1200px" />
            <UiInput v-model="form.layout.radius" label="Border Radius" hint="mis. 0.75rem" />
            <UiSelect
              v-model="form.layout.buttonStyle"
              label="Gaya Tombol"
              :options="[{ label: 'Solid', value: 'solid' }, { label: 'Outline', value: 'outline' }, { label: 'Soft', value: 'soft' }, { label: 'Ghost', value: 'ghost' }]"
            />
            <UiSelect
              v-model="form.layout.cardStyle"
              label="Gaya Kartu"
              :options="[{ label: 'Raised', value: 'raised' }, { label: 'Bordered', value: 'bordered' }, { label: 'Flat', value: 'flat' }]"
            />
            <UiSelect
              v-model="form.mode"
              label="Mode Tema"
              :options="[{ label: 'Terang', value: 'light' }, { label: 'Gelap', value: 'dark' }, { label: 'Ikuti Sistem', value: 'system' }]"
            />
          </div>
        </UiCard>

        <UiCard>
          <h3 class="mb-4 font-heading font-semibold">Identitas Lokal</h3>
          <div class="grid gap-4 sm:grid-cols-2">
            <UiSelect
              v-model="form.identity.pattern"
              label="Pola Latar (Pattern)"
              :options="[{ label: 'Tidak ada', value: 'none' }, { label: 'Batik (titik)', value: 'batik' }]"
            />
            <UiInput v-model.number="form.identity.patternOpacity" label="Opasitas Pattern" type="number" hint="0 – 1" />
            <UiInput v-model="form.identity.ornamentImage" label="URL Ornamen" />
            <UiInput v-model="form.identity.heroAccentImage" label="URL Aksen Hero" />
          </div>
        </UiCard>
      </div>

      <!-- Live preview -->
      <div class="lg:sticky lg:top-24 lg:self-start">
        <UiCard :style="previewStyle">
          <p class="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-muted">Pratinjau</p>
          <div class="space-y-3 rounded-theme border border-line p-4" :style="{ background: form.colors.surface }">
            <p class="font-heading text-lg font-bold" :style="{ color: form.colors.ink, fontFamily: form.typography.fontHeading }">
              {{ 'Judul Contoh' }}
            </p>
            <p class="text-sm" :style="{ color: form.colors.inkMuted }">
              Paragraf pratinjau untuk melihat kombinasi warna dan tipografi tema.
            </p>
            <div class="flex gap-2">
              <span class="rounded-theme px-3 py-1.5 text-sm text-white" :style="{ background: form.colors.primary }">Primary</span>
              <span class="rounded-theme px-3 py-1.5 text-sm text-white" :style="{ background: form.colors.accent }">Accent</span>
            </div>
          </div>
        </UiCard>
      </div>
    </div>
  </div>
</template>
