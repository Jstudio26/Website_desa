import { boolean, index, integer, jsonb, pgEnum, pgTable, text, uuid, varchar } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { pk, timestamps } from './_shared'
import type { PageSection, SectionSettings, SectionType } from '../../shared/types/sections'

export const pageStatusEnum = pgEnum('page_status', ['draft', 'published'])

/**
 * A CMS page. `isSystem` marks built-in routes (home, about-developer...) that
 * can be edited but not deleted. Body is an ordered list of page_sections.
 */
export const pages = pgTable(
  'pages',
  {
    id: pk(),
    title: varchar('title', { length: 200 }).notNull(),
    slug: varchar('slug', { length: 200 }).notNull().unique(),
    status: pageStatusEnum('status').notNull().default('draft'),
    isSystem: boolean('is_system').notNull().default(false),
    showInMenu: boolean('show_in_menu').notNull().default(false),
    seoTitle: varchar('seo_title', { length: 200 }),
    seoDescription: text('seo_description'),
    ogImage: text('og_image'),
    publishedAt: text('published_at'),
    ...timestamps,
  },
  (t) => ({ slugIdx: index('pages_slug_idx').on(t.slug), statusIdx: index('pages_status_idx').on(t.status) }),
)

export const pageSections = pgTable(
  'page_sections',
  {
    id: pk(),
    pageId: uuid('page_id')
      .notNull()
      .references(() => pages.id, { onDelete: 'cascade' }),
    type: varchar('type', { length: 40 }).$type<SectionType>().notNull(),
    order: integer('order').notNull().default(0),
    visible: boolean('visible').notNull().default(true),
    data: jsonb('data').$type<PageSection['data']>().notNull().default({}),
    settings: jsonb('settings').$type<SectionSettings>().notNull(),
    ...timestamps,
  },
  (t) => ({ pageIdx: index('page_sections_page_idx').on(t.pageId) }),
)

export const pagesRelations = relations(pages, ({ many }) => ({
  sections: many(pageSections),
}))
export const pageSectionsRelations = relations(pageSections, ({ one }) => ({
  page: one(pages, { fields: [pageSections.pageId], references: [pages.id] }),
}))
