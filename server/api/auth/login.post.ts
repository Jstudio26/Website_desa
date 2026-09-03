import { defineApiHandler } from '../../utils/response'
import { useBody } from '../../utils/validation'
import { loginSchema } from '../../validators/auth'
import { login } from '../../services/auth.service'

export default defineApiHandler(async (event) => {
  const input = await useBody(event, loginSchema)
  return login(event, input)
})
