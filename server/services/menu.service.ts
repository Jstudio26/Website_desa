import { asc, eq } from 'drizzle-orm'
import { z } from 'zod'
import { useDb, schema } from '../utils/db'
import { errors } from '../utils/response'
import { bumpConfigCache } from '../utils/site-config'
import type { menuItemSchema, menuItemUpdateSchema, menuReorderSchema } from '../validators/menu'

export async function listMenus() {
  const db = useDb()
  return db.query.menus.findMany({
    with: { items: { orderBy: [asc(schema.menuItems.order)] } },
    orderBy: [asc(schema.menus.location)],
  })
}

export async function ensureMenu(location: 'primary' | 'footer' | 'utility', name: string) {
  const db = useDb()
  const found = await db.query.menus.findFirst({ where: eq(schema.menus.location, location) })
  if (found) return found
  const [created] = await db.insert(schema.menus).values({ name, location }).returning()
  return created!
}

export async function createMenuItem(input: z.infer<typeof menuItemSchema>) {
  const db = useDb()
  const menu = await db.query.menus.findFirst({ where: eq(schema.menus.id, input.menuId) })
  if (!menu) throw errors.notFound('Menu tidak ditemukan')
  const [row] = await db.insert(schema.menuItems).values(input).returning()
  bumpConfigCache()
  return row!
}

export async function updateMenuItem(id: string, input: z.infer<typeof menuItemUpdateSchema>) {
  const db = useDb()
  const [row] = await db
    .update(schema.menuItems)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(schema.menuItems.id, id))
    .returning()
  if (!row) throw errors.notFound('Item menu tidak ditemukan')
  bumpConfigCache()
  return row
}

export async function deleteMenuItem(id: string) {
  const db = useDb()
  // reparent children to top level to avoid orphans
  await db.update(schema.menuItems).set({ parentId: null }).where(eq(schema.menuItems.parentId, id))
  const [row] = await db.delete(schema.menuItems).where(eq(schema.menuItems.id, id)).returning()
  if (!row) throw errors.notFound('Item menu tidak ditemukan')
  bumpConfigCache()
  return { id }
}

export async function reorderMenuItems(input: z.infer<typeof menuReorderSchema>) {
  const db = useDb()
  await db.transaction(async (tx) => {
    for (const it of input.items) {
      await tx
        .update(schema.menuItems)
        .set({ parentId: it.parentId, order: it.order, updatedAt: new Date() })
        .where(eq(schema.menuItems.id, it.id))
    }
  })
  bumpConfigCache()
  return { updated: input.items.length }
}
