<script setup lang="ts">
import { defaultSectionSettings } from '~~/shared/types/sections'

const { village, isEnabled } = useSiteConfig()

if (!isEnabled('enableKKTDeveloperPage')) {
  throw createError({ statusCode: 404, statusMessage: 'Halaman tidak ditemukan', fatal: true })
}

const section = {
  id: 'kkt',
  type: 'kktTeam' as const,
  visible: true,
  order: 0,
  data: {},
  settings: { ...defaultSectionSettings(), container: 'wide' as const, spacing: 'lg' as const },
}

useHead({
  title: 'Tim Pengembang',
  meta: [
    {
      name: 'description',
      content: `Tim mahasiswa KKT yang mengembangkan Sistem Informasi Desa ${village.value.villageName}.`,
    },
  ],
})
</script>

<template>
  <div class="bg-surface">
    <div class="section">
      <SectionsShell :settings="section.settings">
        <SectionsKktTeam :section="section" :ctx="{}" />
      </SectionsShell>
    </div>
  </div>
</template>
