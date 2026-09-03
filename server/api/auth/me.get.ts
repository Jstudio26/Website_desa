import { defineApiHandler } from '../../utils/response'
import { getSessionUser } from '../../utils/session'

export default defineApiHandler(async (event) => {
  const user = await getSessionUser(event)
  return { user }
})
