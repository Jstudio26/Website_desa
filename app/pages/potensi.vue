<script setup lang="ts">
import type { PotensiCategory } from '~/types/database'
import { withPotensiProfileDefaults } from '~/composables/useSettings'

const { settings } = useSettings()
const profile = computed(() => withPotensiProfileDefaults(settings.value.potensiProfile))

const SECTIONS: { category: PotensiCategory, eyebrow: string, title: string, icon: string }[] = [
  { category: 'sdm', eyebrow: 'SDM', title: 'Sumber Daya Manusia', icon: 'users' },
  { category: 'sda', eyebrow: 'SDA', title: 'Sumber Daya Alam', icon: 'leaf' },
]

/** Paragraphs are separated by a blank line in the stored text. */
const paragraphs = (text: string) => text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean)

const sections = computed(() => SECTIONS.map((s) => {
  const aspect = profile.value[s.category]
  return {
    ...s,
    paragraphs: paragraphs(aspect.overview),
    strengths: aspect.strengths.filter(Boolean),
    weaknesses: aspect.weaknesses.filter(Boolean),
    items: (settings.value.potensi ?? []).filter((p) => p.category === s.category),
  }
}).filter((s) => s.paragraphs.length || s.strengths.length || s.weaknesses.length || s.items.length))

const summary = computed(() => paragraphs(profile.value.summary))
const highlights = computed(() => profile.value.highlights.filter((h) => h.value && h.label))
const support = computed(() => ({ title: profile.value.support.title, paragraphs: paragraphs(profile.value.support.text) }))
const recommendations = computed(() => profile.value.recommendations.filter(Boolean))
const sources = computed(() => profile.value.sources.split('\n').map((l) => l.trim()).filter(Boolean))
const isEmpty = computed(() =>
  !summary.value.length && !sections.value.length && !support.value.paragraphs.length && !recommendations.value.length)

useHead({ title: 'Potensi Kelurahan' })
</script>

