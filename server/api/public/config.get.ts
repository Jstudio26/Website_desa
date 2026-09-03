import { defineApiHandler } from '../../utils/response'
import { getSiteConfig } from '../../utils/site-config'

/** One payload that drives branding, theme, navigation, footer & feature flags. */
export default defineApiHandler(() => getSiteConfig())
