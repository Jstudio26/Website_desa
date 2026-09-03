import { gte, sql, type SQL } from 'drizzle-orm'
import type { PgTable } from 'drizzle-orm/pg-core'
import { useDb, schema } from '../utils/db'
import { recentActivity } from '../utils/activity'

function countRows(table: PgTable, where?: SQL): Promise<number> {
  const db = useDb()
  const q = db.select({ c: sql<number>`count(*)::int` }).from(table)
  return (where ? q.where(where) : q).then((r) => r[0]?.c ?? 0)
}

export async function getDashboardSummary() {
  const db = useDb()
  const since30 = new Date(Date.now() - 30 * 86400_000)

  const [
    news, announcements, events, umkm, tourism, documents, galleries, media, pendingRequests, visitors30,
  ] = await Promise.all([
    countRows(schema.news),
    countRows(schema.announcements),
    countRows(schema.events),
    countRows(schema.umkm),
    countRows(schema.tourism),
    countRows(schema.documents),
    countRows(schema.galleries),
    countRows(schema.media),
    countRows(
      schema.serviceRequests,
      sql`${schema.serviceRequests.status} in ('submitted','in_review','need_revision')`,
    ),
    db
      .select({ c: sql<number>`count(distinct ${schema.pageViews.sessionHash})::int` })
      .from(schema.pageViews)
      .where(gte(schema.pageViews.createdAt, since30))
      .then((r) => r[0]?.c ?? 0),
  ])

  return {
    counts: { news, announcements, events, umkm, tourism, documents, galleries, media, pendingRequests },
    visitors30,
    activity: await recentActivity(12),
  }
}