<template>
  <div>
    <PageHero
      title="Potensi Kelurahan"
      :subtitle="`Potensi sumber daya manusia dan sumber daya alam di ${settings.villageName}.`"
      :breadcrumb="[{ label: 'Potensi Kelurahan' }]"
    />

    <section v-if="isEmpty" class="section container-app">
      <UiEmptyState title="Belum ada data potensi" message="Data potensi kelurahan belum diisi oleh admin." />
    </section>

    <template v-else>
      <!-- Ringkasan -->
      <section v-if="summary.length" class="section container-app">
        <div v-reveal class="mx-auto max-w-3xl">
          <span class="eyebrow"><span class="h-px w-6 bg-primary" /> Gambaran Umum</span>
          <h2 class="mt-4 font-heading text-2xl font-extrabold">Ringkasan Potensi</h2>
          <div class="mt-5 space-y-4 leading-relaxed text-ink-muted">
            <p v-for="(p, i) in summary" :key="i">{{ p }}</p>
          </div>
        </div>
        <dl v-if="highlights.length" class="mx-auto mt-10 grid max-w-5xl grid-cols-2 gap-4 lg:grid-cols-4">
          <div
            v-for="(h, i) in highlights"
            :key="i"
            v-reveal="i"
            class="accent-top rounded-theme border border-line/80 bg-surface p-5 text-center shadow-card"
          >
            <dd class="font-heading text-2xl font-extrabold text-primary sm:text-[1.7rem]">{{ h.value }}</dd>
            <dt class="mt-1 text-xs font-medium leading-snug text-ink-muted">{{ h.label }}</dt>
          </div>
        </dl>
      </section>

      <!-- SDM & SDA -->
      <section
        v-for="(s, si) in sections"
        :key="s.category"
        class="section"
        :class="si % 2 === 0 ? 'bg-surface-muted/50' : ''"
      >
        <div class="container-app">
          <div class="mx-auto max-w-3xl">
            <div v-reveal class="flex items-start gap-4">
              <span class="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                <AppIcon :name="s.icon" :size="22" />
              </span>
              <div>
                <span class="eyebrow"><span class="h-px w-6 bg-primary" /> Potensi {{ s.eyebrow }}</span>
                <h2 class="mt-2 font-heading text-2xl font-extrabold">{{ s.title }}</h2>
              </div>
            </div>
            <div v-if="s.paragraphs.length" v-reveal class="mt-5 space-y-4 leading-relaxed text-ink-muted">
              <p v-for="(p, i) in s.paragraphs" :key="i">{{ p }}</p>
            </div>
          </div>

          <!-- Kekuatan / kelemahan -->
          <div v-if="s.strengths.length || s.weaknesses.length" class="mx-auto mt-8 grid max-w-5xl gap-5 md:grid-cols-2">
            <div v-if="s.strengths.length" v-reveal class="accent-top rounded-theme border border-line/80 bg-surface p-6 shadow-card">
              <h3 class="flex items-center gap-2 font-heading text-lg font-bold text-ink">
                <span class="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary"><AppIcon name="check" :size="16" /></span>
                Kekuatan
              </h3>
              <ul class="mt-4 space-y-3">
                <li v-for="(t, i) in s.strengths" :key="i" class="flex gap-3 text-sm leading-relaxed text-ink">
                  <span class="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden="true" />
                  <span>{{ t }}</span>
                </li>
              </ul>
            </div>
            <div v-if="s.weaknesses.length" v-reveal="1" class="rounded-theme border border-line/80 bg-surface p-6 shadow-card">
              <h3 class="flex items-center gap-2 font-heading text-lg font-bold text-ink">
                <span class="grid h-8 w-8 place-items-center rounded-lg bg-surface-muted text-ink-muted"><AppIcon name="info" :size="16" /></span>
                Kendala
              </h3>
              <ul class="mt-4 space-y-3">
                <li v-for="(t, i) in s.weaknesses" :key="i" class="flex gap-3 text-sm leading-relaxed text-ink">
                  <span class="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-ink-muted/50" aria-hidden="true" />
                  <span>{{ t }}</span>
                </li>
              </ul>
            </div>
          </div>

          <!-- Kartu potensi unggulan (dari admin) -->
          <template v-if="s.items.length">
            <h3 v-reveal class="mt-12 font-heading text-lg font-bold text-ink">Potensi Unggulan {{ s.eyebrow }}</h3>
            <div class="mt-5 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <article
                v-for="(p, i) in s.items"
                :key="p.id"
                v-reveal="i % 3"
                class="card flex flex-col overflow-hidden"
              >
                <div class="aspect-[16/10] overflow-hidden bg-surface-muted">
                  <img v-if="p.imageUrl" :src="p.imageUrl" :alt="p.title" class="h-full w-full object-cover" loading="lazy">
                  <div v-else class="grid h-full place-items-center text-primary/25" aria-hidden="true">
                    <AppIcon :name="s.icon" :size="40" />
                  </div>
                </div>
                <div class="flex flex-1 flex-col p-5">
                  <h4 class="font-heading text-lg font-bold leading-snug text-ink">{{ p.title }}</h4>
                  <p v-if="p.description" class="mt-2 whitespace-pre-line text-sm leading-relaxed text-ink-muted">{{ p.description }}</p>
                </div>
              </article>
            </div>
          </template>
        </div>
      </section>

      <!-- Potensi wilayah sebagai pendukung -->
      <section
        v-if="support.paragraphs.length"
        class="section"
        :class="sections.length % 2 === 0 ? 'bg-surface-muted/50' : ''"
      >
        <div class="container-app">
          <div class="mx-auto max-w-3xl">
            <div v-reveal class="flex items-start gap-4">
              <span class="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                <AppIcon name="mapPin" :size="22" />
              </span>
              <div>
                <span class="eyebrow"><span class="h-px w-6 bg-primary" /> Faktor Pendukung</span>
                <h2 class="mt-2 font-heading text-2xl font-extrabold">{{ support.title || 'Potensi Wilayah' }}</h2>
              </div>
            </div>
            <div v-reveal class="mt-5 space-y-4 leading-relaxed text-ink-muted">
              <p v-for="(p, i) in support.paragraphs" :key="i">{{ p }}</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Rekomendasi + sumber -->
      <section
        v-if="recommendations.length || sources.length"
        class="container-app"
        :class="recommendations.length ? 'section' : 'py-10'"
      >
        <div class="mx-auto max-w-3xl">
          <template v-if="recommendations.length">
            <div v-reveal>
              <span class="eyebrow"><span class="h-px w-6 bg-primary" /> Arah Pengembangan</span>
              <h2 class="mt-4 font-heading text-2xl font-extrabold">Rekomendasi</h2>
            </div>
            <ol class="mt-6 space-y-3">
              <li
                v-for="(r, i) in recommendations"
                :key="i"
                v-reveal="i"
                class="flex gap-4 rounded-theme border border-line/80 bg-surface p-5 shadow-card"
              >
                <span class="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary text-sm font-extrabold text-white">{{ i + 1 }}</span>
                <p class="pt-1.5 text-sm leading-relaxed text-ink">{{ r }}</p>
              </li>
            </ol>
            <p v-if="profile.recommendationsNote" v-reveal class="mt-5 text-sm leading-relaxed text-ink-muted">{{ profile.recommendationsNote }}</p>
          </template>

          <div v-if="sources.length" class="border-t border-line pt-5 text-xs leading-relaxed text-ink-muted" :class="recommendations.length ? 'mt-10' : ''">
            <p class="font-semibold text-ink">Sumber</p>
            <ol class="mt-2 list-decimal space-y-1 pl-4">
              <li v-for="(src, i) in sources" :key="i">{{ src }}</li>
            </ol>
          </div>
        </div>
      </section>
    </template>
  </div>
</template>
