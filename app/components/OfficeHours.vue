<script setup lang="ts">
/** Jam pelayanan + kontak cepat kantor kelurahan. Hidden until admin fills hours or a phone/WA. */
const { settings } = useSettings()

const hours = computed(() => settings.value.officeHours.split('\n').map((l) => l.trim()).filter(Boolean))
const wa = computed(() => settings.value.whatsapp.replace(/\D/g, ''))
const visible = computed(() => hours.value.length || settings.value.phone || wa.value)
</script>

<template>
  <div v-if="visible" class="rounded-theme border border-line/80 bg-surface p-5 shadow-card">
    <h2 class="flex items-center gap-2 font-heading text-lg font-bold">
      <AppIcon name="clock" :size="18" class="text-primary" /> Jam Pelayanan Kantor
    </h2>
    <ul v-if="hours.length" class="mt-3 space-y-1 text-sm text-ink">
      <li v-for="h in hours" :key="h">{{ h }}</li>
    </ul>
    <p v-if="settings.address" class="mt-3 text-sm text-ink-muted">{{ settings.address }}</p>
    <div v-if="settings.phone || wa" class="mt-4 flex flex-wrap gap-2">
      <UiButton v-if="wa" size="sm" :href="`https://wa.me/${wa}`" target="_blank" rel="noopener">
        <template #icon><AppIcon name="whatsapp" :size="15" /></template> WhatsApp
      </UiButton>
      <UiButton v-if="settings.phone" size="sm" variant="outline" :href="`tel:${settings.phone}`">
        <template #icon><AppIcon name="phone" :size="15" /></template> {{ settings.phone }}
      </UiButton>
    </div>
  </div>
</template>
