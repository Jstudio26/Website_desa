import { eq } from 'drizzle-orm'
import type {
  FeatureFlags,
  FooterConfig,
  ThemeConfig,
  VillageConfig,
} from '../../shared/types/config'
import {
  DEFAULT_FEATURES,
  DEFAULT_FOOTER,
  DEFAULT_THEME,
  DEFAULT_VILLAGE,
} from '../../config/defaults'
import { useDb, schema } from '../utils/db'
import { bumpConfigCache, getSiteConfig } from '../utils/site-config'

type ConfigTable =
  | typeof schema.villageSettings
  | typeof schema.themeSettings
  | typeof schema.featureFlags
  | typeof schema.footerSettings

async function readRow<T>(table: ConfigTable, fallback: T): Promise<T> {
  const db = useDb()
  const row = await db.select().from(table).where(eq(table.key, 'default')).limit(1)
  return (row[0]?.data as T) ?? fallback
}

async function writeRow<T>(table: ConfigTable, data: T): Promise<T> {
  const db = useDb()
  await db
    .insert(table)
    .values({ key: 'default', data: data as never })
    .onConflictDoUpdate({ target: table.key, set: { data: data as never, updatedAt: new Date() } })
  bumpConfigCache()
  return data
}

export const getVillageConfig = () => readRow<VillageConfig>(schema.villageSettings, DEFAULT_VILLAGE)
export const getThemeConfig = () => readRow<ThemeConfig>(schema.themeSettings, DEFAULT_THEME)
export const getFeatureFlags = () => readRow<FeatureFlags>(schema.featureFlags, DEFAULT_FEATURES)
export const getFooterConfig = () => readRow<FooterConfig>(schema.footerSettings, DEFAULT_FOOTER)

export const saveVillageConfig = (data: VillageConfig) => writeRow(schema.villageSettings, data)
export const saveThemeConfig = (data: ThemeConfig) => writeRow(schema.themeSettings, data)
export const saveFeatureFlags = (data: FeatureFlags) => writeRow(schema.featureFlags, data)
export const saveFooterConfig = (data: FooterConfig) => writeRow(schema.footerSettings, data)

/** Full resolved config for the public site (village + theme + features + footer + nav). */
export const getPublicSiteConfig = () => getSiteConfig(true)
