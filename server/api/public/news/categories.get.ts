import { defineApiHandler } from '../../../utils/response'
import { listCategories } from '../../../services/news.service'

export default defineApiHandler(() => listCategories())
