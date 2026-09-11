<script setup lang="ts">
import { Editor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'

const props = defineProps<{ label?: string, folder?: string }>()
const model = defineModel<string | null>()
const toast = useToast()
const { upload } = useMedia()

const editor = shallowRef<Editor>()
const uploading = ref(false)

onMounted(() => {
  editor.value = new Editor({
    content: model.value || '',
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] } }),
      Image.configure({ HTMLAttributes: { class: 'rounded-theme' } }),
      Link.configure({ openOnClick: false, HTMLAttributes: { rel: 'noopener', target: '_blank' } }),
    ],
    editorProps: {
      attributes: { class: 'prose-village min-h-[240px] max-w-none px-4 py-3 focus:outline-none' },
    },
    onUpdate: () => {
      const html = editor.value?.getHTML() ?? ''
      model.value = html === '<p></p>' ? '' : html
    },
  })
})

onBeforeUnmount(() => editor.value?.destroy())

watch(model, (value) => {
  if (!editor.value) return
  const current = editor.value.getHTML()
  if ((value || '') !== (current === '<p></p>' ? '' : current)) {
    editor.value.commands.setContent(value || '', false)
  }
})

function setLink() {
  const prev = editor.value?.getAttributes('link').href as string | undefined
  const url = window.prompt('URL tautan:', prev || 'https://')
  if (url === null) return
  if (url === '') {
    editor.value?.chain().focus().extendMarkRange('link').unsetLink().run()
    return
  }
  editor.value?.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
}

async function pickImage(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  uploading.value = true
  try {
    const url = await upload(file, props.folder || 'konten')
    editor.value?.chain().focus().setImage({ src: url }).run()
  }
  catch (err) {
    toast.error('Gagal mengunggah gambar', err instanceof Error ? err.message : '')
  }
  finally {
    uploading.value = false
  }
}

const isActive = (name: string, attrs?: Record<string, unknown>) => editor.value?.isActive(name, attrs) ?? false
</script>

<template>
  <div>
    <span v-if="label" class="mb-1.5 block text-sm font-medium text-ink">{{ label }}</span>
    <div class="overflow-hidden rounded-theme border border-line bg-surface">
      <ClientOnly>
        <div v-if="editor" class="flex flex-wrap items-center gap-0.5 border-b border-line bg-surface-muted/40 p-1.5">
          <button type="button" class="tb" :class="{ 'is-on': isActive('bold') }" title="Tebal" @click="editor.chain().focus().toggleBold().run()">
            <AppIcon name="bold" :size="16" />
          </button>
          <button type="button" class="tb" :class="{ 'is-on': isActive('italic') }" title="Miring" @click="editor.chain().focus().toggleItalic().run()">
            <AppIcon name="italic" :size="16" />
          </button>
          <span class="mx-1 h-5 w-px bg-line" />
          <button type="button" class="tb text-xs font-bold" :class="{ 'is-on': isActive('heading', { level: 2 }) }" title="Judul" @click="editor.chain().focus().toggleHeading({ level: 2 }).run()">H2</button>
          <button type="button" class="tb text-xs font-bold" :class="{ 'is-on': isActive('heading', { level: 3 }) }" title="Sub-judul" @click="editor.chain().focus().toggleHeading({ level: 3 }).run()">H3</button>
          <span class="mx-1 h-5 w-px bg-line" />
          <button type="button" class="tb" :class="{ 'is-on': isActive('bulletList') }" title="Daftar" @click="editor.chain().focus().toggleBulletList().run()">
            <AppIcon name="list" :size="16" />
          </button>
          <button type="button" class="tb" :class="{ 'is-on': isActive('orderedList') }" title="Daftar bernomor" @click="editor.chain().focus().toggleOrderedList().run()">
            <AppIcon name="listOrdered" :size="16" />
          </button>
          <button type="button" class="tb" :class="{ 'is-on': isActive('blockquote') }" title="Kutipan" @click="editor.chain().focus().toggleBlockquote().run()">
            <AppIcon name="quote" :size="16" />
          </button>
          <span class="mx-1 h-5 w-px bg-line" />
          <button type="button" class="tb" :class="{ 'is-on': isActive('link') }" title="Tautan" @click="setLink">
            <AppIcon name="link" :size="16" />
          </button>
          <label class="tb cursor-pointer" title="Sisipkan gambar">
            <AppIcon :name="uploading ? 'clock' : 'image'" :size="16" />
            <input type="file" accept="image/*" class="hidden" :disabled="uploading" @change="pickImage">
          </label>
        </div>
        <EditorContent :editor="editor" />
        <template #fallback>
          <div class="min-h-[240px] px-4 py-3 text-sm text-ink-muted">Memuat editor…</div>
        </template>
      </ClientOnly>
    </div>
  </div>
</template>

<style scoped>
.tb {
  @apply grid h-8 min-w-8 place-items-center rounded px-1.5 text-ink-muted transition hover:bg-surface-muted hover:text-ink;
}
.tb.is-on {
  @apply bg-primary/10 text-primary;
}
</style>
