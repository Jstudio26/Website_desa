<script setup lang="ts">
import type { NuxtError } from '#app'

const props = defineProps<{ error: NuxtError }>()
const is404 = computed(() => props.error?.statusCode === 404)
</script>

<template>
  <div class="grain relative grid min-h-screen place-items-center overflow-hidden bg-canvas px-6 text-center">
    <div class="pointer-events-none absolute -top-32 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
    <div class="relative max-w-lg">
      <p class="font-heading text-[7.5rem] font-extrabold leading-none text-primary/15">
        {{ error?.statusCode || 500 }}
      </p>
      <h1 class="mt-2 font-heading text-2xl font-extrabold">
        {{ is404 ? 'Halaman tidak ditemukan' : 'Terjadi kesalahan' }}
      </h1>
      <p class="mt-3 text-ink-muted">
        {{ is404
          ? 'Halaman yang Anda cari mungkin telah dipindahkan atau tidak tersedia.'
          : (error?.message || 'Silakan coba beberapa saat lagi.') }}
      </p>
      <button
        class="mt-8 inline-flex items-center gap-2 rounded-theme bg-primary px-6 py-3 font-semibold text-white shadow-red transition hover:bg-primary-deep"
        @click="clearError({ redirect: '/' })"
      >
        <AppIcon name="home" :size="16" /> Kembali ke Beranda
      </button>
    </div>
  </div>
</template>
