import { SignJWT, jwtVerify } from 'jose'
import type { Role } from '../../shared/types/rbac'

export interface AccessTokenPayload {
  sub: string
  role: Role
  name: string
  email: string
  typ: 'access'
}

function secretKey(): Uint8Array {
  const s = useRuntimeConfig().jwtSecret
  if (!s || s === 'change-me-in-production') {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('[jwt] JWT_SECRET must be set to a strong value in production')
    }
  }
  return new TextEncoder().encode(s)
}

/** Convert "15m" / "7d" / "3600" to seconds. */
export function ttlSeconds(ttl: string): number {
  const m = /^(\d+)\s*([smhd])?$/.exec(ttl.trim())
  if (!m) return 900
  const n = Number(m[1])
  switch (m[2]) {
    case 's': return n
    case 'm': return n * 60
    case 'h': return n * 3600
    case 'd': return n * 86400
    default: return n
  }
}

export async function signAccessToken(p: Omit<AccessTokenPayload, 'typ'>): Promise<string> {
  const ttl = ttlSeconds(useRuntimeConfig().jwtAccessTtl)
  return new SignJWT({ ...p, typ: 'access' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + ttl)
    .setIssuer('village-platform')
    .sign(secretKey())
}

export async function verifyAccessToken(token: string): Promise<AccessTokenPayload> {
  const { payload } = await jwtVerify(token, secretKey(), { issuer: 'village-platform' })
  if (payload.typ !== 'access') throw new Error('wrong token type')
  return payload as unknown as AccessTokenPayload
}

/** Opaque random refresh token (stored hashed in DB). */
export function generateRefreshToken(): string {
  const bytes = new Uint8Array(48)
  crypto.getRandomValues(bytes)
  return Buffer.from(bytes).toString('base64url')
}

export async function hashToken(token: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token))
  return Buffer.from(digest).toString('hex')
}
