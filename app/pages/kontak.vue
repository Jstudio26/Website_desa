<script setup lang="ts">
const { village } = useSiteConfig()
useHead({ title: 'Kontak' })

const info = computed(() => [
  { icon: 'mapPin', label: 'Alamat', value: village.value.contact.address },
  { icon: 'phone', label: 'Telepon', value: village.value.contact.phone, href: `tel:${village.value.contact.phone}` },
  { icon: 'mail', label: 'Email', value: village.value.contact.email, href: `mailto:${village.value.contact.email}` },
  { icon: 'whatsapp', label: 'WhatsApp', value: village.value.contact.whatsapp, href: `https://wa.me/${village.value.contact.whatsapp.replace(/\D/g, '')}` },
].filter((i) => i.value))
</script>

<template>
  <div>
    <PageHero title="Kontak" subtitle="Hubungi pemerintah desa untuk informasi, pengaduan, atau kerja sama." :breadcrumb="[{ label: 'Kontak' }]" />

    <div class="section container-app grid gap-10 lg:grid-cols-2">
      <div>
        <h2 class="font-heading text-2xl font-bold">Informasi Kontak</h2>
        <ul class="mt-6 space-y-4">
          <li v-for="i in info" :key="i.label" class="flex gap-4 rounded-theme border border-line bg-surface p-4">
            <span class="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
              <AppIcon :name="i.icon" :size="19" />
            </span>
            <div>
              <p class="text-xs uppercase tracking-wide text-ink-muted">{{ i.label }}</p>
              <a v-if="i.href" :href="i.href" class="font-medium text-ink hover:text-primary">{{ i.value }}</a>
              <p v-else class="font-medium text-ink">{{ i.value }}</p>
            </div>
          </li>
        </ul>

        <div v-if="village.contact.emergencyContacts.some((e) => e.number)" class="mt-6 rounded-theme border border-line bg-surface-muted/40 p-4">
          <p class="mb-2 text-sm font-semibold">Kontak Darurat</p>
          <ul class="space-y-1 text-sm text-ink-muted">
            <li v-for="(e, i) in village.contact.emergencyContacts.filter((x) => x.number)" :key="i">
              {{ e.label }}: <a :href="`tel:${e.number}`" class="font-medium text-ink hover:text-primary">{{ e.number }}</a>
            </li>
          </ul>
        </div>
      </div>

      <div class="overflow-hidden rounded-theme border border-line bg-surface-muted">
        <iframe
          v-if="village.contact.mapEmbedUrl"
          :src="village.contact.mapEmbedUrl"
          class="h-full min-h-[380px] w-full"
          loading="lazy"
          referrerpolicy="no-referrer-when-downgrade"
        />
        <div v-else class="grid h-full min-h-[380px] place-items-center text-sm text-ink-muted">
          Peta lokasi belum dikonfigurasi.
        </div>
      </div>
    </div>
  </div>
</template>
