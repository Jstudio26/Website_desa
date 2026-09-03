import { defineApiHandler } from '../../../../utils/response'
import { requirePermission } from '../../../../utils/session'
import { useBody, useParam, zId } from '../../../../utils/validation'
import { categorySchema } from '../../../../validators/news'
import { updateCategory } from '../../../../services/news.service'

export default defineApiHandler(async (event) => {
  await requirePermission(event, 'news.manage')
  const id = useParam(event, 'id', zId)
  return updateCategory(id, await useBody(event, categorySchema.partial()))
})
