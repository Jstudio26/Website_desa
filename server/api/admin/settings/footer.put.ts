import { defineApiHandler } from '../../../utils/response'
import { requirePermission } from '../../../utils/session'
import { useBody } from '../../../utils/validation'
import { footerConfigSchema } from '../../../validators/settings'
import { saveFooterConfig } from '../../../services/settings.service'
import { logActivity } from '../../../utils/activity'

export default defineApiHandler(async (event) => {
  await requirePermission(event, 'settings.manage')
  const data = await useBody(event, footerConfigSchema)
  const saved = await saveFooterConfig(data as never)
  await logActivity(event, { action: 'update', entity: 'settings', entityId: 'footer', summary: 'Memperbarui struktur footer' })
  return saved
})
