<script setup lang="ts">
import { SITE_LOCALE } from '~/config/site'

const sidebarOpen = ref(false)
const supabase = useSupabaseClient()
const user = useSupabaseUser()
const router = useRouter()

const today = new Intl.DateTimeFormat(SITE_LOCALE, {
  weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
}).format(new Date())

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
        <slot />
      </main>
    </div>

    <UiToaster />
  </div>
</template>
