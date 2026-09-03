import { defineApiHandler } from '../../../../utils/response'
import { requirePermission } from '../../../../utils/session'
import { useParam, zId } from '../../../../utils/validation'
import { deleteField } from '../../../../services/kkt.service'
import { logActivity } from '../../../../utils/activity'

export default defineApiHandler(async (event) => {
  await requirePermission(event, 'kkt.manage')
  const id = useParam(event, 'id', zId)
  const res = await deleteField(id)
  await logActivity(event, { action: 'delete', entity: 'kkt_field', entityId: id, summary: 'Menghapus bidang KKT' })
  return res
})
