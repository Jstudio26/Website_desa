import { defineApiHandler } from '../../../utils/response'
import { requirePermission } from '../../../utils/session'
import { listMenus } from '../../../services/menu.service'

export default defineApiHandler(async (event) => {
  await requirePermission(event, 'menu.manage')
  return listMenus()
})
