import { defineApiHandler } from '../../../utils/response'
import { requirePermission } from '../../../utils/session'
import { useBody } from '../../../utils/validation'
import { menuItemSchema } from '../../../validators/menu'
import { createMenuItem } from '../../../services/menu.service'
import { logActivity } from '../../../utils/activity'

export default defineApiHandler(async (event) => {
  await requirePermission(event, 'menu.manage')
  const input = await useBody(event, menuItemSchema)
  const row = await createMenuItem(input)
  await logActivity(event, { action: 'create', entity: 'menu_item', entityId: row.id, summary: `Menambah menu "${row.label}"` })
  return row
})
