<script setup lang="ts">
import { ApiClientError } from '~/composables/useApi'

definePageMeta({ layout: false })

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()
const { village } = useSiteConfig()
const toast = useToast()

const email = ref('')
const password = ref('')
const remember = ref(true)
const loading = ref(false)
const errorMsg = ref('')

onMounted(async () => {
  if (!auth.ready) await auth.fetchMe()
  if (auth.isAuthenticated) router.replace((route.query.redirect as string) || '/admin')
})

async function submit() {
  loading.value = true
  errorMsg.value = ''
  try {
    await auth.login(email.value, password.value, remember.value)
    toast.success('Berhasil masuk', 'Selamat datang kembali.')
    router.replace((route.query.redirect as string) || '/admin')
  }
  catch (e) {
    errorMsg.value = e instanceof ApiClientError ? e.message : 'Gagal masuk. Coba lagi.'
  }
  finally {
    loading.value = false
  }
}

useHead({ title: 'Masuk Admin' })
</script>

<template>
  <div class="grid min-h-screen lg:grid-cols-2">
    <!-- visual side -->
    <div class="relative hidden overflow-hidden bg-secondary lg:block">
      <NuxtImg src="https://picsum.photos/seed/village-admin/1200/1600" alt="" class="absolute inset-0 h-full w-full object-cover opacity-40" />
      <div class="pattern-batik absolute inset-0 opacity-10" />
      <div class="relative flex h-full flex-col justify-between p-12 text-white">
        <span class="font-heading text-lg font-semibold">{{ village.villageName }}</span>
        <div>
          <h2 class="font-heading text-3xl font-bold">Panel Administrasi</h2>
          <p class="mt-3 max-w-sm text-white/70">
            Kelola konten, tema, navigasi, dan seluruh informasi desa dari satu tempat.
          </p>
        </div>
        <span class="text-xs text-white/50">Sistem Informasi Desa</span>
      </div>
    </div>

    <!-- form side -->
    <div class="flex items-center justify-center p-6">
      <div class="w-full max-w-sm">
        <div class="mb-8 text-center">
          <span class="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-primary text-lg font-bold text-white">
            {{ village.villageName.charAt(0) }}
          </span>
          <h1 class="mt-4 font-heading text-xl font-bold">Masuk ke Dashboard</h1>
          <p class="mt-1 text-sm text-ink-muted">Gunakan akun administrator desa Anda.</p>
        </div>

        <form class="space-y-4" @submit.prevent="submit">
          <UiInput v-model="email" label="Email" type="email" placeholder="admin@desa.local" required />
          <UiInput v-model="password" label="Kata sandi" type="password" placeholder="••••••••" required />

          <label class="flex items-center gap-2 text-sm text-ink-muted">
            <input v-model="remember" type="checkbox" class="rounded border-line text-primary focus:ring-primary/30">
            Ingat saya di perangkat ini
          </label>

          <p v-if="errorMsg" class="rounded-theme bg-red-50 px-3 py-2 text-sm text-red-600">{{ errorMsg }}</p>

          <UiButton type="submit" block size="lg" :loading="loading">Masuk</UiButton>
        </form>

        <p class="mt-6 text-center text-xs text-ink-muted">
          <NuxtLink to="/" class="hover:text-primary">← Kembali ke situs</NuxtLink>
        </p>
      </div>
    </div>
  </div>
</template>
