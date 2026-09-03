import type { H3Event } from 'h3'
import { desc } from 'drizzle-orm'
import { useDb, schema } from './db'
import { clientIp } from './rate-limit'

interface LogInput {
  action: 'create' | 'update' | 'delete' | 'login' | 'logout' | 'publish' | 'process'
  entity: string
  entityId?: string | null
  summary?: string
  diff?: Record<string, unknown>
}

/** Fire-and-forget audit log entry. Never throws into the request path. */
export async function logActivity(event: H3Event, input: LogInput) {
  try {
    const db = useDb()
    await db.insert(schema.activityLogs).values({
      userId: event.context.authUser?.id ?? null,
      action: input.action,
      entity: input.entity,
      entityId: input.entityId ?? null,
      summary: input.summary ?? null,
      diff: input.diff ?? null,
      ip: clientIp(event),
    })
  }
  catch (err) {
    console.error('[activity] failed to log', err)
  }
}

export async function recentActivity(limit = 15) {
  const db = useDb()
  return db.query.activityLogs.findMany({
    orderBy: [desc(schema.activityLogs.createdAt)],
    limit,
    with: { user: { columns: { id: true, name: true, avatar: true } } },
  })
}
