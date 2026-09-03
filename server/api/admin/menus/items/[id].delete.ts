import { defineApiHandler } from '../../../../utils/response'
import { requirePermission } from '../../../../utils/session'
import { useParam, zId } from '../../../../utils/validation'
import { deleteMenuItem } from '../../../../services/menu.service'
import { logActivity } from '../../../../utils/activity'

export default defineApiHandler(async (event) => {
  await requirePermission(event, 'menu.manage')
  const id = useParam(event, 'id', zId)
  const res = await deleteMenuItem(id)
  await logActivity(event, { action: 'delete', entity: 'menu_item', entityId: id, summary: 'Menghapus item menu' })
  return res
})
