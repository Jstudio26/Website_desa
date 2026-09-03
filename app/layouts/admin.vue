<script setup lang="ts">
const sidebarOpen = ref(false)
const auth = useAuthStore()
const router = useRouter()

async function doLogout() {
  await auth.logout()
  router.push('/admin/login')
}
</script>

<template>
  <div class="min-h-screen bg-surface-muted/40">
    <AdminSidebar v-model:open="sidebarOpen" />

    <div class="lg:pl-64">
      <header class="sticky top-0 z-20 flex h-16 items-center justify-between gap-4 border-b border-line bg-surface/95 px-4 backdrop-blur sm:px-6">
        <button class="grid h-9 w-9 place-items-center rounded-theme hover:bg-surface-muted lg:hidden" @click="sidebarOpen = true" aria-label="Menu">
          <AppIcon name="menu" :size="20" />
        </button>
        <div class="hidden text-sm text-ink-muted sm:block">
          {{ new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date()) }}
        </div>
        <div class="ml-auto flex items-center gap-3">
          <div v-if="auth.user" class="flex items-center gap-2.5">
            <span class="grid h-8 w-8 place-items-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
              {{ auth.user.name.charAt(0) }}
            </span>
            <div class="hidden text-right sm:block">
              <p class="text-sm font-medium leading-tight">{{ auth.user.name }}</p>
              <p class="text-[11px] text-ink-muted">{{ auth.user.role }}</p>
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
