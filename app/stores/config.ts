import { defineStore } from 'pinia'
import type { SiteConfig, FeatureFlag } from '~~/shared/types/config'
import {
  DEFAULT_FEATURES,
  DEFAULT_FOOTER,
  DEFAULT_THEME,
  DEFAULT_VILLAGE,
} from '~~/config/defaults'

const FALLBACK: SiteConfig = {
  village: DEFAULT_VILLAGE,
  theme: DEFAULT_THEME,
  features: DEFAULT_FEATURES,
  footer: DEFAULT_FOOTER,
  navigation: [],
}

export const useConfigStore = defineStore('config', {
  state: () => ({
    config: FALLBACK as SiteConfig,
    loaded: false,
  }),
  getters: {
    village: (s) => s.config.village,
    theme: (s) => s.config.theme,
    footer: (s) => s.config.footer,
    navigation: (s) => s.config.navigation,
    features: (s) => s.config.features,
    isEnabled: (s) => (flag: FeatureFlag) => !!s.config.features[flag],
  },
  actions: {
    async fetch(force = false) {
      if (this.loaded && !force) return
      const { data } = await useFetch('/api/public/config', {
        key: 'site-config',
        transform: (r: unknown) => (r as { ok: boolean, data: SiteConfig }).data,
      })
      if (data.value) {
        this.config = data.value
        this.loaded = true
      }
    },
    set(config: SiteConfig) {
      this.config = config
      this.loaded = true
    },
  },
})
