<script setup lang="ts">
/** Blok cuaca beranda: kartu utama + prakiraan 3 hari, termasuk semua state data. */
const { data, status, refresh, timezone, current, next, days, state, isOutdated } = useWeather()
</script>

<template>
  <section class="container-app pt-14 sm:pt-20 lg:pt-24" aria-label="Prakiraan cuaca BMKG">
    <!-- Memuat -->
    <div v-if="state === 'loading'" class="grid gap-5 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]" aria-busy="true">
      <div class="h-[27rem] animate-pulse rounded-theme bg-surface-muted sm:h-[29rem]">
        <span class="sr-only">Memuat prakiraan cuaca BMKG…</span>
      </div>
      <div class="card space-y-4 p-6">
        <UiSkeleton class="h-6 w-1/2" />
        <div class="grid grid-cols-3 gap-2">
          <UiSkeleton v-for="i in 3" :key="i" class="h-14" />
        </div>
        <div class="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
          <UiSkeleton v-for="i in 4" :key="i" class="h-36" />
        </div>
      </div>
    </div>

    <!-- Berhasil -->
    <div
      v-else-if="state === 'ready' && data && current"
      class="grid gap-5 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:items-start"
    >
      <WeatherCard
        :entry="current.slot"
        :is-upcoming="current.isUpcoming"
        :next="next"
        :location="data.location"
        :analysis-date="data.analysisDate"
        :stale="data.stale"
        :is-outdated="isOutdated"
      />
      <WeatherForecast v-if="days.length" :days="days" :timezone="timezone" />
    </div>

    <!-- Gagal / kosong / kedaluwarsa: tidak menampilkan angka apa pun -->
    <div v-else class="card flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center sm:p-7">
      <span class="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-surface-muted text-ink-muted">
        <AppIcon name="cloud" :size="24" />
      </span>
      <div class="min-w-0 flex-1">
        <p class="text-[0.7rem] font-bold uppercase tracking-[0.2em] text-ink-muted">Prakiraan Cuaca BMKG</p>
        <p class="mt-1 font-heading text-lg font-bold text-ink">
          <template v-if="state === 'error'">Prakiraan cuaca belum dapat dimuat</template>
          <template v-else-if="state === 'expired'">Prakiraan terbaru belum tersedia</template>
          <template v-else>Data prakiraan belum tersedia</template>
        </p>
        <p class="mt-1 text-sm text-ink-muted">
          <template v-if="state === 'error'">Layanan BMKG sedang tidak dapat dihubungi. Silakan coba lagi beberapa saat lagi.</template>
          <template v-else-if="state === 'expired'">Data prakiraan dari BMKG yang tersimpan sudah lewat waktunya, jadi tidak ditampilkan.</template>
          <template v-else>BMKG belum menyediakan data prakiraan untuk Kelurahan Matani Tiga saat ini.</template>
          Lihat langsung di
          <a href="https://www.bmkg.go.id/cuaca/prakiraan-cuaca/71.73.02.1017" target="_blank" rel="noopener" class="font-semibold text-primary underline underline-offset-2">situs BMKG</a>.
        </p>
      </div>
      <UiButton variant="outline" size="sm" :loading="status === 'pending'" @click="refresh()">
        <template #icon><AppIcon name="refresh" :size="15" /></template>
        Coba lagi
      </UiButton>
    </div>
  </section>
</template>
