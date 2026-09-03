import { defineApiHandler } from '../../../utils/response'
import { requirePermission } from '../../../utils/session'
import { useBody } from '../../../utils/validation'
import { kktSettingsSchema } from '../../../validators/kkt'
import { saveKktSettings } from '../../../services/kkt.service'
import { logActivity } from '../../../utils/activity'

export default defineApiHandler(async (event) => {
  await requirePermission(event, 'kkt.manage')
  const data = await useBody(event, kktSettingsSchema)
  const saved = await saveKktSettings(data)
  await logActivity(event, { action: 'update', entity: 'kkt_settings', summary: 'Memperbarui informasi KKT' })
  return saved
})
