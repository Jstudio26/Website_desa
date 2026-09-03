import { z, zId } from '../utils/validation'

export const menuItemSchema = z.object({
  menuId: zId,
  parentId: zId.nullable().default(null),
  label: z.string().min(1).max(160),
  url: z.string().min(1).max(400),
  icon: z.string().max(60).nullable().default(null),
  target: z.enum(['_self', '_blank']).default('_self'),
  visible: z.boolean().default(true),
  order: z.number().int().min(0).default(0),
})

export const menuItemUpdateSchema = menuItemSchema.partial().omit({ menuId: true })

export const menuReorderSchema = z.object({
  items: z
    .array(
      z.object({
        id: zId,
        parentId: zId.nullable(),
        order: z.number().int().min(0),
      }),
    )
    .max(300),
})
