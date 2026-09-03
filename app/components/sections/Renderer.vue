<script setup lang="ts">
import type { PageSection } from '~~/shared/types/sections'
import type { SectionContext } from './types'

import Hero from './Hero.vue'
import Statistics from './Statistics.vue'
import ImageQuote from './ImageQuote.vue'
import FeaturedNews from './FeaturedNews.vue'
import TourismShowcase from './TourismShowcase.vue'
import Umkm from './Umkm.vue'
import Events from './Events.vue'
import MasonryGallery from './MasonryGallery.vue'
import Cta from './Cta.vue'
import KktTeam from './KktTeam.vue'
import Text from './Text.vue'
import Fallback from './Fallback.vue'
import Shell from './Shell.vue'

const props = defineProps<{ sections: PageSection[], ctx?: SectionContext }>()

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const MAP: Record<string, any> = {
  hero: Hero,
  statistics: Statistics,
  statisticsShowcase: Statistics,
  imageQuote: ImageQuote,
  news: FeaturedNews,
  featuredNews: FeaturedNews,
  tourism: TourismShowcase,
  tourismShowcase: TourismShowcase,
  umkm: Umkm,
  events: Events,
  masonryGallery: MasonryGallery,
  imageGallery: MasonryGallery,
  bentoGrid: MasonryGallery,
  cta: Cta,
  kktTeam: KktTeam,
  text: Text,
  editorial: Text,
}

const visible = computed(() =>
  [...props.sections].filter((s) => s.visible).sort((a, b) => a.order - b.order),
)
const ctx = computed(() => props.ctx ?? {})
</script>

<template>
  <Shell v-for="s in visible" :key="s.id" :settings="s.settings">
    <template #default="{ dark }">
      <component :is="MAP[s.type] || Fallback" :section="s" :ctx="ctx" :dark="dark" />
    </template>
  </Shell>
</template>
