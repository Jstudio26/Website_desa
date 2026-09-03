import { defineApiHandler } from '../../../utils/response'
import { requirePermission } from '../../../utils/session'
import { useQueryParams, zPagination, z } from '../../../utils/validation'
import { listMedia } from '../../../services/media.service'

const query = zPagination.extend({
  kind: z.enum(['image', 'video', 'document', 'audio', 'other']).optional(),
  folderId: z.string().uuid().optional(),
})

export default defineApiHandler(async (event) => {
  await requirePermission(event, 'media.manage')
  const q = useQueryParams(event, query)
  return listMedia({ page: q.page, pageSize: q.pageSize, q: q.q, kind: q.kind, folderId: q.folderId ?? null })
})
