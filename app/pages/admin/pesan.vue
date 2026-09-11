<script setup lang="ts">
import type { Database } from '~/types/supabase'
import type { Message } from '~/types/database'
import { formatDate } from '~/utils/format'

definePageMeta({ layout: 'admin' })

const supabase = useSupabaseClient<Database>()
const toast = useToast()

const { data: items, pending, refresh } = await useAsyncData('admin-pesan', async () => {
  const { data, error } = await supabase.from('messages').select('*').order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as Message[]
})

const active = ref<Message | null>(null)
const open = ref(false)

async function view(m: Message) {
  active.value = m
  open.value = true
  if (!m.is_read) await setRead(m, true)
}

async function setRead(m: Message, value: boolean) {
  const { error } = await supabase.from('messages').update({ is_read: value }).eq('id', m.id)
  if (error) { toast.error('Gagal memperbarui', error.message); return }
  m.is_read = value
}

const confirmId = ref<string | null>(null)
async function remove() {
  if (!confirmId.value) return
  const { error } = await supabase.from('messages').delete().eq('id', confirmId.value)
  if (error) { toast.error('Gagal menghapus', error.message); confirmId.value = null; return }
  toast.success('Pesan dihapus')
  if (active.value?.id === confirmId.value) open.value = false
  confirmId.value = null
  refresh()
}

useHead({ title: 'Pesan Masuk' })
</script>

<template>
  <div>
    <AdminPageHeader title="Pesan Masuk" description="Pesan dari form kontak publik." />

    <div v-if="pending" class="space-y-2">
      <UiSkeleton v-for="i in 6" :key="i" class="h-16" />
    </div>

    <div v-else-if="items && items.length" class="overflow-hidden rounded-theme border border-line">
      <ul class="divide-y divide-line">
        <li
          v-for="m in items"
          :key="m.id"
          class="flex items-start gap-3 px-4 py-3 transition hover:bg-surface-muted/40"
          :class="m.is_read ? '' : 'bg-primary/[0.04]'"
        >
          <span class="mt-1.5 h-2 w-2 shrink-0 rounded-full" :class="m.is_read ? 'bg-line' : 'bg-primary'" />
          <button class="min-w-0 flex-1 text-left" @click="view(m)">
            <p class="text-sm font-medium text-ink">
              {{ m.name }}
              <span class="font-normal text-ink-muted">· {{ formatDate(m.created_at, 'long') }}</span>
            </p>
            <p class="mt-0.5 line-clamp-1 text-sm text-ink-muted">{{ m.message }}</p>
            <p v-if="m.email || m.phone" class="mt-0.5 text-xs text-ink-muted">
              {{ [m.email, m.phone].filter(Boolean).join(' · ') }}
            </p>
          </button>
          <div class="flex shrink-0 items-center gap-1">
            <button
              class="p-1.5 text-ink-muted hover:text-primary"
              :title="m.is_read ? 'Tandai belum dibaca' : 'Tandai sudah dibaca'"
              @click="setRead(m, !m.is_read)"
            >
              <AppIcon :name="m.is_read ? 'mail' : 'check'" :size="15" />
            </button>
            <button class="p-1.5 text-ink-muted hover:text-red-500" @click="confirmId = m.id">
              <AppIcon name="trash" :size="15" />
            </button>
          </div>
        </li>
      </ul>
    </div>

    <UiEmptyState v-else title="Belum ada pesan" message="Pesan dari halaman kontak akan muncul di sini." />

    <UiModal v-model:open="open" :title="active?.name || 'Pesan'" size="md">
      <div v-if="active" class="space-y-3 text-sm">
        <p class="text-ink-muted">{{ formatDate(active.created_at, 'long') }}</p>
        <div class="flex flex-wrap gap-4">
          <a v-if="active.email" :href="`mailto:${active.email}`" class="text-primary hover:underline">{{ active.email }}</a>
          <a v-if="active.phone" :href="`tel:${active.phone}`" class="text-primary hover:underline">{{ active.phone }}</a>
        </div>
        <p class="whitespace-pre-wrap rounded-theme bg-surface-muted/50 p-4 text-ink">{{ active.message }}</p>
      </div>
      <template #footer>
        <div class="flex justify-end gap-2">
          <UiButton variant="danger" size="sm" @click="confirmId = active?.id ?? null">Hapus</UiButton>
          <UiButton variant="ghost" size="sm" @click="open = false">Tutup</UiButton>
        </div>
      </template>
    </UiModal>

    <UiConfirmDialog
      :open="!!confirmId"
      danger
      title="Hapus pesan"
      message="Pesan akan dihapus permanen."
      confirm-label="Hapus"
      @update:open="confirmId = null"
      @confirm="remove"
    />
  </div>
</template>
