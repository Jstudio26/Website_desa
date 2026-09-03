import { defineApiHandler } from '../../../utils/response'
import { requirePermission } from '../../../utils/session'
import { useBody } from '../../../utils/validation'
import { newsCreateSchema } from '../../../validators/news'
import { createNews } from '../../../services/news.service'
import { logActivity } from '../../../utils/activity'

export default defineApiHandler(async (event) => {
  const user = await requirePermission(event, 'news.manage')
  const input = await useBody(event, newsCreateSchema)
  const row = await createNews(input, user.id)
  await logActivity(event, { action: 'create', entity: 'news', entityId: row.id, summary: `Membuat berita "${row.title}"` })
  return row
})
