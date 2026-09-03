import { defineApiHandler } from '../../../utils/response'
import { requirePermission } from '../../../utils/session'
import { useQueryParams } from '../../../utils/validation'
import { newsAdminListQuery } from '../../../validators/news'
import { listNews } from '../../../services/news.service'

export default defineApiHandler(async (event) => {
  await requirePermission(event, 'news.manage')
  const q = useQueryParams(event, newsAdminListQuery)
  return listNews({
    page: q.page,
    pageSize: q.pageSize,
    q: q.q,
    status: q.status,
    categorySlug: q.category,
    featured: q.featured,
  })
})
