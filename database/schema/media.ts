import { bigint, boolean, index, integer, pgEnum, pgTable, text, uuid, varchar } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { pk, timestamps } from './_shared'
import { users } from './auth'

export const mediaKindEnum = pgEnum('media_kind', ['image', 'video', 'document', 'audio', 'other'])

/** Optional folder tree for the Media Library. */
export const mediaFolders = pgTable('media_folders', {
  id: pk(),
  name: varchar('name', { length: 160 }).notNull(),
  parentId: uuid('parent_id'),
  ...timestamps,
})

export const media = pgTable(
  'media',
  {
    id: pk(),
    folderId: uuid('folder_id').references(() => mediaFolders.id, { onDelete: 'set null' }),
    kind: mediaKindEnum('kind').notNull().default('image'),
    filename: varchar('filename', { length: 300 }).notNull(),
    originalName: varchar('original_name', { length: 300 }).notNull(),
    mimeType: varchar('mime_type', { length: 120 }).notNull(),
    extension: varchar('extension', { length: 20 }),
    size: bigint('size', { mode: 'number' }).notNull().default(0),
    width: integer('width'),
    height: integer('height'),
    // storage driver + key so a file can be resolved regardless of backend
    storageDriver: varchar('storage_driver', { length: 20 }).notNull().default('local'),
    storageKey: text('storage_key').notNull(),
    url: text('url').notNull(),
    alt: varchar('alt', { length: 300 }),
    caption: text('caption'),
    uploadedById: uuid('uploaded_by_id').references(() => users.id, { onDelete: 'set null' }),
    ...timestamps,
  },
  (t) => ({
    kindIdx: index('media_kind_idx').on(t.kind),
    folderIdx: index('media_folder_idx').on(t.folderId),
    createdIdx: index('media_created_idx').on(t.createdAt),
  }),
)

export const mediaFoldersRelations = relations(mediaFolders, ({ many, one }) => ({
  items: many(media),
  parent: one(mediaFolders, { fields: [mediaFolders.parentId], references: [mediaFolders.id] }),
}))
export const mediaRelations = relations(media, ({ one }) => ({
  folder: one(mediaFolders, { fields: [media.folderId], references: [mediaFolders.id] }),
  uploadedBy: one(users, { fields: [media.uploadedById], references: [users.id] }),
}))

/* ---------------- Galleries ---------------- */

export const galleries = pgTable('galleries', {
  id: pk(),
  title: varchar('title', { length: 200 }).notNull(),
  slug: varchar('slug', { length: 220 }).notNull().unique(),
  description: text('description'),
  coverImage: text('cover_image'),
  isPublished: boolean('is_published').notNull().default(true),
  displayOrder: integer('display_order').notNull().default(0),
  ...timestamps,
})

export const galleryItems = pgTable(
  'gallery_items',
  {
    id: pk(),
    galleryId: uuid('gallery_id')
      .notNull()
      .references(() => galleries.id, { onDelete: 'cascade' }),
    mediaId: uuid('media_id').references(() => media.id, { onDelete: 'set null' }),
    imageUrl: text('image_url').notNull(),
    caption: text('caption'),
    displayOrder: integer('display_order').notNull().default(0),
    ...timestamps,
  },
  (t) => ({ galleryIdx: index('gallery_items_gallery_idx').on(t.galleryId) }),
)

export const galleriesRelations = relations(galleries, ({ many }) => ({
  items: many(galleryItems),
}))
export const galleryItemsRelations = relations(galleryItems, ({ one }) => ({
  gallery: one(galleries, { fields: [galleryItems.galleryId], references: [galleries.id] }),
  media: one(media, { fields: [galleryItems.mediaId], references: [media.id] }),
}))

/* ---------------- Documents (transparency & general) ---------------- */

export const documentCategoryEnum = pgEnum('document_category', [
  'apbdes',
  'pendapatan',
  'belanja',
  'realisasi',
  'perdes',
  'lpj',
  'publik',
  'lainnya',
])

export const documents = pgTable(
  'documents',
  {
    id: pk(),
    title: varchar('title', { length: 260 }).notNull(),
    description: text('description'),
    category: documentCategoryEnum('category').notNull().default('publik'),
    year: integer('year'),
    mediaId: uuid('media_id').references(() => media.id, { onDelete: 'set null' }),
    fileUrl: text('file_url').notNull(),
    fileType: varchar('file_type', { length: 20 }),
    fileSize: bigint('file_size', { mode: 'number' }).default(0),
    downloadCount: integer('download_count').notNull().default(0),
    isPublished: boolean('is_published').notNull().default(true),
    ...timestamps,
  },
  (t) => ({
    categoryIdx: index('documents_category_idx').on(t.category),
    yearIdx: index('documents_year_idx').on(t.year),
  }),
)
