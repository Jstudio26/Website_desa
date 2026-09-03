import { defineApiHandler } from '../../../../utils/response'
import { requirePermission } from '../../../../utils/session'
import { useBody, useParam, zId } from '../../../../utils/validation'
import { kktMemberUpdateSchema } from '../../../../validators/kkt'
import { updateMember } from '../../../../services/kkt.service'
import { logActivity } from '../../../../utils/activity'

export default defineApiHandler(async (event) => {
  await requirePermission(event, 'kkt.manage')
  const id = useParam(event, 'id', zId)
  const row = await updateMember(id, await useBody(event, kktMemberUpdateSchema))
  await logActivity(event, { action: 'update', entity: 'kkt_member', entityId: id, summary: `Memperbarui anggota "${row.name}"` })
  return row
})
