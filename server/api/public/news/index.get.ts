import { defineApiHandler } from '../../../utils/response'
import { useQueryParams } from '../../../utils/validation'
import { newsListQuery } from '../../../validators/news'
import { listNews } from '../../../services/news.service'
import { assertFeature } from '../../../utils/feature'

export default defineApiHandler(async (event) => {
  await assertFeature('enableNews')
  const q = useQueryParams(event, newsListQuery)
  return listNews({
    page: q.page,
    pageSize: q.pageSize,
    q: q.q,
    status: 'published',
    categorySlug: q.category,
    featured: q.featured,
  })
})
