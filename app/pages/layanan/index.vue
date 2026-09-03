<script setup lang="ts">
import { apiFetch } from '~/composables/useApi'

const { isEnabled } = useSiteConfig()
if (!isEnabled('enableDigitalServices')) {
  throw createError({ statusCode: 404, statusMessage: 'Modul layanan tidak aktif', fatal: true })
}

interface Service {
  id: string, name: string, slug: string, description: string, icon: string | null
  requirements: string[], estimatedDays: number | null, isOnline: boolean
}
const { data } = await useAsyncData('public-services', () => apiFetch<Service[]>('/api/public/services'))
useHead({ title: 'Layanan Desa' })
</script>

<template>
  <div>
    <PageHero
      title="Layanan Desa"
      subtitle="Informasi persyaratan dan pengajuan administrasi kependudukan secara digital."
      :breadcrumb="[{ label: 'Layanan' }]"
    />

    <div class="section container-app">
      <div v-if="data && data.length" class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div v-for="s in data" :key="s.id" class="flex flex-col rounded-theme border border-line bg-surface p-6 transition hover:shadow-lg">
          <span class="grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary">
            <AppIcon :name="s.icon || 'fileText'" :size="22" />
          </span>
          <h3 class="mt-4 font-heading text-lg font-semibold">{{ s.name }}</h3>
          <p class="mt-2 flex-1 text-sm text-ink-muted">{{ s.description }}</p>

          <div v-if="s.requirements.length" class="mt-4">
            <p class="text-xs font-semibold uppercase tracking-wide text-ink-muted">Persyaratan</p>
            <ul class="mt-2 space-y-1 text-sm text-ink-muted">
              <li v-for="(r, i) in s.requirements" :key="i" class="flex gap-2">
                <AppIcon name="check" :size="15" class="mt-0.5 shrink-0 text-primary" /> {{ r }}
              </li>
            </ul>
          </div>

          <div class="mt-4 flex items-center gap-3 text-xs text-ink-muted">
            <span v-if="s.estimatedDays" class="flex items-center gap-1"><AppIcon name="clock" :size="13" /> ± {{ s.estimatedDays }} hari kerja</span>
            <span v-if="s.isOnline" class="flex items-center gap-1 text-emerald-600"><AppIcon name="globe" :size="13" /> Bisa online</span>
          </div>
        </div>
      </div>

      <UiEmptyState v-else title="Belum ada layanan" message="Daftar layanan akan tampil di sini setelah dikonfigurasi admin." />
    </div>
  </div>
</template>
