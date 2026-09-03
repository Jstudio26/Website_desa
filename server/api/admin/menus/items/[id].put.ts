import { defineApiHandler } from '../../../../utils/response'
import { requirePermission } from '../../../../utils/session'
import { useBody, useParam, zId } from '../../../../utils/validation'
import { menuItemUpdateSchema } from '../../../../validators/menu'
import { updateMenuItem } from '../../../../services/menu.service'
import { logActivity } from '../../../../utils/activity'

export default defineApiHandler(async (event) => {
  await requirePermission(event, 'menu.manage')
  const id = useParam(event, 'id', zId)
  const input = await useBody(event, menuItemUpdateSchema)
  const row = await updateMenuItem(id, input)
  await logActivity(event, { action: 'update', entity: 'menu_item', entityId: id, summary: `Memperbarui menu "${row.label}"` })
  return row
})
