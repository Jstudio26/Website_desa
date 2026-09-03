import { defineApiHandler } from '../../../../utils/response'
import { requirePermission } from '../../../../utils/session'
import { useBody } from '../../../../utils/validation'
import { kktFieldSchema } from '../../../../validators/kkt'
import { createField } from '../../../../services/kkt.service'
import { logActivity } from '../../../../utils/activity'

export default defineApiHandler(async (event) => {
  await requirePermission(event, 'kkt.manage')
  const row = await createField(await useBody(event, kktFieldSchema))
  await logActivity(event, { action: 'create', entity: 'kkt_field', entityId: row.id, summary: `Menambah bidang "${row.name}"` })
  return row
})
