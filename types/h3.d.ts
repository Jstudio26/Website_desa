import type { AuthUser } from '../shared/types/api'

declare module 'h3' {
  interface H3EventContext {
    /** Populated by server/middleware/00.auth.ts. `null` = anonymous, `undefined` = not resolved yet. */
    authUser?: AuthUser | null
  }
}

export {}
