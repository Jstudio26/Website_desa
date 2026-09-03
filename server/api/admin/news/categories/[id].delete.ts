import { defineApiHandler } from '../../../../utils/response'
import { requirePermission } from '../../../../utils/session'
import { useParam, zId } from '../../../../utils/validation'
import { deleteCategory } from '../../../../services/news.service'

export default defineApiHandler(async (event) => {
  await requirePermission(event, 'news.manage')
  return deleteCategory(useParam(event, 'id', zId))
})
