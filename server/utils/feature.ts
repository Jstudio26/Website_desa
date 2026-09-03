import type { FeatureFlag } from '../../shared/types/config'
import { getSiteConfig } from './site-config'
import { AppError } from './response'

/** Throw 404 when a module is disabled via feature flags (so routes vanish). */
export async function assertFeature(flag: FeatureFlag) {
  const { features } = await getSiteConfig()
  if (!features[flag]) {
    throw new AppError(404, 'FEATURE_DISABLED', 'Modul ini sedang tidak aktif')
  }
}

export async function isFeatureEnabled(flag: FeatureFlag): Promise<boolean> {
  const { features } = await getSiteConfig()
  return !!features[flag]
}
