import { defineApiHandler } from '../../utils/response'
import { refresh } from '../../services/auth.service'

export default defineApiHandler((event) => refresh(event))
