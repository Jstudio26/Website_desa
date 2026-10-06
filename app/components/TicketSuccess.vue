<script setup lang="ts">
/** Shown after a public form is sent: the ticket code the citizen needs for "Cek Status". */
const props = defineProps<{ code: string, title: string, message: string }>()
const emit = defineEmits<{ again: [] }>()

const copied = ref(false)
async function copy() {
  try {
    await navigator.clipboard.writeText(props.code)
    copied.value = true
    setTimeout(() => (copied.value = false), 2000)
  }
  catch {
    // Clipboard blocked (e.g. insecure context) — the code stays visible to copy by hand.
  }
}
</script>

<template>
  <div class="text-center" role="status">
    <span class="mx-auto grid h-14 w-14 place-items-center rounded-full bg-primary/10 text-primary">
      <AppIcon name="check" :size="26" />
    </span>
    <h2 class="mt-4 font-heading text-2xl font-extrabold">{{ title }}</h2>
    <p class="mx-auto mt-2 max-w-sm text-sm text-ink-muted">{{ message }}</p>

    <div class="mx-auto mt-6 max-w-xs rounded-theme border-2 border-dashed border-primary/40 bg-primary/5 px-4 py-4">
      <p class="text-xs font-semibold uppercase tracking-wide text-ink-muted">Kode tiket Anda</p>
      <p class="mt-1 select-all font-heading text-3xl font-extrabold tracking-wider text-primary">{{ code }}</p>
      <button type="button" class="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline" @click="copy">
        <AppIcon :name="copied ? 'check' : 'file'" :size="14" /> {{ copied ? 'Tersalin' : 'Salin kode' }}
      </button>
    </div>
    <p class="mx-auto mt-3 max-w-sm text-xs text-ink-muted">
      Simpan atau foto kode ini. Gunakan untuk mengecek perkembangan kapan saja.
    </p>

    <div class="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
      <UiButton :to="`/cek-status?kode=${code}`">
        <template #icon><AppIcon name="search" :size="16" /></template> Cek Status
      </UiButton>
      <UiButton variant="outline" @click="emit('again')">Kirim yang lain</UiButton>
    </div>
  </div>
</template>
