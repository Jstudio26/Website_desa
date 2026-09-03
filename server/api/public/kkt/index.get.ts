import { defineApiHandler } from '../../../utils/response'
import { assertFeature } from '../../../utils/feature'
import { getKktSettings } from '../../../services/kkt.service'

export default defineApiHandler(async () => {
  await assertFeature('enableKKTDeveloperPage')
  return getKktSettings()
})
