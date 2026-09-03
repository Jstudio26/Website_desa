import { defineApiHandler } from '../../utils/response'
import { getVillageConfig } from '../../services/settings.service'

export default defineApiHandler(() => getVillageConfig())
