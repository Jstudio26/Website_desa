import { defineApiHandler } from '../../../../utils/response'
import { requirePermission } from '../../../../utils/session'
import { listCategories } from '../../../../services/news.service'

export default defineApiHandler(async (event) => {
  await requirePermission(event, 'news.manage')
  return listCategories()
})
