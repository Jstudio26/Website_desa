import { defineApiHandler } from '../../../utils/response'
import { requirePermission } from '../../../utils/session'
import { useBody } from '../../../utils/validation'
import { themeConfigSchema } from '../../../validators/settings'
import { saveThemeConfig } from '../../../services/settings.service'
import { logActivity } from '../../../utils/activity'

export default defineApiHandler(async (event) => {
  await requirePermission(event, 'theme.manage')
  const data = await useBody(event, themeConfigSchema)
  const saved = await saveThemeConfig(data as never)
  await logActivity(event, { action: 'update', entity: 'settings', entityId: 'theme', summary: 'Memperbarui tema tampilan' })
  return saved
})
