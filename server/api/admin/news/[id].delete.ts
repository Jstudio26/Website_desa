import { defineApiHandler } from '../../../utils/response'
import { requirePermission } from '../../../utils/session'
import { useParam, zId } from '../../../utils/validation'
import { deleteNews } from '../../../services/news.service'
import { logActivity } from '../../../utils/activity'

export default defineApiHandler(async (event) => {
  await requirePermission(event, 'news.manage')
  const id = useParam(event, 'id', zId)
  const res = await deleteNews(id)
  await logActivity(event, { action: 'delete', entity: 'news', entityId: id, summary: 'Menghapus berita' })
  return res
})
