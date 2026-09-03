import { defineApiHandler } from '../../../utils/response'
import { requirePermission } from '../../../utils/session'
import { listPages } from '../../../services/page.service'

export default defineApiHandler(async (event) => {
  await requirePermission(event, 'page.manage')
  return listPages()
})
