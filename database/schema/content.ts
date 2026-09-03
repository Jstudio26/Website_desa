import { boolean, index, integer, pgEnum, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { pk, timestamps } from './_shared'
import { users } from './auth'

export const publishStatusEnum = pgEnum('publish_status', ['draft', 'published', 'archived'])

export const newsCategories = pgTable('news_categories', {
  id: pk(),
  name: varchar('name', { length: 120 }).notNull(),
  slug: varchar('slug', { length: 140 }).notNull().unique(),
  description: text('description'),
  color: varchar('color', { length: 20 }),
  ...timestamps,
})

export const news = pgTable(
  'news',
  {
    id: pk(),
    title: varchar('title', { length: 260 }).notNull(),
    slug: varchar('slug', { length: 280 }).notNull().unique(),
    excerpt: text('excerpt'),
    content: text('content').notNull().default(''),
    featuredImage: text('featured_image'),
    categoryId: uuid('category_id').references(() => newsCategories.id, { onDelete: 'set null' }),
    authorId: uuid('author_id').references(() => users.id, { onDelete: 'set null' }),
    status: publishStatusEnum('status').notNull().default('draft'),
    isFeatured: boolean('is_featured').notNull().default(false),
    viewCount: integer('view_count').notNull().default(0),
    tags: text('tags').array(),
    publishedAt: timestamp('published_at', { withTimezone: true }),
    ...timestamps,
  },
  (t) => ({
    slugIdx: index('news_slug_idx').on(t.slug),
    statusIdx: index('news_status_idx').on(t.status),
    categoryIdx: index('news_category_idx').on(t.categoryId),
    publishedIdx: index('news_published_idx').on(t.publishedAt),
  }),
)

export const announcements = pgTable(
  'announcements',
  {
    id: pk(),
    title: varchar('title', { length: 260 }).notNull(),
    slug: varchar('slug', { length: 280 }).notNull().unique(),
    content: text('content').notNull().default(''),
    attachment: text('attachment'),
    isPinned: boolean('is_pinned').notNull().default(false),
    status: publishStatusEnum('status').notNull().default('draft'),
    publishedAt: timestamp('published_at', { withTimezone: true }),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    ...timestamps,
  },
  (t) => ({
    slugIdx: index('announcements_slug_idx').on(t.slug),
    statusIdx: index('announcements_status_idx').on(t.status),
  }),
)

export const events = pgTable(
  'events',
  {
    id: pk(),
    title: varchar('title', { length: 260 }).notNull(),
    slug: varchar('slug', { length: 280 }).notNull().unique(),
    description: text('description').notNull().default(''),
    poster: text('poster'),
    location: varchar('location', { length: 260 }),
    startAt: timestamp('start_at', { withTimezone: true }).notNull(),
    endAt: timestamp('end_at', { withTimezone: true }),
    isAllDay: boolean('is_all_day').notNull().default(false),
    status: publishStatusEnum('status').notNull().default('draft'),
    ...timestamps,
  },
  (t) => ({
    slugIdx: index('events_slug_idx').on(t.slug),
    startIdx: index('events_start_idx').on(t.startAt),
    statusIdx: index('events_status_idx').on(t.status),
  }),
)

export const newsRelations = relations(news, ({ one }) => ({
  category: one(newsCategories, { fields: [news.categoryId], references: [newsCategories.id] }),
  author: one(users, { fields: [news.authorId], references: [users.id] }),
}))
export const newsCategoriesRelations = relations(newsCategories, ({ many }) => ({
  news: many(news),
}))
