<script setup lang="ts">
import { SITE_LOCALE } from '~/config/site'
import type { Database } from '~/types/supabase'

const sidebarOpen = ref(false)
const supabase = useSupabaseClient<Database>()
const user = useSupabaseUser()
const router = useRouter()

const today = new Intl.DateTimeFormat(SITE_LOCALE, {
  weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
}).format(new Date())

// Login saja tidak cukup: hanya email di tabel `admins` yang diizinkan database (lihat schema.sql).
// Ini hanya tampilan; aturan sebenarnya ada di RLS. Bila fungsi is_admin belum ada (skema lama),
// panel tetap ditampilkan seperti sebelumnya.
const { data: isAdmin } = useAsyncData('is-admin', async () => {
  if (!user.value) return true
  const { data, error } = await supabase.rpc('is_admin')
  return error ? true : data === true
}, { server: false, watch: [user] })
// Panel admin jangan sampai muncul di hasil pencarian.
useHead({ meta: [{ name: 'robots', content: 'noindex, nofollow' }] })

const grantSql = computed(() =>
  `insert into public.admins (email) values ('${user.value?.email ?? 'email@anda.com'}') on conflict do nothing;`)

async function doLogout() {
  await supabase.auth.signOut()
  router.push('/admin/login')
}
</script>

<template>
  <div class="min-h-screen bg-surface-muted/40">
    <AdminSidebar v-model:open="sidebarOpen" />

    <div class="lg:pl-64">
      <header class="sticky top-0 z-20 flex h-16 items-center justify-between gap-4 border-b border-line bg-surface/95 px-4 backdrop-blur sm:px-6">
        <button class="grid h-9 w-9 place-items-center rounded-theme hover:bg-surface-muted lg:hidden" aria-label="Menu" @click="sidebarOpen = true">
          <AppIcon name="menu" :size="20" />
        </button>
        <div class="hidden text-sm text-ink-muted sm:block">{{ today }}</div>
        <div class="ml-auto flex items-center gap-3">
          <div v-if="user" class="flex items-center gap-2.5">
            <span class="grid h-8 w-8 place-items-center rounded-full bg-primary/10 text-sm font-semibold uppercase text-primary">
              {{ (user.email || 'A').charAt(0) }}
            </span>
            <div class="hidden text-right sm:block">
              <p class="text-sm font-medium leading-tight">{{ user.email }}</p>
              <p class="text-[11px] text-ink-muted">Administrator</p>
            </div>
          </div>
          <button
            class="flex items-center gap-1.5 rounded-theme border border-line px-3 py-1.5 text-sm hover:bg-surface-muted"
            @click="doLogout"
          >
            <AppIcon name="logout" :size="15" /> <span class="hidden sm:inline">Keluar</span>
          </button>
        </div>
      </header>

      <main class="mx-auto max-w-6xl p-4 sm:p-6 lg:p-8">
        <div v-if="isAdmin === false" class="mx-auto max-w-xl rounded-theme border border-line bg-surface p-6 sm:p-8">
          <span class="grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary">
            <AppIcon name="shield" :size="22" />
          </span>
          <h1 class="mt-4 font-heading text-xl font-bold">Akun ini belum terdaftar sebagai admin</h1>
          <p class="mt-2 text-sm text-ink-muted">
            Anda masuk sebagai <strong class="text-ink">{{ user?.email }}</strong>, tetapi email ini belum ada di daftar admin,
            sehingga tidak bisa mengelola konten atau melihat data warga.
          </p>
          <p class="mt-4 text-sm text-ink-muted">
            Bila ini memang akun pengelola, jalankan perintah berikut di Supabase → SQL Editor, lalu muat ulang halaman:
          </p>
          <pre class="mt-2 overflow-x-auto rounded-theme bg-surface-muted p-3 text-xs text-ink">{{ grantSql }}</pre>
          <UiButton class="mt-5" variant="outline" size="sm" @click="doLogout">
            <template #icon><AppIcon name="logout" :size="14" /></template> Keluar
          </UiButton>
        </div>
        <slot v-else />
      </main>
    </div>

    <UiToaster />
  </div>
</template>
