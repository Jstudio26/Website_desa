<script setup lang="ts">
import type { Database } from '~/types/supabase'
import type { Post, PostType } from '~/types/database'
import { slugify } from '~/utils/format'

const props = defineProps<{ type: PostType, label: string }>()

const supabase = useSupabaseClient<Database>()
const route = useRoute()
const router = useRouter()
const toast = useToast()
const { upload, remove: removeMedia } = useMedia()

const id = computed(() => String(route.params.id))
const isNew = computed(() => id.value === 'new')

const form = reactive({
  title: '',
  slug: '',
  excerpt: '',
  content: '',
  cover_url: '' as string | null,
  published: false,
})
const slugTouched = ref(false)
const originalPublished = ref(false)
const loading = ref(!isNew.value)
const saving = ref(false)
const uploadingCover = ref(false)
const errors = reactive<Record<string, string>>({})

if (!isNew.value) {
  const { data, error } = await supabase.from('posts').select('*').eq('id', id.value).maybeSingle()
  if (error || !data) {
    throw createError({ statusCode: 404, statusMessage: `${props.label} tidak ditemukan`, fatal: true })
  }
  const p = data as Post
  Object.assign(form, {
    title: p.title,
    slug: p.slug,
    excerpt: p.excerpt ?? '',
    content: p.content ?? '',
    cover_url: p.cover_url,
    published: p.published,
  })
  originalPublished.value = p.published
  slugTouched.value = true
  loading.value = false
}

watch(() => form.title, (t) => {
  if (!slugTouched.value) form.slug = slugify(t)
})

async function onCover(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  ;(e.target as HTMLInputElement).value = ''
  if (!file) return
  uploadingCover.value = true
  try {
    form.cover_url = await upload(file, props.type)
  }
  catch (err) {
    toast.error('Gagal mengunggah', err instanceof Error ? err.message : '')
  }
  finally {
    uploadingCover.value = false
  }
}

function clearCover() {
  removeMedia(form.cover_url)
  form.cover_url = null
}

function validate() {
  errors.title = form.title.trim() ? '' : 'Judul wajib diisi.'
  errors.slug = form.slug.trim() ? '' : 'Slug wajib diisi.'
  return !errors.title && !errors.slug
}

async function save(thenView = false) {
  if (!validate()) return
  saving.value = true
  try {
    const now = new Date().toISOString()
    const slug = slugify(form.slug)
    const payload: Partial<Post> = {
      type: props.type,
      title: form.title.trim(),
      slug,
      excerpt: form.excerpt.trim() || null,
      content: form.content || null,
      cover_url: form.cover_url || null,
      published: form.published,
      updated_at: now,
    }
    // set published_at the first time it goes live; keep the original date after
    if (form.published && !(!isNew.value && originalPublished.value)) payload.published_at = now
    if (!form.published) payload.published_at = null

    if (isNew.value) {
      const { error } = await supabase.from('posts').insert(payload)
      if (error) throw error
    }
    else {
      const { error } = await supabase.from('posts').update(payload).eq('id', id.value)
      if (error) throw error
    }

    toast.success('Tersimpan')
    if (thenView && form.published) {
      await navigateTo(`/${props.type}/${slug}`, { external: true })
      return
    }
    router.push(`/admin/${props.type}`)
  }
  catch (e: unknown) {
    const err = e as { code?: string, message?: string }
    if (err.code === '23505') errors.slug = 'Slug sudah dipakai. Ubah sedikit.'
    else toast.error('Gagal menyimpan', err.message || '')
  }
  finally {
    saving.value = false
  }
}

useHead(() => ({ title: isNew.value ? `${props.label} Baru` : `Edit ${props.label}` }))
</script>

<template>
  <div>
    <AdminPageHeader :title="isNew ? `${label} Baru` : `Edit ${label}`">
      <template #actions>
        <UiButton variant="ghost" :to="`/admin/${type}`">Kembali</UiButton>
        <UiButton :loading="saving" @click="save(false)">Simpan</UiButton>
      </template>
    </AdminPageHeader>

    <div v-if="loading" class="space-y-4">
      <UiSkeleton class="h-12" />
      <UiSkeleton class="h-64" />
    </div>

    <div v-else class="grid gap-6 lg:grid-cols-[1fr_300px]">
      <div class="space-y-4">
        <UiInput v-model="form.title" label="Judul" required :error="errors.title" />
        <UiInput
          v-model="form.slug"
          label="Slug (URL)"
          :error="errors.slug"
          hint="Otomatis dari judul. Ubah bila perlu."
          @input="slugTouched = true"
        />
        <UiTextarea v-model="form.excerpt" label="Ringkasan" :rows="2" hint="Tampil di daftar & pratinjau sosial media." />
        <RichTextEditor v-model="form.content" label="Isi" :folder="type" />
      </div>

      <aside class="space-y-4">
        <div class="rounded-theme border border-line bg-surface p-4">
          <UiToggle v-model="form.published" label="Terbitkan" description="Draft tidak tampil di situs publik." />
          <UiButton class="mt-4 w-full" size="sm" variant="outline" :loading="saving" @click="save(true)">
            Simpan & lihat
          </UiButton>
        </div>

        <div class="rounded-theme border border-line bg-surface p-4">
          <p class="mb-2 text-sm font-medium text-ink">Gambar sampul</p>
          <div v-if="form.cover_url" class="relative">
            <img :src="form.cover_url" alt="" class="aspect-[16/10] w-full rounded-theme object-cover">
            <button
              class="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-black/60 text-white hover:bg-black/80"
              @click="clearCover"
            >
              <AppIcon name="trash" :size="14" />
            </button>
          </div>
          <label
            v-else
            class="flex aspect-[16/10] cursor-pointer flex-col items-center justify-center gap-2 rounded-theme border border-dashed border-line text-sm text-ink-muted hover:bg-surface-muted"
          >
            <AppIcon :name="uploadingCover ? 'clock' : 'upload'" :size="22" />
            {{ uploadingCover ? 'Mengunggah…' : 'Pilih gambar' }}
            <input type="file" accept="image/*" class="hidden" :disabled="uploadingCover" @change="onCover">
          </label>
        </div>
      </aside>
    </div>
  </div>
</template>
