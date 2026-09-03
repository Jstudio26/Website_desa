<script setup lang="ts">
import { apiFetch, ApiClientError } from '~/composables/useApi'
import type { Paginated } from '~~/shared/types/api'

definePageMeta({ layout: 'admin' })
const toast = useToast()

interface Row {
  id: string, title: string, slug: string, status: string, isFeatured: boolean
  publishedAt?: string, updatedAt: string
  category?: { name: string, color?: string } | null
}

const page = ref(1)
const q = ref('')
const status = ref<'all' | 'draft' | 'published' | 'archived'>('all')

const { data, pending, refresh } = await useAsyncData<Paginated<Row>>(
  'admin-news',
  () => apiFetch('/api/admin/news', { query: { page: page.value, pageSize: 15, q: q.value || undefined, status: status.value } }),
  { watch: [page, status] },
)
watchDebounced(q, () => { page.value = 1; refresh() }, { debounce: 400 })

const confirmId = ref<string | null>(null)
async function remove() {
  if (!confirmId.value) return
  try {
    await apiFetch(`/api/admin/news/${confirmId.value}`, { method: 'DELETE' })
    toast.success('Berita dihapus')
    refresh()
  }
  catch (e) { toast.error('Gagal', e instanceof ApiClientError ? e.message : '') }
  finally { confirmId.value = null }
}

const badge: Record<string, string> = {
  draft: 'bg-amber-100 text-amber-700', published: 'bg-emerald-100 text-emerald-700', archived: 'bg-zinc-100 text-zinc-600',
}
const fmt = (d?: string) => (d ? new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' }).format(new Date(d)) : '—')
useHead({ title: 'Berita' })
</script>

<template>
  <div>
    <AdminPageHeader title="Berita" description="Kelola artikel berita desa.">
      <template #actions>
        <UiButton to="/admin/news/new"><template #icon><AppIcon name="plus" :size="15" /></template> Berita Baru</UiButton>
      </template>
    </AdminPageHeader>

    <div class="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
      <label class="relative flex-1">
        <AppIcon name="search" :size="16" class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
        <input v-model="q" type="search" placeholder="Cari judul..." class="w-full rounded-theme border border-line bg-surface py-2 pl-9 pr-3 text-sm outline-none focus:border-primary">
      </label>
      <UiSelect
        v-model="status"
        :options="[{ label: 'Semua status', value: 'all' }, { label: 'Draft', value: 'draft' }, { label: 'Terbit', value: 'published' }, { label: 'Arsip', value: 'archived' }]"
      />
    </div>

    <div v-if="pending" class="space-y-2"><UiSkeleton v-for="i in 8" :key="i" class="h-14" /></div>

    <div v-else-if="data && data.items.length" class="overflow-hidden rounded-theme border border-line">
      <table class="w-full text-sm">
        <thead class="bg-surface-muted/50 text-left text-xs uppercase text-ink-muted">
          <tr>
            <th class="px-4 py-3 font-medium">Judul</th>
            <th class="px-4 py-3 font-medium">Kategori</th>
            <th class="px-4 py-3 font-medium">Status</th>
            <th class="px-4 py-3 font-medium">Terbit</th>
            <th class="px-4 py-3" />
          </tr>
        </thead>
        <tbody class="divide-y divide-line">
          <tr v-for="r in data.items" :key="r.id" class="hover:bg-surface-muted/30">
            <td class="px-4 py-3">
              <NuxtLink :to="`/admin/news/${r.id}`" class="font-medium text-ink hover:text-primary">{{ r.title }}</NuxtLink>
              <AppIcon v-if="r.isFeatured" name="sparkles" :size="13" class="ml-1 inline text-accent" />
              <p class="text-xs text-ink-muted">/{{ r.slug }}</p>
            </td>
            <td class="px-4 py-3 text-ink-muted">{{ r.category?.name || '—' }}</td>
            <td class="px-4 py-3">
              <span class="rounded-full px-2 py-0.5 text-xs font-medium capitalize" :class="badge[r.status]">{{ r.status }}</span>
            </td>
            <td class="px-4 py-3 text-ink-muted">{{ fmt(r.publishedAt) }}</td>
            <td class="px-4 py-3 text-right">
              <NuxtLink :to="`/admin/news/${r.id}`" class="inline-block p-1.5 text-ink-muted hover:text-primary"><AppIcon name="edit" :size="15" /></NuxtLink>
              <button class="p-1.5 text-ink-muted hover:text-red-500" @click="confirmId = r.id"><AppIcon name="trash" :size="15" /></button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <UiEmptyState v-else title="Belum ada berita" message="Mulai dengan membuat berita pertama.">
      <UiButton to="/admin/news/new" size="sm">Berita Baru</UiButton>
    </UiEmptyState>

    <div v-if="data && data.totalPages > 1" class="mt-6">
      <UiPagination :page="page" :total-pages="data.totalPages" @update:page="page = $event" />
    </div>

    <UiConfirmDialog :open="!!confirmId" danger title="Hapus berita" message="Tindakan ini tidak dapat dibatalkan." confirm-label="Hapus" @update:open="confirmId = null" @confirm="remove" />
  </div>
</template>
