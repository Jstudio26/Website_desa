import { defineApiHandler } from '../../../../utils/response'
import { requirePermission } from '../../../../utils/session'
import { useBody } from '../../../../utils/validation'
import { kktMemberSchema } from '../../../../validators/kkt'
import { createMember } from '../../../../services/kkt.service'
import { logActivity } from '../../../../utils/activity'

export default defineApiHandler(async (event) => {
  await requirePermission(event, 'kkt.manage')
  const row = await createMember(await useBody(event, kktMemberSchema))
  await logActivity(event, { action: 'create', entity: 'kkt_member', entityId: row.id, summary: `Menambah anggota "${row.name}"` })
  return row
})
