import type { H3Event } from 'h3'
import { and, eq, isNull, gt } from 'drizzle-orm'
import type { AuthUser } from '../../shared/types/api'
import { useDb, schema } from '../utils/db'
import { errors } from '../utils/response'
import { verifyPassword } from '../utils/password'
import {
  generateRefreshToken,
  hashToken,
  signAccessToken,
  ttlSeconds,
} from '../utils/jwt'
import {
  clearAuthCookies,
  expandPermissions,
  REFRESH_COOKIE,
  setAuthCookies,
} from '../utils/session'
import { assertLoginNotThrottled, clientIp, recordLoginAttempt } from '../utils/rate-limit'
import { logActivity } from '../utils/activity'
import type { LoginInput } from '../validators/auth'

function toAuthUser(row: typeof schema.users.$inferSelect): AuthUser {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    avatar: row.avatar,
    permissions: expandPermissions(row.role),
  }
}

async function issueSession(event: H3Event, user: typeof schema.users.$inferSelect) {
  const db = useDb()
  const accessToken = await signAccessToken({
    sub: user.id,
    role: user.role,
    name: user.name,
    email: user.email,
  })
  const refreshRaw = generateRefreshToken()
  const refreshHash = await hashToken(refreshRaw)
  const expiresAt = new Date(Date.now() + ttlSeconds(useRuntimeConfig().jwtRefreshTtl) * 1000)

  await db.insert(schema.refreshTokens).values({
    userId: user.id,
    tokenHash: refreshHash,
    userAgent: getRequestHeader(event, 'user-agent') ?? null,
    ip: clientIp(event),
    expiresAt,
  })
  setAuthCookies(event, accessToken, refreshRaw)
}

export async function login(event: H3Event, input: LoginInput): Promise<AuthUser> {
  await assertLoginNotThrottled(event, input.email)
  const db = useDb()

  const user = await db.query.users.findFirst({
    where: eq(schema.users.email, input.email),
  })

  const ok = user ? await verifyPassword(input.password, user.passwordHash) : false
  await recordLoginAttempt(event, input.email, ok && !!user?.isActive)

  if (!user || !ok) throw errors.unauthorized('Email atau kata sandi salah')
  if (!user.isActive) throw errors.forbidden('Akun Anda dinonaktifkan')

  await db
    .update(schema.users)
    .set({ lastLoginAt: new Date() })
    .where(eq(schema.users.id, user.id))

  await issueSession(event, user)
  event.context.authUser = toAuthUser(user)
  await logActivity(event, { action: 'login', entity: 'auth', entityId: user.id, summary: `${user.name} masuk` })
  return toAuthUser(user)
}

export async function refresh(event: H3Event): Promise<AuthUser> {
  const raw = getCookie(event, REFRESH_COOKIE)
  if (!raw) throw errors.unauthorized('Sesi berakhir, silakan masuk kembali')
  const db = useDb()
  const tokenHash = await hashToken(raw)

  const record = await db.query.refreshTokens.findFirst({
    where: and(
      eq(schema.refreshTokens.tokenHash, tokenHash),
      isNull(schema.refreshTokens.revokedAt),
      gt(schema.refreshTokens.expiresAt, new Date()),
    ),
    with: { user: true },
  })
  if (!record || !record.user || !record.user.isActive) {
    clearAuthCookies(event)
    throw errors.unauthorized('Sesi tidak valid, silakan masuk kembali')
  }

  // Rotate: revoke the used token, issue a fresh pair.
  await db
    .update(schema.refreshTokens)
    .set({ revokedAt: new Date() })
    .where(eq(schema.refreshTokens.id, record.id))
  await issueSession(event, record.user)

  const authUser = toAuthUser(record.user)
  event.context.authUser = authUser
  return authUser
}

export async function logout(event: H3Event): Promise<void> {
  const raw = getCookie(event, REFRESH_COOKIE)
  if (raw) {
    const db = useDb()
    const tokenHash = await hashToken(raw)
    await db
      .update(schema.refreshTokens)
      .set({ revokedAt: new Date() })
      .where(eq(schema.refreshTokens.tokenHash, tokenHash))
  }
  clearAuthCookies(event)
  event.context.authUser = null
}
