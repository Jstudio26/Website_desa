import { boolean, index, inet, pgEnum, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { pk, timestamps } from './_shared'

export const roleEnum = pgEnum('role', ['SUPER_ADMIN', 'ADMIN_DESA', 'EDITOR'])

export const users = pgTable(
  'users',
  {
    id: pk(),
    name: varchar('name', { length: 160 }).notNull(),
    email: varchar('email', { length: 200 }).notNull().unique(),
    passwordHash: text('password_hash').notNull(),
    role: roleEnum('role').notNull().default('EDITOR'),
    avatar: text('avatar'),
    phone: varchar('phone', { length: 40 }),
    isActive: boolean('is_active').notNull().default(true),
    lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
    ...timestamps,
  },
  (t) => ({
    emailIdx: index('users_email_idx').on(t.email),
    roleIdx: index('users_role_idx').on(t.role),
  }),
)

/** Rotating refresh tokens (hashed) backing the HttpOnly refresh cookie. */
export const refreshTokens = pgTable(
  'refresh_tokens',
  {
    id: pk(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    tokenHash: varchar('token_hash', { length: 128 }).notNull().unique(),
    userAgent: text('user_agent'),
    ip: inet('ip'),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
    ...timestamps,
  },
  (t) => ({
    userIdx: index('refresh_tokens_user_idx').on(t.userId),
  }),
)

/** Login attempt log - powers rate limiting / lockout on /api/auth/login. */
export const loginAttempts = pgTable(
  'login_attempts',
  {
    id: pk(),
    email: varchar('email', { length: 200 }).notNull(),
    ip: inet('ip'),
    success: boolean('success').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    emailIdx: index('login_attempts_email_idx').on(t.email),
    ipIdx: index('login_attempts_ip_idx').on(t.ip),
    createdIdx: index('login_attempts_created_idx').on(t.createdAt),
  }),
)

export const usersRelations = relations(users, ({ many }) => ({
  refreshTokens: many(refreshTokens),
}))
export const refreshTokensRelations = relations(refreshTokens, ({ one }) => ({
  user: one(users, { fields: [refreshTokens.userId], references: [users.id] }),
}))
