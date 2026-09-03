import { index, jsonb, pgTable, text, uuid, varchar } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { pk, timestamps } from './_shared'
import { users } from './auth'

/** Audit trail for admin actions. */
export const activityLogs = pgTable(
  'activity_logs',
  {
    id: pk(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
    action: varchar('action', { length: 60 }).notNull(), // create | update | delete | login | ...
    entity: varchar('entity', { length: 60 }).notNull(), // news | settings | user | ...
    entityId: varchar('entity_id', { length: 60 }),
    summary: text('summary'),
    diff: jsonb('diff').$type<Record<string, unknown>>(),
    ip: varchar('ip', { length: 64 }),
    ...timestamps,
  },
  (t) => ({
    userIdx: index('activity_logs_user_idx').on(t.userId),
    entityIdx: index('activity_logs_entity_idx').on(t.entity),
    createdIdx: index('activity_logs_created_idx').on(t.createdAt),
  }),
)

/** Lightweight page-view counter for the dashboard "pengunjung" widget. */
export const pageViews = pgTable(
  'page_views',
  {
    id: pk(),
    path: varchar('path', { length: 300 }).notNull(),
    referrer: text('referrer'),
    sessionHash: varchar('session_hash', { length: 64 }),
    ...timestamps,
  },
  (t) => ({
    pathIdx: index('page_views_path_idx').on(t.path),
    createdIdx: index('page_views_created_idx').on(t.createdAt),
  }),
)

export const activityLogsRelations = relations(activityLogs, ({ one }) => ({
  user: one(users, { fields: [activityLogs.userId], references: [users.id] }),
}))
