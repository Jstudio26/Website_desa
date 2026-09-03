import { z, zId, zSlug, zPagination } from '../utils/validation'

export const newsListQuery = zPagination.extend({
  status: z.enum(['draft', 'published', 'archived', 'all']).default('published'),
  category: zSlug.optional(),
  featured: z.coerce.boolean().optional(),
})

export const newsAdminListQuery = newsListQuery.extend({
  status: z.enum(['draft', 'published', 'archived', 'all']).default('all'),
})

export const newsCreateSchema = z.object({
  title: z.string().min(3).max(260),
  slug: zSlug.optional(),
  excerpt: z.string().max(500).optional().default(''),
  content: z.string().default(''),
  featuredImage: z.string().max(500).nullable().default(null),
  categoryId: zId.nullable().default(null),
  status: z.enum(['draft', 'published', 'archived']).default('draft'),
  isFeatured: z.boolean().default(false),
  tags: z.array(z.string().max(40)).max(20).default([]),
  publishedAt: z.string().datetime().nullable().optional(),
})

export const newsUpdateSchema = newsCreateSchema.partial()

export const categorySchema = z.object({
  name: z.string().min(1).max(120),
  slug: zSlug.optional(),
  description: z.string().max(400).optional(),
  color: z.string().max(20).optional(),
})
