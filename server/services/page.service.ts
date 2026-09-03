import { asc, eq } from 'drizzle-orm'
import { z } from 'zod'
import { useDb, schema } from '../utils/db'
import { errors } from '../utils/response'
import { uniqueSlug } from '../utils/slug'
import { defaultSectionSettings, SECTION_TYPES } from '../../shared/types/sections'

export const sectionInputSchema = z.object({
  id: z.string().optional(),
  type: z.enum(SECTION_TYPES),
  visible: z.boolean().default(true),
  order: z.number().int().min(0).default(0),
  data: z.record(z.unknown()).default({}),
  settings: z.record(z.unknown()).optional(),
})

export const pageCreateSchema = z.object({
  title: z.string().min(1).max(200),
  slug: z.string().max(200).optional(),
  status: z.enum(['draft', 'published']).default('draft'),
  showInMenu: z.boolean().default(false),
  seoTitle: z.string().max(200).nullable().default(null),
  seoDescription: z.string().max(400).nullable().default(null),
  ogImage: z.string().max(500).nullable().default(null),
  sections: z.array(sectionInputSchema).default([]),
})
export const pageUpdateSchema = pageCreateSchema.partial()

export function listPages() {
  return useDb().query.pages.findMany({ orderBy: [asc(schema.pages.title)] })
}

export async function getPageBySlug(slug: string, opts: { publishedOnly?: boolean } = {}) {
  const db = useDb()
  const page = await db.query.pages.findFirst({
    where: eq(schema.pages.slug, slug),
    with: { sections: { orderBy: [asc(schema.pageSections.order)] } },
  })
  if (!page) throw errors.notFound('Halaman tidak ditemukan')
  if (opts.publishedOnly && page.status !== 'published') throw errors.notFound('Halaman tidak ditemukan')
  return page
}

async function replaceSections(pageId: string, sections: z.infer<typeof sectionInputSchema>[]) {
  const db = useDb()
  await db.delete(schema.pageSections).where(eq(schema.pageSections.pageId, pageId))
  if (!sections.length) return
  await db.insert(schema.pageSections).values(
    sections.map((s, i) => ({
      pageId,
      type: s.type,
      order: s.order ?? i,
      visible: s.visible,
      data: s.data as never,
      settings: { ...defaultSectionSettings(), ...(s.settings ?? {}) } as never,
    })),
  )
}

export async function createPage(input: z.infer<typeof pageCreateSchema>) {
  const db = useDb()
  const slug = await uniqueSlug(schema.pages, schema.pages.slug, schema.pages.id, input.slug || input.title)
  const [page] = await db
    .insert(schema.pages)
    .values({
      title: input.title,
      slug,
      status: input.status,
      showInMenu: input.showInMenu,
      seoTitle: input.seoTitle,
      seoDescription: input.seoDescription,
      ogImage: input.ogImage,
      publishedAt: input.status === 'published' ? new Date().toISOString() : null,
    })
    .returning()
  await replaceSections(page!.id, input.sections ?? [])
  return getPageBySlug(page!.slug)
}

export async function updatePage(id: string, input: z.infer<typeof pageUpdateSchema>) {
  const db = useDb()
  const current = await db.query.pages.findFirst({ where: eq(schema.pages.id, id) })
  if (!current) throw errors.notFound('Halaman tidak ditemukan')

  const patch: Partial<typeof schema.pages.$inferInsert> = { updatedAt: new Date() }
  if (input.title !== undefined) patch.title = input.title
  if (input.slug !== undefined && input.slug !== current.slug && !current.isSystem) {
    patch.slug = await uniqueSlug(schema.pages, schema.pages.slug, schema.pages.id, input.slug, id)
  }
  if (input.status !== undefined) {
    patch.status = input.status
    if (input.status === 'published' && !current.publishedAt) patch.publishedAt = new Date().toISOString()
  }
  if (input.showInMenu !== undefined) patch.showInMenu = input.showInMenu
  if (input.seoTitle !== undefined) patch.seoTitle = input.seoTitle
  if (input.seoDescription !== undefined) patch.seoDescription = input.seoDescription
  if (input.ogImage !== undefined) patch.ogImage = input.ogImage

  await db.update(schema.pages).set(patch).where(eq(schema.pages.id, id))
  if (input.sections !== undefined) await replaceSections(id, input.sections)
  return getPageBySlug(patch.slug ?? current.slug)
}

export async function deletePage(id: string) {
  const db = useDb()
  const current = await db.query.pages.findFirst({ where: eq(schema.pages.id, id) })
  if (!current) throw errors.notFound('Halaman tidak ditemukan')
  if (current.isSystem) throw errors.forbidden('Halaman sistem tidak dapat dihapus')
  await db.delete(schema.pages).where(eq(schema.pages.id, id))
  return { id }
}
