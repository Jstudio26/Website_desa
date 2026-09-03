import type { Role, Permission } from './rbac'

/** Consistent API envelope for every Nitro endpoint. */
export interface ApiSuccess<T> {
  ok: true
  data: T
  meta?: Record<string, unknown>
}
export interface ApiError {
  ok: false
  error: {
    code: string
    message: string
    /** Field-level validation issues, keyed by dotted path. */
    fields?: Record<string, string[]>
  }
}
export type ApiResponse<T> = ApiSuccess<T> | ApiError

export interface Paginated<T> {
  items: T[]
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export interface AuthUser {
  id: string
  name: string
  email: string
  role: Role
  avatar: string | null
  permissions: Permission[]
}

export interface SessionContext {
  user: AuthUser | null
}
