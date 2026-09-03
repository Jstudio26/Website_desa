<script setup lang="ts">
const props = defineProps<{
  title?: string
  message?: string
  confirmLabel?: string
  danger?: boolean
  loading?: boolean
}>()
const open = defineModel<boolean>('open', { default: false })
const emit = defineEmits<{ confirm: [] }>()
void props
</script>

<template>
  <UiModal v-model:open="open" :title="title || 'Konfirmasi'" size="sm">
    <p class="text-sm text-ink-muted">{{ message || 'Apakah Anda yakin ingin melanjutkan tindakan ini?' }}</p>
    <template #footer>
      <div class="flex justify-end gap-2">
        <UiButton variant="ghost" size="sm" @click="open = false">Batal</UiButton>
        <UiButton
          :variant="danger ? 'danger' : 'primary'"
          size="sm"
          :loading="loading"
          @click="emit('confirm')"
        >
          {{ confirmLabel || 'Ya, lanjutkan' }}
        </UiButton>
      </div>
    </template>
  </UiModal>
</template>
