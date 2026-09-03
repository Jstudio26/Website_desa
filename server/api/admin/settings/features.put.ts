import { defineApiHandler } from '../../../utils/response'
import { requirePermission } from '../../../utils/session'
import { useBody } from '../../../utils/validation'
import { featureFlagsSchema } from '../../../validators/settings'
import { saveFeatureFlags } from '../../../services/settings.service'
import { logActivity } from '../../../utils/activity'

export default defineApiHandler(async (event) => {
  await requirePermission(event, 'settings.manage')
  const data = await useBody(event, featureFlagsSchema)
  const saved = await saveFeatureFlags(data as never)
  await logActivity(event, { action: 'update', entity: 'settings', entityId: 'features', summary: 'Memperbarui modul aktif (feature flags)' })
  return saved
})
