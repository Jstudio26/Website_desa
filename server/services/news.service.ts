import { z } from 'zod'
import { and, asc, eq } from 'drizzle-orm'
import { useDb, schema } from '../utils/db'
import { errors } from '../utils/response'
import { uniqueSlug, slugify } from '../utils/slug'
import * as repo from '../repositories/news.repo'
import type { newsCreateSchema, newsUpdateSchema, categorySchema } from '../validators/news'

export const listNews = repo.findNews

export async function getPublicNews(slug: string) {
  const row = await repo.findNewsBySlug(slug)
  if (!row || row.status !== 'published') throw errors.notFound('Berita tidak ditemukan')
  await repo.incrementViews(row.id)
  const related = await repo.relatedNews(row.categoryId, row.id)
  return { article: row, related }
}

export async function getAdminNews(id: string) {
  const row = await repo.findNewsById(id)
  if (!row) throw errors.notFound('Berita tidak ditemukan')
  return row
}

export async function createNews(input: z.infer<typeof newsCreateSchema>, authorId: string) {
  const db = useDb()
  const slug = await uniqueSlug(schema.news, schema.news.slug, schema.news.id, input.slug || input.title)
  const publishedAt =
    input.status === 'published'
      ? input.publishedAt
        ? new Date(input.publishedAt)
        : new Date()
      : input.publishedAt
        ? new Date(input.publishedAt)
        : null

  const [row] = await db
    .insert(schema.news)
    .values({
      title: input.title,
      slug,
      excerpt: input.excerpt ?? '',
      content: input.content ?? '',
      featuredImage: input.featuredImage ?? null,
      categoryId: input.categoryId ?? null,
      authorId,
      status: input.status,
      isFeatured: input.isFeatured ?? false,
      tags: input.tags ?? [],
      publishedAt,
    })
    .returning()
  return row!
}

export async function updateNews(id: string, input: z.infer<typeof newsUpdateSchema>) {
  const db = useDb()
  const current = await repo.findNewsById(id)
  if (!current) throw errors.notFound('Berita tidak ditemukan')

  const patch: Partial<typeof schema.news.$inferInsert> = { updatedAt: new Date() }
  if (input.title !== undefined) patch.title = input.title
  if (input.slug !== undefined && input.slug !== current.slug) {
    patch.slug = await uniqueSlug(schema.news, schema.news.slug, schema.news.id, input.slug, id)
  }
  if (input.excerpt !== undefined) patch.excerpt = input.excerpt
  if (input.content !== undefined) patch.content = input.content
  if (input.featuredImage !== undefined) patch.featuredImage = input.featuredImage
  if (input.categoryId !== undefined) patch.categoryId = input.categoryId
  if (input.isFeatured !== undefined) patch.isFeatured = input.isFeatured
  if (input.tags !== undefined) patch.tags = input.tags
  if (input.publishedAt !== undefined) patch.publishedAt = input.publishedAt ? new Date(input.publishedAt) : null
  if (input.status !== undefined) {
    patch.status = input.status
    if (input.status === 'published' && !current.publishedAt && input.publishedAt === undefined) {
      patch.publishedAt = new Date()
    }
  }

  const [row] = await db.update(schema.news).set(patch).where(eq(schema.news.id, id)).returning()
  return row!
}

export async function deleteNews(id: string) {
  const db = useDb()
  const [row] = await db.delete(schema.news).where(eq(schema.news.id, id)).returning({ id: schema.news.id })
  if (!row) throw errors.notFound('Berita tidak ditemukan')
  return { id }
}

/* -------- categories -------- */
export function listCategories() {
  return useDb().query.newsCategories.findMany({ orderBy: [asc(schema.newsCategories.name)] })
}

export async function createCategory(input: z.infer<typeof categorySchema>) {
  const db = useDb()
  const slug = await uniqueSlug(
    schema.newsCategories,
    schema.newsCategories.slug,
    schema.newsCategories.id,
    input.slug || input.name,
  )
  const [row] = await db
    .insert(schema.newsCategories)
    .values({ name: input.name, slug, description: input.description, color: input.color })
    .returning()
  return row!
}

export async function updateCategory(id: string, input: Partial<z.infer<typeof categorySchema>>) {
  const db = useDb()
  const patch: Partial<typeof schema.newsCategories.$inferInsert> = { updatedAt: new Date() }
  if (input.name !== undefined) patch.name = input.name
  if (input.slug !== undefined) patch.slug = slugify(input.slug)
  if (input.description !== undefined) patch.description = input.description
  if (input.color !== undefined) patch.color = input.color
  const [row] = await db
    .update(schema.newsCategories)
    .set(patch)
    .where(eq(schema.newsCategories.id, id))
    .returning()
  if (!row) throw errors.notFound('Kategori tidak ditemukan')
  return row
}

export async function deleteCategory(id: string) {
  const db = useDb()
  await db.delete(schema.newsCategories).where(eq(schema.newsCategories.id, id))
  return { id }
}

/** Homepage helper: newest published + featured split. */
export async function homepageNews(limit = 7) {
  const db = useDb()
  const items = await db.query.news.findMany({
    where: eq(schema.news.status, 'published'),
    orderBy: (n, { desc }) => [desc(n.publishedAt)],
    limit,
    with: {
      category: { columns: { id: true, name: true, slug: true, color: true } },
      author: { columns: { id: true, name: true } },
    },
  })
  const featured = items.find((n) => n.isFeatured) ?? items[0] ?? null
  const rest = items.filter((n) => n.id !== featured?.id).slice(0, 6)
  return { featured, rest }
}

void and
