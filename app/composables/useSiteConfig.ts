import { storeToRefs } from 'pinia'
import type { FeatureFlag } from '~~/shared/types/config'

/** Reactive access to branding / theme / navigation / footer / feature flags. */
export function useSiteConfig() {
  const store = useConfigStore()
  const { config, village, theme, footer, navigation, features } = storeToRefs(store)
  return {
    config,
    village,
    theme,
    footer,
    navigation,
    features,
    isEnabled: (flag: FeatureFlag) => store.isEnabled(flag),
    refresh: () => store.fetch(true),
  }
}

/** Guard a page/section behind a feature flag. */
export function useFeature(flag: FeatureFlag) {
  const store = useConfigStore()
  const enabled = computed(() => store.isEnabled(flag))
  return { enabled }
}
