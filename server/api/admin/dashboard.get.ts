import { defineApiHandler } from '../../utils/response'
import { requireAuth } from '../../utils/session'
import { getDashboardSummary } from '../../services/dashboard.service'

export default defineApiHandler(async (event) => {
  await requireAuth(event)
  return getDashboardSummary()
})
