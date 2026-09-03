import { z, zId, zSlug } from '../utils/validation'

export const kktSettingsSchema = z.object({
  programName: z.string().max(200).default('Kuliah Kerja Terpadu (KKT)'),
  universityName: z.string().max(200).default(''),
  facultyName: z.string().max(200).default(''),
  year: z.string().max(12).default(''),
  period: z.string().max(120).default(''),
  postName: z.string().max(160).default(''),
  location: z.string().max(200).default(''),
  villageName: z.string().max(200).default(''),
  description: z.string().max(2000).default(''),
  universityLogo: z.string().max(500).nullable().default(null),
  kktLogo: z.string().max(500).nullable().default(null),
  heroImage: z.string().max(500).nullable().default(null),
  footerCredit: z.string().max(600).default(''),
})

export const kktFieldSchema = z.object({
  name: z.string().min(1).max(180),
  slug: zSlug.optional(),
  description: z.string().max(1000).nullable().default(null),
  image: z.string().max(500).nullable().default(null),
  displayOrder: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
})
export const kktFieldUpdateSchema = kktFieldSchema.partial()

export const kktMemberSchema = z.object({
  name: z.string().min(1).max(200),
  photo: z.string().max(500).nullable().default(null),
  studentId: z.string().max(40).nullable().default(null),
  studyProgram: z.string().max(200).nullable().default(null),
  faculty: z.string().max(200).nullable().default(null),
  university: z.string().max(200).nullable().default(null),
  role: z.enum(['KOORDINATOR', 'SEKRETARIS', 'BENDAHARA', 'ANGGOTA']).default('ANGGOTA'),
  position: z.string().max(160).nullable().default(null),
  fieldId: zId.nullable().default(null),
  displayOrder: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
  instagram: z.string().max(200).nullable().default(null),
  linkedin: z.string().max(200).nullable().default(null),
  email: z.string().max(160).nullable().default(null),
})
export const kktMemberUpdateSchema = kktMemberSchema.partial()

export const kktMemberQuery = z.object({
  q: z.string().max(160).optional(),
  fieldId: zId.optional(),
  role: z.enum(['KOORDINATOR', 'SEKRETARIS', 'BENDAHARA', 'ANGGOTA']).optional(),
})
