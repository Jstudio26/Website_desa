import { defineApiHandler } from '../../../utils/response'
import { requirePermission } from '../../../utils/session'
import { useBody, useParam, zId } from '../../../utils/validation'
import { newsUpdateSchema } from '../../../validators/news'
import { updateNews } from '../../../services/news.service'
import { logActivity } from '../../../utils/activity'

export default defineApiHandler(async (event) => {
  await requirePermission(event, 'news.manage')
  const id = useParam(event, 'id', zId)
  const input = await useBody(event, newsUpdateSchema)
  const row = await updateNews(id, input)
  await logActivity(event, { action: 'update', entity: 'news', entityId: id, summary: `Memperbarui berita "${row.title}"` })
  return row
})
