<script setup lang="ts">
import type { Database } from '~/types/supabase'
definePageMeta({ layout: false })

const supabase = useSupabaseClient<Database>()
const user = useSupabaseUser()
const route = useRoute()
const router = useRouter()
const { settings } = useSettings()
const toast = useToast()

const email = ref('')
const password = ref('')
const showPw = ref(false)
const loading = ref(false)
const errorMsg = ref('')

const target = computed(() => (route.query.redirect as string) || '/admin')
watchEffect(() => {
  if (user.value) router.replace(target.value)
})

async function submit() {
  loading.value = true
  errorMsg.value = ''
  try {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.value.trim(),
      password: password.value,
    })
    if (error) throw error
    toast.success('Berhasil masuk', 'Selamat datang kembali.')
    router.replace(target.value)
  }
  catch (e) {
    errorMsg.value = e instanceof Error ? e.message : 'Gagal masuk. Coba lagi.'
  }
  finally {
    loading.value = false
  }
}

useHead({ title: 'Masuk Admin' })
</script>

<template>
  <div class="min-h-screen bg-canvas lg:grid lg:grid-cols-[1.05fr_1fr]">
    <!-- Brand panel -->
    <div class="grain relative overflow-hidden bg-primary-deep px-6 py-10 text-white sm:px-10 lg:py-0">
      <div class="bg-mesh absolute inset-0 opacity-90" />
      <div class="pattern-flag absolute inset-0" />
      <div class="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />

      <div class="relative flex h-full flex-col justify-between lg:mx-auto lg:max-w-md lg:py-14">
        <NuxtLink to="/" class="inline-flex items-center gap-3 text-sm font-semibold text-white/90 transition hover:text-white">
          <span class="grid h-10 w-10 place-items-center rounded-xl bg-white text-primary shadow-lg">
            <img v-if="settings.logoUrl" :src="settings.logoUrl" alt="" class="h-7 w-7 object-contain">
            <span v-else class="font-heading text-lg font-extrabold">{{ settings.villageName.charAt(0) }}</span>
          </span>
          <span>{{ settings.villageName }}</span>
        </NuxtLink>

        <div class="my-10 lg:my-0">
          <span class="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold tracking-wide">
            <AppIcon name="shield" :size="14" /> Panel Administrasi
          </span>
          <h1 class="mt-5 font-heading text-3xl font-extrabold leading-tight text-white sm:text-[2.5rem]">
            Kelola informasi desa dari satu tempat.
          </h1>
          <p class="mt-4 max-w-sm text-white/75">
            Berita, pengumuman, galeri kegiatan, dan profil desa — semua dapat diperbarui
            dengan cepat dan aman.
          </p>
        </div>

        <div class="hidden gap-6 text-sm text-white/70 lg:flex">
          <span class="flex items-center gap-2"><AppIcon name="check" :size="15" /> Aman</span>
          <span class="flex items-center gap-2"><AppIcon name="check" :size="15" /> Mudah</span>
          <span class="flex items-center gap-2"><AppIcon name="check" :size="15" /> Tanpa ribet</span>
        </div>
      </div>
    </div>

    <!-- Form panel -->
    <div class="flex items-center justify-center px-6 py-12 sm:px-10">
      <div class="w-full max-w-sm">
        <h2 class="font-heading text-2xl font-extrabold text-ink">Masuk</h2>
        <p class="mt-1.5 text-sm text-ink-muted">Gunakan akun administrator Anda.</p>

        <form class="mt-8 space-y-4" @submit.prevent="submit">
          <UiInput v-model="email" label="Email" type="email" placeholder="admin@desa.id" required />

          <label class="block">
            <span class="mb-1.5 block text-sm font-medium text-ink">Kata sandi</span>
            <span class="relative block">
              <input
                v-model="password"
                :type="showPw ? 'text' : 'password'"
                placeholder="••••••••"
                required
                autocomplete="current-password"
                class="w-full rounded-theme border border-line bg-surface px-3.5 py-2.5 pr-11 text-sm text-ink outline-none transition placeholder:text-ink-muted/60 focus:border-primary focus:ring-2 focus:ring-primary/20"
              >
              <button
                type="button"
                class="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-md text-ink-muted hover:bg-surface-muted hover:text-ink"
                :aria-label="showPw ? 'Sembunyikan' : 'Tampilkan'"
                @click="showPw = !showPw"
              >
                <AppIcon name="eye" :size="16" />
              </button>
            </span>
          </label>

          <p v-if="errorMsg" class="flex items-start gap-2 rounded-theme bg-primary/5 px-3 py-2 text-sm text-primary">
            <AppIcon name="info" :size="16" class="mt-0.5 shrink-0" /> {{ errorMsg }}
          </p>

          <UiButton type="submit" block size="lg" :loading="loading" class="!shadow-red">Masuk</UiButton>
        </form>

        <p class="mt-8 text-center text-xs text-ink-muted">
          <NuxtLink to="/" class="link-underline font-medium hover:text-primary">← Kembali ke situs</NuxtLink>
        </p>
      </div>
    </div>
  </div>
</template>
