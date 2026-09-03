import type { H3Event } from 'h3'
import { eq } from 'drizzle-orm'
import type { AuthUser } from '../../shared/types/api'
import type { Permission, Role } from '../../shared/types/rbac'
import { PERMISSIONS, ROLE_PERMISSIONS, hasPermission } from '../../shared/types/rbac'
import { errors } from './response'
import { verifyAccessToken, ttlSeconds } from './jwt'
import { useDb, schema } from './db'

export const ACCESS_COOKIE = 'v_access'
export const REFRESH_COOKIE = 'v_refresh'

function baseCookieOpts() {
  const cfg = useRuntimeConfig()
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    ...(cfg.cookieDomain ? { domain: cfg.cookieDomain } : {}),
  }
}

export function setAuthCookies(event: H3Event, accessToken: string, refreshToken: string) {
  const cfg = useRuntimeConfig()
  setCookie(event, ACCESS_COOKIE, accessToken, { ...baseCookieOpts(), maxAge: ttlSeconds(cfg.jwtAccessTtl) })
  setCookie(event, REFRESH_COOKIE, refreshToken, { ...baseCookieOpts(), maxAge: ttlSeconds(cfg.jwtRefreshTtl) })
}

export function clearAuthCookies(event: H3Event) {
  deleteCookie(event, ACCESS_COOKIE, baseCookieOpts())
  deleteCookie(event, REFRESH_COOKIE, baseCookieOpts())
}

export function expandPermissions(role: Role): Permission[] {
  const grant = ROLE_PERMISSIONS[role]
  return grant === '*' ? [...PERMISSIONS] : grant
}

/** Resolve the current user from the access cookie. Returns null if anonymous. */
export async function getSessionUser(event: H3Event): Promise<AuthUser | null> {
  if (event.context.authUser !== undefined) return event.context.authUser as AuthUser | null

  const token = getCookie(event, ACCESS_COOKIE)
  if (!token) {
    event.context.authUser = null
    return null
  }
  try {
    const payload = await verifyAccessToken(token)
    const db = useDb()
    const row = await db.query.users.findFirst({
      where: eq(schema.users.id, payload.sub),
      columns: { id: true, name: true, email: true, role: true, avatar: true, isActive: true },
    })
    if (!row || !row.isActive) {
      event.context.authUser = null
      return null
    }
    const user: AuthUser = {
      id: row.id,
      name: row.name,
      email: row.email,
      role: row.role,
      avatar: row.avatar,
      permissions: expandPermissions(row.role),
    }
    event.context.authUser = user
    return user
  }
  catch {
    event.context.authUser = null
    return null
  }
}

export async function requireAuth(event: H3Event): Promise<AuthUser> {
  const user = await getSessionUser(event)
  if (!user) throw errors.unauthorized()
  return user
}

export async function requirePermission(event: H3Event, permission: Permission): Promise<AuthUser> {
  const user = await requireAuth(event)
  if (!hasPermission(user.role, permission)) throw errors.forbidden()
  return user
}

export async function requireRole(event: H3Event, ...roles: Role[]): Promise<AuthUser> {
  const user = await requireAuth(event)
  if (!roles.includes(user.role)) throw errors.forbidden()
  return user
}
