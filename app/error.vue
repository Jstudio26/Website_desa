<script setup lang="ts">
import type { NuxtError } from '#app'

const props = defineProps<{ error: NuxtError }>()
const is404 = computed(() => props.error?.statusCode === 404)
</script>

<template>
  <div class="grid min-h-screen place-items-center bg-surface px-6 text-center">
    <div class="max-w-lg">
      <p class="font-heading text-[7rem] leading-none text-primary/20">
        {{ error?.statusCode || 500 }}
      </p>
      <h1 class="mt-2 text-2xl font-semibold">
        {{ is404 ? 'Halaman tidak ditemukan' : 'Terjadi kesalahan' }}
      </h1>
      <p class="mt-3 text-ink-muted">
        {{ is404
          ? 'Halaman yang Anda cari mungkin telah dipindahkan atau modulnya sedang dinonaktifkan.'
          : (error?.message || 'Silakan coba beberapa saat lagi.') }}
      </p>
      <button
        class="mt-8 inline-flex items-center gap-2 rounded-theme bg-primary px-5 py-2.5 font-medium text-white transition hover:opacity-90"
        @click="clearError({ redirect: '/' })"
      >
        Kembali ke Beranda
      </button>
    </div>
  </div>
</template>
