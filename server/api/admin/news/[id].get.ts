import { defineApiHandler } from '../../../utils/response'
import { requirePermission } from '../../../utils/session'
import { useParam, zId } from '../../../utils/validation'
import { getAdminNews } from '../../../services/news.service'

export default defineApiHandler(async (event) => {
  await requirePermission(event, 'news.manage')
  return getAdminNews(useParam(event, 'id', zId))
})
