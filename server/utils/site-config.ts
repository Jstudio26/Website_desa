import { asc, eq } from 'drizzle-orm'
import type { MenuTree, SiteConfig } from '../../shared/types/config'
import {
  DEFAULT_FEATURES,
  DEFAULT_FOOTER,
  DEFAULT_THEME,
  DEFAULT_VILLAGE,
} from '../../config/defaults'
import { useDb, schema } from './db'

let cache: { value: SiteConfig, at: number } | null = null
const TTL_MS = 30_000

export function bumpConfigCache() {
  cache = null
}

function buildMenuTree(items: typeof schema.menuItems.$inferSelect[]): MenuTree[] {
  const byParent = new Map<string | null, typeof items>()
  for (const it of items) {
    const key = it.parentId ?? null
    const arr = byParent.get(key) ?? []
    arr.push(it)
    byParent.set(key, arr)
  }
  const toNode = (it: (typeof items)[number]): MenuTree => ({
    id: it.id,
    label: it.label,
    url: it.url,
    icon: it.icon,
    target: (it.target as '_self' | '_blank') ?? '_self',
    visible: it.visible,
    order: it.order,
    children: (byParent.get(it.id) ?? [])
      .filter((c) => c.visible)
      .sort((a, b) => a.order - b.order)
      .map(toNode),
  })
  return (byParent.get(null) ?? [])
    .filter((c) => c.visible)
    .sort((a, b) => a.order - b.order)
    .map(toNode)
}

/** Assemble the full resolved site config (cached). */
export async function getSiteConfig(force = false): Promise<SiteConfig> {
  if (!force && cache && Date.now() - cache.at < TTL_MS) return cache.value

  const db = useDb()
  const [village, theme, features, footer, primaryMenu] = await Promise.all([
    db.query.villageSettings.findFirst({ where: eq(schema.villageSettings.key, 'default') }),
    db.query.themeSettings.findFirst({ where: eq(schema.themeSettings.key, 'default') }),
    db.query.featureFlags.findFirst({ where: eq(schema.featureFlags.key, 'default') }),
    db.query.footerSettings.findFirst({ where: eq(schema.footerSettings.key, 'default') }),
    db.query.menus.findFirst({
      where: eq(schema.menus.location, 'primary'),
      with: { items: { orderBy: [asc(schema.menuItems.order)] } },
    }),
  ])

  const value: SiteConfig = {
    village: { ...DEFAULT_VILLAGE, ...(village?.data ?? {}) },
    theme: { ...DEFAULT_THEME, ...(theme?.data ?? {}) },
    features: { ...DEFAULT_FEATURES, ...(features?.data ?? {}) },
    footer: { ...DEFAULT_FOOTER, ...(footer?.data ?? {}) },
    navigation: primaryMenu ? buildMenuTree(primaryMenu.items) : [],
  }

  cache = { value, at: Date.now() }
  return value
}
