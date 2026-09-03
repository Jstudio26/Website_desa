/**
 * Page Builder section model.
 * A page = ordered array of PageSection. Each section has a `type` from the
 * registry, arbitrary `data`, and layout `settings` (background, spacing...).
 */

export const SECTION_TYPES = [
  'hero',
  'heroSlider',
  'videoHero',
  'text',
  'editorial',
  'asymmetric',
  'splitScreen',
  'image',
  'fullWidthImage',
  'imageGallery',
  'bentoGrid',
  'masonryGallery',
  'statistics',
  'statisticsShowcase',
  'featureCards',
  'news',
  'featuredNews',
  'announcements',
  'events',
  'timeline',
  'officials',
  'tourism',
  'tourismShowcase',
  'umkm',
  'culturalShowcase',
  'video',
  'imageQuote',
  'faq',
  'cta',
  'contact',
  'map',
  'horizontalSlider',
  'parallax',
  'kktTeam',
  'customHtml',
] as const
export type SectionType = (typeof SECTION_TYPES)[number]

export type SectionBackgroundType = 'solid' | 'gradient' | 'image' | 'pattern' | 'transparent' | 'dark'

export interface SectionSettings {
  backgroundType: SectionBackgroundType
  backgroundColor: string | null
  backgroundGradient: string | null
  backgroundImage: string | null
  backgroundPattern: string | null
  overlay: boolean
  overlayOpacity: number     // 0 - 1
  spacing: 'none' | 'sm' | 'md' | 'lg' | 'xl'
  container: 'full' | 'wide' | 'normal' | 'narrow'
  align: 'left' | 'center' | 'right'
  anchorId: string | null
}

export interface PageSection {
  id: string
  type: SectionType
  visible: boolean
  order: number
  /** Freeform content per section type - validated per-type on save. */
  data: Record<string, unknown>
  settings: SectionSettings
}

export function defaultSectionSettings(): SectionSettings {
  return {
    backgroundType: 'transparent',
    backgroundColor: null,
    backgroundGradient: null,
    backgroundImage: null,
    backgroundPattern: null,
    overlay: false,
    overlayOpacity: 0.5,
    spacing: 'lg',
    container: 'normal',
    align: 'left',
    anchorId: null,
  }
}

export interface SectionMeta {
  type: SectionType
  label: string
  group: 'Hero' | 'Konten' | 'Media' | 'Data Desa' | 'Potensi' | 'Interaksi' | 'KKT' | 'Lainnya'
  description: string
  icon: string
}
