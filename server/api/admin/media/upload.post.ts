import { defineApiHandler } from '../../../utils/response'
import { requirePermission } from '../../../utils/session'
import { uploadMedia } from '../../../services/media.service'
import { logActivity } from '../../../utils/activity'

export default defineApiHandler(async (event) => {
  await requirePermission(event, 'media.manage')
  const row = await uploadMedia(event)
  await logActivity(event, { action: 'create', entity: 'media', entityId: row.id, summary: `Mengunggah ${row.originalName}` })
  return row
})
