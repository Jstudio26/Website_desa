import { defineApiHandler } from '../../../../utils/response'
import { requirePermission } from '../../../../utils/session'
import { useBody } from '../../../../utils/validation'
import { categorySchema } from '../../../../validators/news'
import { createCategory } from '../../../../services/news.service'

export default defineApiHandler(async (event) => {
  await requirePermission(event, 'news.manage')
  return createCategory(await useBody(event, categorySchema))
})
