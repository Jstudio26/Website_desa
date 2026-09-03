import { defineApiHandler } from '../../../utils/response'
import { requirePermission } from '../../../utils/session'
import { getThemeConfig } from '../../../services/settings.service'

export default defineApiHandler(async (event) => {
  await requirePermission(event, 'theme.manage')
  return getThemeConfig()
})
