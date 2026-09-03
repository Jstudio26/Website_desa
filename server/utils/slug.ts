import { and, eq, ne } from 'drizzle-orm'
import type { AnyPgColumn, PgTableWithColumns } from 'drizzle-orm/pg-core'
import { useDb } from './db'

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 200) || 'item'
}

/**
 * Produce a slug that is unique within a table. Appends -2, -3, ... on clash.
 * `ignoreId` lets an update keep its own slug.
 */
export async function uniqueSlug(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  table: PgTableWithColumns<any>,
  slugColumn: AnyPgColumn,
  idColumn: AnyPgColumn,
  desired: string,
  ignoreId?: string,
): Promise<string> {
  const db = useDb()
  const base = slugify(desired)
  let candidate = base
  let n = 1
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const where = ignoreId
      ? and(eq(slugColumn, candidate), ne(idColumn, ignoreId))
      : eq(slugColumn, candidate)
    const existing = await db.select({ x: idColumn }).from(table).where(where).limit(1)
    if (existing.length === 0) return candidate
    n += 1
    candidate = `${base}-${n}`
  }
}
