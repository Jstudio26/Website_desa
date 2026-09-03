import { defineApiHandler } from '../../utils/response'
import { getHomepagePayload } from '../../services/public.service'

export default defineApiHandler(() => getHomepagePayload())
