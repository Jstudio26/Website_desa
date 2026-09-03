import { defineApiHandler } from '../../../utils/response'
import { useParam, zSlug } from '../../../utils/validation'
import { getPublicNews } from '../../../services/news.service'
import { assertFeature } from '../../../utils/feature'

export default defineApiHandler(async (event) => {
  await assertFeature('enableNews')
  const slug = useParam(event, 'slug', zSlug)
  return getPublicNews(slug)
})
