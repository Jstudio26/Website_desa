import { and, desc, eq, ilike, sql, type SQL } from 'drizzle-orm'
import type { H3Event } from 'h3'
import { useDb, schema } from '../utils/db'
import { errors } from '../utils/response'
import { useMediaStorage } from '../utils/storage'
import type { Paginated } from '../../shared/types/api'

const MAX_BYTES = Number(process.env.UPLOAD_MAX_BYTES || 15 * 1024 * 1024)

const ALLOWED: Record<string, 'image' | 'video' | 'document' | 'audio'> = {
  'image/jpeg': 'image', 'image/png': 'image', 'image/webp': 'image', 'image/gif': 'image', 'image/svg+xml': 'image',
  'video/mp4': 'video', 'video/webm': 'video',
  'audio/mpeg': 'audio',
  'application/pdf': 'document',
  'application/msword': 'document',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'document',
  'application/vnd.ms-excel': 'document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'document',
}

export interface MediaListFilter {
  page: number
  pageSize: number
  q?: string
  kind?: 'image' | 'video' | 'document' | 'audio' | 'other'
  folderId?: string | null
}

export async function listMedia(f: MediaListFilter): Promise<Paginated<typeof schema.media.$inferSelect>> {
  const db = useDb()
  const conds: SQL[] = []
  if (f.q) conds.push(ilike(schema.media.originalName, `%${f.q}%`))
  if (f.kind) conds.push(eq(schema.media.kind, f.kind))
  if (f.folderId !== undefined && f.folderId !== null) conds.push(eq(schema.media.folderId, f.folderId))
  const where = conds.length ? and(...conds) : undefined

  const [items, [countRow]] = await Promise.all([
    db.query.media.findMany({
      where,
      orderBy: [desc(schema.media.createdAt)],
      limit: f.pageSize,
      offset: (f.page - 1) * f.pageSize,
    }),
    db.select({ c: sql<number>`count(*)::int` }).from(schema.media).where(where),
  ])
  const total = countRow?.c ?? 0
  return { items, page: f.page, pageSize: f.pageSize, total, totalPages: Math.max(1, Math.ceil(total / f.pageSize)) }
}

export async function uploadMedia(event: H3Event, opts: { prefix?: string, alt?: string } = {}) {
  const form = await readMultipartFormData(event)
  if (!form) throw errors.badRequest('Tidak ada berkas yang diunggah')
  const file = form.find((p) => p.name === 'file' && p.filename)
  if (!file || !file.data) throw errors.badRequest('Field "file" wajib ada')

  const mime = file.type || 'application/octet-stream'
  const kind = ALLOWED[mime]
  if (!kind) throw errors.badRequest(`Tipe berkas tidak diizinkan: ${mime}`)
  if (file.data.byteLength > MAX_BYTES) {
    throw errors.badRequest(`Ukuran berkas melebihi batas ${(MAX_BYTES / 1024 / 1024).toFixed(0)} MB`)
  }

  const prefixPart = form.find((p) => p.name === 'prefix')?.data.toString()
  const altPart = form.find((p) => p.name === 'alt')?.data.toString()

  const storage = await useMediaStorage()
  const stored = await storage.put({
    body: file.data,
    contentType: mime,
    filename: file.filename!,
    prefix: prefixPart || opts.prefix || kind + 's',
  })

  const db = useDb()
  const [row] = await db
    .insert(schema.media)
    .values({
      kind,
      filename: stored.key.split('/').pop() || file.filename!,
      originalName: file.filename!,
      mimeType: mime,
      extension: (file.filename!.split('.').pop() || '').toLowerCase(),
      size: stored.size,
      storageDriver: stored.driver,
      storageKey: stored.key,
      url: stored.url,
      alt: altPart || opts.alt || null,
      uploadedById: event.context.authUser?.id ?? null,
    })
    .returning()
  return row!
}

export async function deleteMedia(id: string) {
  const db = useDb()
  const row = await db.query.media.findFirst({ where: eq(schema.media.id, id) })
  if (!row) throw errors.notFound('Media tidak ditemukan')
  try {
    const storage = await useMediaStorage()
    if (storage.driver === row.storageDriver) await storage.delete(row.storageKey)
  }
  catch (err) {
    console.error('[media] storage delete failed', err)
  }
  await db.delete(schema.media).where(eq(schema.media.id, id))
  return { id }
}
