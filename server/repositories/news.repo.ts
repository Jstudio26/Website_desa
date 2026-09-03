import { and, desc, eq, ilike, or, sql, type SQL } from 'drizzle-orm'
import { useDb, schema } from '../utils/db'
import type { Paginated } from '../../shared/types/api'

const authorCols = { columns: { id: true, name: true, avatar: true } } as const
const categoryCols = { columns: { id: true, name: true, slug: true, color: true } } as const

export interface NewsFilter {
  page: number
  pageSize: number
  q?: string
  status?: 'draft' | 'published' | 'archived' | 'all'
  categorySlug?: string
  featured?: boolean
}

export async function findNews(f: NewsFilter): Promise<Paginated<typeof schema.news.$inferSelect & {
  author: { id: string, name: string, avatar: string | null } | null
  category: { id: string, name: string, slug: string, color: string | null } | null
}>> {
  const db = useDb()
  const conds: SQL[] = []

  if (f.status && f.status !== 'all') conds.push(eq(schema.news.status, f.status))
  if (f.featured !== undefined) conds.push(eq(schema.news.isFeatured, f.featured))
  if (f.q) {
    conds.push(
      or(
        ilike(schema.news.title, `%${f.q}%`),
        ilike(schema.news.excerpt, `%${f.q}%`),
      )!,
    )
  }
  if (f.categorySlug) {
    const cat = await db.query.newsCategories.findFirst({
      where: eq(schema.newsCategories.slug, f.categorySlug),
      columns: { id: true },
    })
    conds.push(eq(schema.news.categoryId, cat?.id ?? '00000000-0000-0000-0000-000000000000'))
  }

  const where = conds.length ? and(...conds) : undefined

  const [rows, [countRow]] = await Promise.all([
    db.query.news.findMany({
      where,
      orderBy: [desc(sql`coalesce(${schema.news.publishedAt}, ${schema.news.createdAt})`)],
      limit: f.pageSize,
      offset: (f.page - 1) * f.pageSize,
      with: { author: authorCols, category: categoryCols },
    }),
    db.select({ c: sql<number>`count(*)::int` }).from(schema.news).where(where),
  ])

  const total = countRow?.c ?? 0
  return {
    items: rows as never,
    page: f.page,
    pageSize: f.pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / f.pageSize)),
  }
}

export function findNewsBySlug(slug: string) {
  const db = useDb()
  return db.query.news.findFirst({
    where: eq(schema.news.slug, slug),
    with: { author: authorCols, category: categoryCols },
  })
}

export function findNewsById(id: string) {
  const db = useDb()
  return db.query.news.findFirst({
    where: eq(schema.news.id, id),
    with: { author: authorCols, category: categoryCols },
  })
}

export async function incrementViews(id: string) {
  const db = useDb()
  await db
    .update(schema.news)
    .set({ viewCount: sql`${schema.news.viewCount} + 1` })
    .where(eq(schema.news.id, id))
}

export async function relatedNews(categoryId: string | null, excludeId: string, limit = 3) {
  const db = useDb()
  return db.query.news.findMany({
    where: and(
      eq(schema.news.status, 'published'),
      categoryId ? eq(schema.news.categoryId, categoryId) : undefined,
      sql`${schema.news.id} <> ${excludeId}`,
    ),
    orderBy: [desc(schema.news.publishedAt)],
    limit,
    with: { category: categoryCols },
  })
}
