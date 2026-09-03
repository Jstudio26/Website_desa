import { defineApiHandler } from '../../utils/response'
import { requirePermission } from '../../utils/session'
import { useQueryParams, z } from '../../utils/validation'
import { recentActivity } from '../../utils/activity'

export default defineApiHandler(async (event) => {
  await requirePermission(event, 'activity.view')
  const { limit } = useQueryParams(event, z.object({ limit: z.coerce.number().int().min(1).max(100).default(30) }))
  return recentActivity(limit)
})
