import { and, asc, desc, eq, gte } from 'drizzle-orm'
import { useDb, schema } from '../utils/db'
import { getSiteConfig } from '../utils/site-config'
import { homepageNews } from './news.service'

/**
 * Aggregated payload for the homepage. Every block respects its feature flag so
 * disabling a module in the CMS instantly removes it from the landing page.
 */
export async function getHomepagePayload() {
  const db = useDb()
  const { features } = await getSiteConfig()
  const now = new Date()

  const [news, announcements, events, umkm, tourism, galleries, stats, officials] = await Promise.all([
    features.enableNews ? homepageNews(7) : Promise.resolve({ featured: null, rest: [] }),
    features.enableAnnouncements
      ? db.query.announcements.findMany({
          where: eq(schema.announcements.status, 'published'),
          orderBy: [desc(schema.announcements.isPinned), desc(schema.announcements.publishedAt)],
          limit: 4,
        })
      : Promise.resolve([]),
    features.enableEvents
      ? db.query.events.findMany({
          where: and(eq(schema.events.status, 'published'), gte(schema.events.startAt, now)),
          orderBy: [asc(schema.events.startAt)],
          limit: 4,
        })
      : Promise.resolve([]),
    features.enableUMKM
      ? db.query.umkm.findMany({
          where: eq(schema.umkm.isActive, true),
          orderBy: [desc(schema.umkm.isFeatured), asc(schema.umkm.displayOrder)],
          limit: 6,
        })
      : Promise.resolve([]),
    features.enableTourism
      ? db.query.tourism.findMany({
          where: eq(schema.tourism.isActive, true),
          orderBy: [desc(schema.tourism.isFeatured), asc(schema.tourism.displayOrder)],
          limit: 6,
        })
      : Promise.resolve([]),
    features.enableGallery
      ? db.query.galleries.findMany({
          where: eq(schema.galleries.isPublished, true),
          orderBy: [asc(schema.galleries.displayOrder)],
          limit: 1,
          with: { items: { orderBy: [asc(schema.galleryItems.displayOrder)], limit: 10 } },
        })
      : Promise.resolve([]),
    features.enableStatistics
      ? db.query.statisticGroups.findMany({
          where: eq(schema.statisticGroups.isActive, true),
          orderBy: [asc(schema.statisticGroups.displayOrder)],
          with: { points: { orderBy: [asc(schema.villageStatistics.displayOrder)] } },
        })
      : Promise.resolve([]),
    features.enableGovernment
      ? db.query.governmentOfficials.findMany({
          where: and(
            eq(schema.governmentOfficials.isActive, true),
            eq(schema.governmentOfficials.group, 'kepala_desa'),
          ),
          limit: 1,
        })
      : Promise.resolve([]),
  ])

  return {
    news,
    announcements,
    events,
    umkm,
    tourism,
    gallery: galleries[0] ?? null,
    statistics: stats,
    headman: officials[0] ?? null,
  }
}
