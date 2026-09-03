import { defineApiHandler } from '../../../utils/response'
import { requirePermission } from '../../../utils/session'
import { useBody } from '../../../utils/validation'
import { menuReorderSchema } from '../../../validators/menu'
import { reorderMenuItems } from '../../../services/menu.service'

export default defineApiHandler(async (event) => {
  await requirePermission(event, 'menu.manage')
  const input = await useBody(event, menuReorderSchema)
  return reorderMenuItems(input)
})
