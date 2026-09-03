import { defineApiHandler } from '../../../utils/response'
import { requirePermission } from '../../../utils/session'
import { useParam, zId } from '../../../utils/validation'
import { deletePage } from '../../../services/page.service'
import { logActivity } from '../../../utils/activity'

export default defineApiHandler(async (event) => {
  await requirePermission(event, 'page.manage')
  const id = useParam(event, 'id', zId)
  const res = await deletePage(id)
  await logActivity(event, { action: 'delete', entity: 'page', entityId: id, summary: 'Menghapus halaman' })
  return res
})
