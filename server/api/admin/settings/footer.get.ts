import { defineApiHandler } from '../../../utils/response'
import { requirePermission } from '../../../utils/session'
import { getFooterConfig } from '../../../services/settings.service'

export default defineApiHandler(async (event) => {
  await requirePermission(event, 'settings.manage')
  return getFooterConfig()
})
