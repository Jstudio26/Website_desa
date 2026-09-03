import { boolean, index, integer, pgEnum, pgTable, text, uuid, varchar } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { pk, timestamps } from './_shared'

/**
 * KKT MODULE
 * Records the student team that built the site as part of a Kuliah Kerja
 * Terpadu program. Entirely optional (feature flag `enableKKTDeveloperPage`)
 * so the platform stays reusable for other villages after the program ends.
 */

export const kktSettings = pgTable('kkt_settings', {
  id: pk(),
  key: varchar('key', { length: 40 }).notNull().unique().default('default'),
  programName: varchar('program_name', { length: 200 }).notNull().default('Kuliah Kerja Terpadu (KKT)'),
  universityName: varchar('university_name', { length: 200 }).notNull().default(''),
  facultyName: varchar('faculty_name', { length: 200 }).notNull().default(''),
  year: varchar('year', { length: 12 }).notNull().default(''),
  period: varchar('period', { length: 120 }).notNull().default(''),
  postName: varchar('post_name', { length: 160 }).notNull().default(''),
  location: varchar('location', { length: 200 }).notNull().default(''),
  villageName: varchar('village_name', { length: 200 }).notNull().default(''),
  description: text('description').notNull().default(''),
  universityLogo: text('university_logo'),
  kktLogo: text('kkt_logo'),
  heroImage: text('hero_image'),
  footerCredit: text('footer_credit').notNull().default(''),
  ...timestamps,
})

export const kktFields = pgTable(
  'kkt_fields',
  {
    id: pk(),
    name: varchar('name', { length: 180 }).notNull(),
    slug: varchar('slug', { length: 200 }).notNull().unique(),
    description: text('description'),
    image: text('image'),
    displayOrder: integer('display_order').notNull().default(0),
    isActive: boolean('is_active').notNull().default(true),
    ...timestamps,
  },
  (t) => ({ orderIdx: index('kkt_fields_order_idx').on(t.displayOrder) }),
)

export const kktRoleEnum = pgEnum('kkt_role', ['KOORDINATOR', 'SEKRETARIS', 'BENDAHARA', 'ANGGOTA'])

export const kktMembers = pgTable(
  'kkt_members',
  {
    id: pk(),
    name: varchar('name', { length: 200 }).notNull(),
    photo: text('photo'),
    studentId: varchar('student_id', { length: 40 }),
    studyProgram: varchar('study_program', { length: 200 }),
    faculty: varchar('faculty', { length: 200 }),
    university: varchar('university', { length: 200 }),
    role: kktRoleEnum('role').notNull().default('ANGGOTA'),
    position: varchar('position', { length: 160 }),
    fieldId: uuid('field_id').references(() => kktFields.id, { onDelete: 'set null' }),
    displayOrder: integer('display_order').notNull().default(0),
    isActive: boolean('is_active').notNull().default(true),
    instagram: varchar('instagram', { length: 200 }),
    linkedin: varchar('linkedin', { length: 200 }),
    email: varchar('email', { length: 160 }),
    ...timestamps,
  },
  (t) => ({
    roleIdx: index('kkt_members_role_idx').on(t.role),
    fieldIdx: index('kkt_members_field_idx').on(t.fieldId),
  }),
)

export const kktFieldsRelations = relations(kktFields, ({ many }) => ({
  members: many(kktMembers),
}))
export const kktMembersRelations = relations(kktMembers, ({ one }) => ({
  field: one(kktFields, { fields: [kktMembers.fieldId], references: [kktFields.id] }),
}))
