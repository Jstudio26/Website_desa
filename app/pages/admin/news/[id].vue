<script setup lang="ts">
import { apiFetch, ApiClientError } from '~/composables/useApi'

definePageMeta({ layout: 'admin' })
const route = useRoute()
const router = useRouter()
const toast = useToast()

const isNew = computed(() => route.params.id === 'new')

interface Category { id: string, name: string }
const { data: cats } = await useAsyncData('news-cats-admin', () => apiFetch<Category[]>('/api/admin/news/categories'))

interface Form {
  title: string, slug: string, excerpt: string, content: string, featuredImage: string | null
  categoryId: string | null, status: 'draft' | 'published' | 'archived', isFeatured: boolean, tags: string[]
}
const form = ref<Form>({
  title: '', slug: '', excerpt: '', content: '', featuredImage: null,
  categoryId: null, status: 'draft', isFeatured: false, tags: [],
})
const errors = ref<Record<string, string[]>>({})

if (!isNew.value) {
  const { data } = await useAsyncData(`news-${route.params.id}`, () => apiFetch<Form & { id: string }>(`/api/admin/news/${route.params.id}`))
  if (data.value) {
    form.value = {
      title: data.value.title, slug: data.value.slug, excerpt: data.value.excerpt ?? '',
      content: data.value.content ?? '', featuredImage: data.value.featuredImage ?? null,
      categoryId: data.value.categoryId ?? null, status: data.value.status,
      isFeatured: data.value.isFeatured, tags: data.value.tags ?? [],
    }
  }
}

const tagsInput = computed({
  get: () => form.value.tags.join(', '),
  set: (v: string) => { form.value.tags = v.split(',').map((s) => s.trim()).filter(Boolean) },
})

const saving = ref(false)
async function save(publish?: boolean) {
  saving.value = true
  errors.value = {}
  const body = { ...form.value }
  if (publish) body.status = 'published'
  try {
    if (isNew.value) {
      const created = await apiFetch<{ id: string }>('/api/admin/news', { method: 'POST', body })
      toast.success('Berita dibuat')
      router.replace(`/admin/news/${created.id}`)
    }
    else {
      await apiFetch(`/api/admin/news/${route.params.id}`, { method: 'PUT', body })
      form.value.status = body.status
      toast.success('Tersimpan')
    }
  }
  catch (e) {
    if (e instanceof ApiClientError) { errors.value = e.fields ?? {}; toast.error('Gagal menyimpan', e.message) }
  }
  finally { saving.value = false }
}
</script>

<template>
  <div>
    <AdminPageHeader :title="isNew ? 'Berita Baru' : 'Ubah Berita'">
      <template #actions>
        <UiButton variant="ghost" to="/admin/news">Kembali</UiButton>
        <UiButton variant="outline" :loading="saving" @click="save(false)">Simpan Draft</UiButton>
        <UiButton :loading="saving" @click="save(true)">Terbitkan</UiButton>
      </template>
    </AdminPageHeader>

    <div class="grid gap-6 lg:grid-cols-[1fr_300px]">
      <div class="space-y-4">
        <UiCard>
          <UiInput v-model="form.title" label="Judul" required :error="errors.title" />
          <div class="mt-4">
            <UiInput v-model="form.slug" label="Slug" hint="Kosongkan untuk dibuat otomatis dari judul" :error="errors.slug" />
          </div>
          <div class="mt-4">
            <UiTextarea v-model="form.excerpt" label="Ringkasan" rows="2" hint="Tampil di kartu berita & meta SEO" :error="errors.excerpt" />
          </div>
        </UiCard>

        <UiCard>
          <label class="mb-1.5 block text-sm font-medium">Konten</label>
          <textarea
            v-model="form.content"
            rows="18"
            class="w-full rounded-theme border border-line bg-surface px-3.5 py-2.5 font-mono text-sm outline-none focus:border-primary"
            placeholder="<p>Tulis konten dalam HTML sederhana...</p>"
          />
          <p class="mt-1 text-xs text-ink-muted">Mendukung HTML dasar. Editor WYSIWYG dapat ditambahkan (lihat roadmap).</p>
        </UiCard>
      </div>

      <div class="space-y-4">
        <UiCard>
          <h3 class="mb-3 text-sm font-semibold">Publikasi</h3>
          <UiSelect
            v-model="form.status"
            label="Status"
            :options="[{ label: 'Draft', value: 'draft' }, { label: 'Terbit', value: 'published' }, { label: 'Arsip', value: 'archived' }]"
          />
          <div class="mt-3">
            <UiToggle v-model="form.isFeatured" label="Jadikan berita unggulan" />
          </div>
        </UiCard>

        <UiCard>
          <h3 class="mb-3 text-sm font-semibold">Kategori & Tag</h3>
          <UiSelect
            v-model="form.categoryId"
            label="Kategori"
            placeholder="Tanpa kategori"
            :options="(cats || []).map((c) => ({ label: c.name, value: c.id }))"
          />
          <div class="mt-3">
            <UiInput v-model="tagsInput" label="Tag" hint="Pisahkan dengan koma" />
          </div>
        </UiCard>

        <UiCard>
          <h3 class="mb-3 text-sm font-semibold">Gambar Utama</h3>
          <UiInput v-model="form.featuredImage" label="URL Gambar" />
          <img v-if="form.featuredImage" :src="form.featuredImage" alt="" class="mt-3 aspect-video w-full rounded-theme object-cover">
        </UiCard>
      </div>
    </div>
  </div>
</template>
