import { and, eq, gte, sql } from 'drizzle-orm'
import type { H3Event } from 'h3'
import { useDb, schema } from './db'
import { errors } from './response'

export function clientIp(event: H3Event): string {
  return (
    getRequestHeader(event, 'x-forwarded-for')?.split(',')[0]?.trim()
    || getRequestHeader(event, 'x-real-ip')
    || event.node.req.socket.remoteAddress
    || '0.0.0.0'
  )
}

/**
 * DB-backed login throttle. Blocks once failed attempts for an email OR ip
 * exceed the configured max inside the rolling window.
 */
export async function assertLoginNotThrottled(event: H3Event, email: string) {
  const cfg = useRuntimeConfig()
  const max = Number(cfg.loginRateLimitMax)
  const windowSec = Number(cfg.loginRateLimitWindow)
  const since = new Date(Date.now() - windowSec * 1000)
  const ip = clientIp(event)
  const db = useDb()

  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(schema.loginAttempts)
    .where(
      and(
        eq(schema.loginAttempts.success, false),
        gte(schema.loginAttempts.createdAt, since),
        sql`(${schema.loginAttempts.email} = ${email.toLowerCase()} OR ${schema.loginAttempts.ip} = ${ip}::inet)`,
      ),
    )

  if ((row?.count ?? 0) >= max) {
    throw errors.tooMany(
      `Terlalu banyak percobaan masuk. Coba lagi dalam ${Math.ceil(windowSec / 60)} menit.`,
    )
  }
}

export async function recordLoginAttempt(event: H3Event, email: string, success: boolean) {
  const db = useDb()
  await db.insert(schema.loginAttempts).values({
    email: email.toLowerCase(),
    ip: clientIp(event),
    success,
  })
}
