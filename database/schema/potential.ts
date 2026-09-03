import { boolean, index, integer, jsonb, pgEnum, pgTable, text, varchar } from 'drizzle-orm/pg-core'
import { pk, timestamps } from './_shared'

export const umkmCategoryEnum = pgEnum('umkm_category', [
  'kuliner',
  'kerajinan',
  'pertanian',
  'perikanan',
  'jasa',
  'perdagangan',
  'lainnya',
])

export const umkm = pgTable(
  'umkm',
  {
    id: pk(),
    name: varchar('name', { length: 200 }).notNull(),
    slug: varchar('slug', { length: 220 }).notNull().unique(),
    description: text('description').notNull().default(''),
    category: umkmCategoryEnum('category').notNull().default('lainnya'),
    owner: varchar('owner', { length: 180 }),
    products: text('products').array(),
    image: text('image'),
    gallery: jsonb('gallery').$type<string[]>().default([]),
    phone: varchar('phone', { length: 40 }),
    whatsapp: varchar('whatsapp', { length: 40 }),
    address: text('address'),
    mapUrl: text('map_url'),
    isFeatured: boolean('is_featured').notNull().default(false),
    isActive: boolean('is_active').notNull().default(true),
    displayOrder: integer('display_order').notNull().default(0),
    ...timestamps,
  },
  (t) => ({ categoryIdx: index('umkm_category_idx').on(t.category), slugIdx: index('umkm_slug_idx').on(t.slug) }),
)

export const tourismCategoryEnum = pgEnum('tourism_category', [
  'alam',
  'budaya',
  'buatan',
  'religi',
  'kuliner',
  'lainnya',
])

export const tourism = pgTable(
  'tourism',
  {
    id: pk(),
    name: varchar('name', { length: 200 }).notNull(),
    slug: varchar('slug', { length: 220 }).notNull().unique(),
    description: text('description').notNull().default(''),
    category: tourismCategoryEnum('category').notNull().default('alam'),
    location: varchar('location', { length: 260 }),
    latitude: varchar('latitude', { length: 40 }),
    longitude: varchar('longitude', { length: 40 }),
    coverImage: text('cover_image'),
    gallery: jsonb('gallery').$type<string[]>().default([]),
    openingHours: varchar('opening_hours', { length: 160 }),
    ticketPrice: varchar('ticket_price', { length: 120 }),
    facilities: text('facilities').array(),
    phone: varchar('phone', { length: 40 }),
    mapUrl: text('map_url'),
    isFeatured: boolean('is_featured').notNull().default(false),
    isActive: boolean('is_active').notNull().default(true),
    displayOrder: integer('display_order').notNull().default(0),
    ...timestamps,
  },
  (t) => ({ categoryIdx: index('tourism_category_idx').on(t.category), slugIdx: index('tourism_slug_idx').on(t.slug) }),
)
