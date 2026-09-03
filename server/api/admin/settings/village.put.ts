import { defineApiHandler } from '../../../utils/response'
import { requirePermission } from '../../../utils/session'
import { useBody } from '../../../utils/validation'
import { villageConfigSchema } from '../../../validators/settings'
import { saveVillageConfig } from '../../../services/settings.service'
import { logActivity } from '../../../utils/activity'

export default defineApiHandler(async (event) => {
  await requirePermission(event, 'settings.manage')
  const data = await useBody(event, villageConfigSchema)
  const saved = await saveVillageConfig(data as never)
  await logActivity(event, { action: 'update', entity: 'settings', entityId: 'village', summary: 'Memperbarui profil & identitas desa' })
  return saved
})
