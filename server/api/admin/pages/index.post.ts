import { defineApiHandler } from '../../../utils/response'
import { requirePermission } from '../../../utils/session'
import { useBody } from '../../../utils/validation'
import { createPage, pageCreateSchema } from '../../../services/page.service'
import { logActivity } from '../../../utils/activity'

export default defineApiHandler(async (event) => {
  await requirePermission(event, 'page.manage')
  const page = await createPage(await useBody(event, pageCreateSchema))
  await logActivity(event, { action: 'create', entity: 'page', entityId: page.id, summary: `Membuat halaman "${page.title}"` })
  return page
})
