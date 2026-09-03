import type { PageSection } from '~~/shared/types/sections'

/** Homepage aggregate payload passed to data-driven sections. */
export interface SectionContext {
  news?: { featured: Record<string, unknown> | null, rest: Record<string, unknown>[] }
  announcements?: Record<string, unknown>[]
  events?: Record<string, unknown>[]
  umkm?: Record<string, unknown>[]
  tourism?: Record<string, unknown>[]
  gallery?: { items?: { imageUrl: string, caption?: string }[] } | null
  statistics?: Array<{ title: string, chartType: string, unit?: string, points: { label: string, value: string, color?: string }[] }>
  headman?: Record<string, unknown> | null
  [k: string]: unknown
}

export interface SectionProps {
  section: PageSection
  ctx: SectionContext
  dark?: boolean
}

/** Replace {village} / {tagline} tokens in editable strings. */
export function interpolate(text: string, village: { villageName: string, tagline: string }): string {
  return (text || '')
    .replace(/\{village\}/g, village.villageName)
    .replace(/\{tagline\}/g, village.tagline)
}
