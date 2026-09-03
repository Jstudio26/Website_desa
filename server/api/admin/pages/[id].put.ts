import { defineApiHandler } from '../../../utils/response'
import { requirePermission } from '../../../utils/session'
import { useBody, useParam, zId } from '../../../utils/validation'
import { pageUpdateSchema, updatePage } from '../../../services/page.service'
import { logActivity } from '../../../utils/activity'

export default defineApiHandler(async (event) => {
  await requirePermission(event, 'page.manage')
  const id = useParam(event, 'id', zId)
  const page = await updatePage(id, await useBody(event, pageUpdateSchema))
  await logActivity(event, { action: 'update', entity: 'page', entityId: id, summary: `Memperbarui halaman "${page.title}"` })
  return page
})
