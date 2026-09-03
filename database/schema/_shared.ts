import { sql } from 'drizzle-orm'
import { timestamp, uuid } from 'drizzle-orm/pg-core'

/** Standard audit columns for every table. */
export const timestamps = {
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
}

/** UUID primary key with DB-side default. */
export const pk = () => uuid('id').primaryKey().default(sql`gen_random_uuid()`)
