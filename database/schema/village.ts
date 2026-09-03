import { boolean, index, integer, jsonb, numeric, pgEnum, pgTable, text, uuid, varchar } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { pk, timestamps } from './_shared'

export const officialGroupEnum = pgEnum('official_group', [
  'kepala_desa',
  'sekretariat',
  'kepala_urusan',
  'kepala_seksi',
  'kepala_dusun',
  'bpd',
  'lainnya',
])

export const governmentOfficials = pgTable(
  'government_officials',
  {
    id: pk(),
    name: varchar('name', { length: 180 }).notNull(),
    position: varchar('position', { length: 180 }).notNull(),
    group: officialGroupEnum('group').notNull().default('lainnya'),
    photo: text('photo'),
    nip: varchar('nip', { length: 60 }),
    bio: text('bio'),
    period: varchar('period', { length: 60 }),
    phone: varchar('phone', { length: 40 }),
    email: varchar('email', { length: 160 }),
    reportsToId: uuid('reports_to_id'),
    displayOrder: integer('display_order').notNull().default(0),
    isActive: boolean('is_active').notNull().default(true),
    ...timestamps,
  },
  (t) => ({ groupIdx: index('officials_group_idx').on(t.group) }),
)

export const officialsRelations = relations(governmentOfficials, ({ one }) => ({
  reportsTo: one(governmentOfficials, {
    fields: [governmentOfficials.reportsToId],
    references: [governmentOfficials.id],
  }),
}))

/**
 * Statistics groups (e.g. "Kependudukan", "Pendidikan") each holding a set of
 * data points. Renderable as bar / pie / line charts on the public site.
 */
export const statisticGroups = pgTable('statistic_groups', {
  id: pk(),
  title: varchar('title', { length: 180 }).notNull(),
  slug: varchar('slug', { length: 200 }).notNull().unique(),
  description: text('description'),
  chartType: varchar('chart_type', { length: 20 }).notNull().default('bar'), // bar | pie | line | number
  unit: varchar('unit', { length: 40 }),
  year: integer('year'),
  displayOrder: integer('display_order').notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),
  ...timestamps,
})

export const villageStatistics = pgTable(
  'village_statistics',
  {
    id: pk(),
    groupId: uuid('group_id')
      .notNull()
      .references(() => statisticGroups.id, { onDelete: 'cascade' }),
    label: varchar('label', { length: 180 }).notNull(),
    value: numeric('value').notNull().default('0'),
    color: varchar('color', { length: 20 }),
    icon: varchar('icon', { length: 60 }),
    meta: jsonb('meta').$type<Record<string, unknown>>(),
    displayOrder: integer('display_order').notNull().default(0),
    ...timestamps,
  },
  (t) => ({ groupIdx: index('village_statistics_group_idx').on(t.groupId) }),
)

export const statisticGroupsRelations = relations(statisticGroups, ({ many }) => ({
  points: many(villageStatistics),
}))
export const villageStatisticsRelations = relations(villageStatistics, ({ one }) => ({
  group: one(statisticGroups, { fields: [villageStatistics.groupId], references: [statisticGroups.id] }),
}))
