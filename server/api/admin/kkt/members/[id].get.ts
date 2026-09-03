import { defineApiHandler } from '../../../../utils/response'
import { requirePermission } from '../../../../utils/session'
import { useParam, zId } from '../../../../utils/validation'
import { getMember } from '../../../../services/kkt.service'

export default defineApiHandler(async (event) => {
  await requirePermission(event, 'kkt.manage')
  return getMember(useParam(event, 'id', zId))
})
