import { defineApiHandler } from '../../../../utils/response'
import { requirePermission } from '../../../../utils/session'
import { useQueryParams } from '../../../../utils/validation'
import { kktMemberQuery } from '../../../../validators/kkt'
import { listMembers } from '../../../../services/kkt.service'

export default defineApiHandler(async (event) => {
  await requirePermission(event, 'kkt.manage')
  return listMembers(useQueryParams(event, kktMemberQuery))
})
