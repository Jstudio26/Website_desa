import { defineApiHandler } from '../../../../utils/response'
import { requirePermission } from '../../../../utils/session'
import { listFields } from '../../../../services/kkt.service'

export default defineApiHandler(async (event) => {
  await requirePermission(event, 'kkt.manage')
  return listFields(false)
})
