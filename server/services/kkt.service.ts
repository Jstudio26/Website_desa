import { z } from 'zod'
import { and, asc, eq, ilike } from 'drizzle-orm'
import { useDb, schema } from '../utils/db'
import { errors } from '../utils/response'
import { uniqueSlug } from '../utils/slug'
import type {
  kktFieldSchema,
  kktFieldUpdateSchema,
  kktMemberSchema,
  kktMemberUpdateSchema,
  kktSettingsSchema,
} from '../validators/kkt'

/* ---------------- Settings (single row) ---------------- */
export async function getKktSettings() {
  const db = useDb()
  const row = await db.query.kktSettings.findFirst({ where: eq(schema.kktSettings.key, 'default') })
  if (row) return row
  const [created] = await db.insert(schema.kktSettings).values({ key: 'default' }).returning()
  return created!
}

export async function saveKktSettings(input: z.infer<typeof kktSettingsSchema>) {
  const db = useDb()
  await db
    .insert(schema.kktSettings)
    .values({ key: 'default', ...input })
    .onConflictDoUpdate({
      target: schema.kktSettings.key,
      set: { ...input, updatedAt: new Date() },
    })
  return getKktSettings()
}

/* ---------------- Fields ---------------- */
export function listFields(activeOnly = false) {
  const db = useDb()
  return db.query.kktFields.findMany({
    where: activeOnly ? eq(schema.kktFields.isActive, true) : undefined,
    orderBy: [asc(schema.kktFields.displayOrder), asc(schema.kktFields.name)],
  })
}

export async function createField(input: z.infer<typeof kktFieldSchema>) {
  const db = useDb()
  const slug = await uniqueSlug(schema.kktFields, schema.kktFields.slug, schema.kktFields.id, input.slug || input.name)
  const [row] = await db.insert(schema.kktFields).values({ ...input, slug }).returning()
  return row!
}

export async function updateField(id: string, input: z.infer<typeof kktFieldUpdateSchema>) {
  const db = useDb()
  const patch: Partial<typeof schema.kktFields.$inferInsert> = { ...input, updatedAt: new Date() }
  if (input.slug) {
    patch.slug = await uniqueSlug(schema.kktFields, schema.kktFields.slug, schema.kktFields.id, input.slug, id)
  }
  const [row] = await db.update(schema.kktFields).set(patch).where(eq(schema.kktFields.id, id)).returning()
  if (!row) throw errors.notFound('Bidang tidak ditemukan')
  return row
}

export async function deleteField(id: string) {
  const db = useDb()
  await db.update(schema.kktMembers).set({ fieldId: null }).where(eq(schema.kktMembers.fieldId, id))
  const [row] = await db.delete(schema.kktFields).where(eq(schema.kktFields.id, id)).returning({ id: schema.kktFields.id })
  if (!row) throw errors.notFound('Bidang tidak ditemukan')
  return { id }
}

/* ---------------- Members ---------------- */
export interface MemberFilter {
  q?: string
  fieldId?: string
  role?: 'KOORDINATOR' | 'SEKRETARIS' | 'BENDAHARA' | 'ANGGOTA'
}

export function listMembers(filter: MemberFilter = {}) {
  const db = useDb()
  const conds = []
  if (filter.q) conds.push(ilike(schema.kktMembers.name, `%${filter.q}%`))
  if (filter.fieldId) conds.push(eq(schema.kktMembers.fieldId, filter.fieldId))
  if (filter.role) conds.push(eq(schema.kktMembers.role, filter.role))
  return db.query.kktMembers.findMany({
    where: conds.length ? and(...conds) : undefined,
    orderBy: [asc(schema.kktMembers.displayOrder), asc(schema.kktMembers.name)],
    with: { field: { columns: { id: true, name: true, slug: true } } },
  })
}

export async function getMember(id: string) {
  const db = useDb()
  const row = await db.query.kktMembers.findFirst({ where: eq(schema.kktMembers.id, id) })
  if (!row) throw errors.notFound('Anggota tidak ditemukan')
  return row
}

export async function createMember(input: z.infer<typeof kktMemberSchema>) {
  const db = useDb()
  const [row] = await db.insert(schema.kktMembers).values(input).returning()
  return row!
}

export async function updateMember(id: string, input: z.infer<typeof kktMemberUpdateSchema>) {
  const db = useDb()
  const [row] = await db
    .update(schema.kktMembers)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(schema.kktMembers.id, id))
    .returning()
  if (!row) throw errors.notFound('Anggota tidak ditemukan')
  return row
}

export async function deleteMember(id: string) {
  const db = useDb()
  const [row] = await db.delete(schema.kktMembers).where(eq(schema.kktMembers.id, id)).returning({ id: schema.kktMembers.id })
  if (!row) throw errors.notFound('Anggota tidak ditemukan')
  return { id }
}

/* ---------------- Public assembled payload ---------------- */
export async function getPublicKktTeam() {
  const [settings, fields, members] = await Promise.all([
    getKktSettings(),
    listFields(true),
    listMembers(),
  ])
  const active = members.filter((m) => m.isActive)
  const pick = (role: string) => active.filter((m) => m.role === role)

  return {
    settings,
    coordinators: pick('KOORDINATOR'),
    secretaries: pick('SEKRETARIS'),
    treasurers: pick('BENDAHARA'),
    fields: fields.map((f) => ({
      ...f,
      members: active.filter((m) => m.fieldId === f.id && m.role === 'ANGGOTA'),
    })),
    unassigned: active.filter((m) => m.role === 'ANGGOTA' && !m.fieldId),
  }
}
