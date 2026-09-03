import { defineApiHandler } from '../../../../utils/response'
import { requirePermission } from '../../../../utils/session'
import { useBody, useParam, zId } from '../../../../utils/validation'
import { kktFieldUpdateSchema } from '../../../../validators/kkt'
import { updateField } from '../../../../services/kkt.service'
import { logActivity } from '../../../../utils/activity'

export default defineApiHandler(async (event) => {
  await requirePermission(event, 'kkt.manage')
  const id = useParam(event, 'id', zId)
  const row = await updateField(id, await useBody(event, kktFieldUpdateSchema))
  await logActivity(event, { action: 'update', entity: 'kkt_field', entityId: id, summary: `Memperbarui bidang "${row.name}"` })
  return row
})
