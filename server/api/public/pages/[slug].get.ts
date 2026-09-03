import { defineApiHandler } from '../../../utils/response'
import { useParam, zSlug } from '../../../utils/validation'
import { getPageBySlug } from '../../../services/page.service'

export default defineApiHandler(async (event) => {
  const slug = useParam(event, 'slug', zSlug)
  return getPageBySlug(slug, { publishedOnly: true })
})
