<script setup lang="ts">
defineProps<{ title: string, phase: string, note?: string }>()
</script>

<template>
  <div>
    <AdminPageHeader :title="title" />
    <div class="rounded-theme border border-dashed border-line bg-surface p-10 text-center">
      <span class="mx-auto grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary">
        <AppIcon name="layers" :size="22" />
      </span>
      <h2 class="mt-4 font-heading text-lg font-semibold">Modul ini dijadwalkan pada {{ phase }}</h2>
      <p class="mx-auto mt-2 max-w-md text-sm text-ink-muted">
        {{ note || 'API dan skema database untuk modul ini sudah tersedia. Antarmuka admin mengikuti pola CRUD yang sama dengan modul Berita — lihat ROADMAP.md.' }}
      </p>
      <NuxtLink to="/admin" class="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
        <AppIcon name="arrowRight" :size="15" class="rotate-180" /> Kembali ke Dashboard
      </NuxtLink>
    </div>
  </div>
</template>
