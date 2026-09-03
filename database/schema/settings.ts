import { boolean, jsonb, pgTable, varchar } from 'drizzle-orm/pg-core'
import { pk, timestamps } from './_shared'
import type {
  FeatureFlags,
  FooterConfig,
  ThemeConfig,
  VillageConfig,
} from '../../shared/types/config'

/**
 * Config tables are single-row (`key = 'default'`). Kept as tables (not a
 * generic key/value blob) so each concern is independently queryable and
 * migratable, while the flexible payload lives in a typed jsonb column.
 */

export const villageSettings = pgTable('village_settings', {
  id: pk(),
  key: varchar('key', { length: 40 }).notNull().unique().default('default'),
  data: jsonb('data').$type<VillageConfig>().notNull(),
  ...timestamps,
})

export const themeSettings = pgTable('theme_settings', {
  id: pk(),
  key: varchar('key', { length: 40 }).notNull().unique().default('default'),
  data: jsonb('data').$type<ThemeConfig>().notNull(),
  ...timestamps,
})

export const featureFlags = pgTable('feature_flags', {
  id: pk(),
  key: varchar('key', { length: 40 }).notNull().unique().default('default'),
  data: jsonb('data').$type<FeatureFlags>().notNull(),
  ...timestamps,
})

export const footerSettings = pgTable('footer_settings', {
  id: pk(),
  key: varchar('key', { length: 40 }).notNull().unique().default('default'),
  data: jsonb('data').$type<FooterConfig>().notNull(),
  ...timestamps,
})

/** Optional generic KV store for misc runtime flags (e.g. maintenance mode). */
export const appSettings = pgTable('app_settings', {
  id: pk(),
  namespace: varchar('namespace', { length: 60 }).notNull(),
  key: varchar('key', { length: 120 }).notNull(),
  value: jsonb('value').$type<unknown>(),
  isPublic: boolean('is_public').notNull().default(false),
  ...timestamps,
})
