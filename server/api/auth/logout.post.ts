import { defineApiHandler } from '../../utils/response'
import { logout } from '../../services/auth.service'

export default defineApiHandler(async (event) => {
  await logout(event)
  return { success: true }
})
