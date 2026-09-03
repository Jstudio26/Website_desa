import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from '../../database/schema'

/**
 * Single pooled connection reused across requests (Nitro keeps the module
 * instance warm). Point DATABASE_URL at any PostgreSQL-compatible server -
 * local, Docker, Neon, Supabase, RDS - with zero code changes.
 */
let _db: PostgresJsDatabase<typeof schema> | null = null
let _client: ReturnType<typeof postgres> | null = null

function create() {
  const url = useRuntimeConfig().databaseUrl
  if (!url) {
    throw new Error(
      '[db] DATABASE_URL is not set. Copy .env.example to .env and configure it.',
    )
  }
  _client = postgres(url, {
    max: Number(process.env.DB_POOL_MAX || 10),
    idle_timeout: 20,
    connect_timeout: 10,
    prepare: false, // safe default for poolers (PgBouncer / Supabase)
  })
  _db = drizzle(_client, { schema, logger: process.env.DB_LOG === 'true' })
  return _db
}

export function useDb(): PostgresJsDatabase<typeof schema> {
  return _db ?? create()
}

export function useDbClient() {
  if (!_client) create()
  return _client!
}

export { schema }
