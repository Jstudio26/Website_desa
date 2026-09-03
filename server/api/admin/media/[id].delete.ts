import { defineApiHandler } from '../../../utils/response'
import { requirePermission } from '../../../utils/session'
import { useParam, zId } from '../../../utils/validation'
import { deleteMedia } from '../../../services/media.service'
import { logActivity } from '../../../utils/activity'

export default defineApiHandler(async (event) => {
  await requirePermission(event, 'media.manage')
  const id = useParam(event, 'id', zId)
  const res = await deleteMedia(id)
  await logActivity(event, { action: 'delete', entity: 'media', entityId: id, summary: 'Menghapus media' })
  return res
})
