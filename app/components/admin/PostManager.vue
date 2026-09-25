<script setup lang="ts">
import type { Database } from '~/types/supabase'
import type { Post, PostType } from '~/types/database'
import { formatDate } from '~/utils/format'

const props = defineProps<{ type: PostType, label: string }>()

const supabase = useSupabaseClient<Database>()
const toast = useToast()

const q = ref('')
const status = ref<'all' | 'published' | 'draft'>('all')
const debounced = refDebounced(q, 300)

const { data, pending, refresh } = await useAsyncData(
  `admin-posts-${props.type}`,
  async () => {
    let query = supabase
      .from('posts')
      .select('id,title,slug,published,published_at,updated_at')
      .eq('type', props.type)
      .order('updated_at', { ascending: false })
    if (status.value === 'published') query = query.eq('published', true)
    if (status.value === 'draft') query = query.eq('published', false)
    if (debounced.value.trim()) query = query.ilike('title', `%${debounced.value.trim()}%`)
    const { data, error } = await query
    if (error) throw error
    return (data ?? []) as Post[]
  },
  { watch: [status, debounced] },
)

const confirmId = ref<string | null>(null)
const deleting = ref(false)

async function remove() {
  if (!confirmId.value) return
  deleting.value = true
  try {
    const { error } = await supabase.from('posts').delete().eq('id', confirmId.value)
    if (error) throw error
    toast.success(`${props.label} dihapus`)
    refresh()
  }
  catch (e) {
    toast.error('Gagal menghapus', e instanceof Error ? e.message : '')
  }
  finally {
    deleting.value = false
    confirmId.value = null
  }
}

useHead({ title: props.label })
</script>

<template>
  <div>
    <AdminPageHeader :title="label" :description="`Kelola ${label.toLowerCase()} kelurahan.`">
      <template #actions>
        <UiButton :to="`/admin/${type}/new`">
          <template #icon><AppIcon name="plus" :size="15" /></template>
          {{ label }} Baru
        </UiButton>
      </template>
    </AdminPageHeader>

    <div class="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
      <label class="relative flex-1">
        <AppIcon name="search" :size="16" class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
        <input v-model="q" type="search" placeholder="Cari judul…" class="w-full rounded-theme border border-line bg-surface py-2 pl-9 pr-3 text-sm outline-none focus:border-primary">
      </label>
      <UiSelect
        v-model="status"
        :options="[
          { label: 'Semua status', value: 'all' },
          { label: 'Terbit', value: 'published' },
          { label: 'Draft', value: 'draft' },
        ]"
      />
    </div>

    <div v-if="pending" class="space-y-2">
      <UiSkeleton v-for="i in 6" :key="i" class="h-14" />
    </div>

    <div v-else-if="data && data.length" class="overflow-hidden rounded-theme border border-line">
      <table class="w-full text-sm">
        <thead class="bg-surface-muted/50 text-left text-xs uppercase text-ink-muted">
          <tr>
            <th class="px-4 py-3 font-medium">Judul</th>
            <th class="px-4 py-3 font-medium">Status</th>
            <th class="px-4 py-3 font-medium">Diperbarui</th>
            <th class="px-4 py-3" />
          </tr>
        </thead>
        <tbody class="divide-y divide-line">
          <tr v-for="r in data" :key="r.id" class="hover:bg-surface-muted/30">
            <td class="px-4 py-3">
              <NuxtLink :to="`/admin/${type}/${r.id}`" class="font-medium text-ink hover:text-primary">{{ r.title }}</NuxtLink>
              <p class="text-xs text-ink-muted">/{{ r.slug }}</p>
            </td>
            <td class="px-4 py-3">
              <span
                class="rounded-full px-2 py-0.5 text-xs font-medium"
                :class="r.published ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'"
              >
                {{ r.published ? 'Terbit' : 'Draft' }}
              </span>
            </td>
            <td class="px-4 py-3 text-ink-muted">{{ formatDate(r.updated_at) }}</td>
            <td class="px-4 py-3 text-right">
              <NuxtLink :to="`/admin/${type}/${r.id}`" class="inline-block p-1.5 text-ink-muted hover:text-primary">
                <AppIcon name="edit" :size="15" />
              </NuxtLink>
              <button class="p-1.5 text-ink-muted hover:text-red-500" @click="confirmId = r.id">
                <AppIcon name="trash" :size="15" />
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <UiEmptyState v-else :title="`Belum ada ${label.toLowerCase()}`" :message="`Mulai dengan membuat ${label.toLowerCase()} pertama.`">
      <UiButton :to="`/admin/${type}/new`" size="sm">{{ label }} Baru</UiButton>
    </UiEmptyState>

    <UiConfirmDialog
      :open="!!confirmId"
      danger
      :title="`Hapus ${label.toLowerCase()}`"
      message="Tindakan ini tidak dapat dibatalkan."
      confirm-label="Hapus"
      :loading="deleting"
      @update:open="confirmId = null"
      @confirm="remove"
    />
  </div>
</template>
