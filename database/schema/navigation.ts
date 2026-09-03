import { boolean, index, integer, pgEnum, pgTable, uuid, varchar } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { pk, timestamps } from './_shared'

export const menuLocationEnum = pgEnum('menu_location', ['primary', 'footer', 'utility'])

/** A named menu bound to a location in the layout. */
export const menus = pgTable('menus', {
  id: pk(),
  name: varchar('name', { length: 120 }).notNull(),
  location: menuLocationEnum('location').notNull().default('primary'),
  ...timestamps,
})

/** Self-referencing tree of items. `parentId` null = top level. */
export const menuItems = pgTable(
  'menu_items',
  {
    id: pk(),
    menuId: uuid('menu_id')
      .notNull()
      .references(() => menus.id, { onDelete: 'cascade' }),
    parentId: uuid('parent_id'),
    label: varchar('label', { length: 160 }).notNull(),
    url: varchar('url', { length: 400 }).notNull().default('/'),
    icon: varchar('icon', { length: 60 }),
    target: varchar('target', { length: 10 }).notNull().default('_self'),
    visible: boolean('visible').notNull().default(true),
    order: integer('order').notNull().default(0),
    ...timestamps,
  },
  (t) => ({
    menuIdx: index('menu_items_menu_idx').on(t.menuId),
    parentIdx: index('menu_items_parent_idx').on(t.parentId),
  }),
)

export const menusRelations = relations(menus, ({ many }) => ({
  items: many(menuItems),
}))
export const menuItemsRelations = relations(menuItems, ({ one }) => ({
  menu: one(menus, { fields: [menuItems.menuId], references: [menus.id] }),
  parent: one(menuItems, { fields: [menuItems.parentId], references: [menuItems.id], relationName: 'children' }),
}))
