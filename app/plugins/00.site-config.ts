import type { SiteConfig } from '~~/shared/types/config'
import { hexToRgbChannels, googleFontsHref } from '~~/shared/utils/color'

/**
 * Boots the platform: loads the resolved site config (branding, theme,
 * navigation, footer, feature flags) once during SSR and hydrates it, then
 * injects the Dynamic Theme as CSS variables + Google Fonts with no FOUC.
 */
export default defineNuxtPlugin(async (nuxtApp) => {
  const store = useConfigStore()

  if (!store.loaded) {
    const { data } = await useAsyncData<SiteConfig>('site-config', () =>
      $fetch('/api/public/config').then((r) => (r as { data: SiteConfig }).data),
    )
    if (data.value) store.set(data.value)
  }

  const cfg = store.config
  const t = cfg.theme

  const cssVars = () => {
    const c = t.colors
    const light = [
      `--color-primary:${hexToRgbChannels(c.primary)}`,
      `--color-secondary:${hexToRgbChannels(c.secondary)}`,
      `--color-accent:${hexToRgbChannels(c.accent)}`,
      `--color-surface:${hexToRgbChannels(c.surface)}`,
      `--color-surface-muted:${hexToRgbChannels(c.surfaceMuted)}`,
      `--color-ink:${hexToRgbChannels(c.ink)}`,
      `--color-ink-muted:${hexToRgbChannels(c.inkMuted)}`,
      `--color-line:${hexToRgbChannels(c.line)}`,
      `--font-heading:${t.typography.fontHeading}`,
      `--font-body:${t.typography.fontBody}`,
      `--font-scale:${t.typography.fontScale}`,
      `--radius:${t.layout.radius}`,
      `--container-width:${t.layout.containerWidth}`,
      `--btn-style:${t.layout.buttonStyle}`,
      `--card-style:${t.layout.cardStyle}`,
    ].join(';')
    const dark = [
      `--color-surface:${hexToRgbChannels(c.darkSurface)}`,
      `--color-surface-muted:${hexToRgbChannels(c.darkSurfaceMuted)}`,
      `--color-ink:${hexToRgbChannels(c.darkInk)}`,
      `--color-ink-muted:${hexToRgbChannels(c.darkInkMuted)}`,
      `--color-line:${hexToRgbChannels(c.darkLine)}`,
    ].join(';')
    return `:root{${light}}.dark{${dark}}`
  }

  const fontsHref = googleFontsHref(t.typography.googleFonts)

  useHead({
    link: [
      ...(fontsHref
        ? [
            { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
            { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' as const },
            { rel: 'stylesheet', href: fontsHref },
          ]
        : []),
      ...(cfg.village.favicon ? [{ rel: 'icon', href: cfg.village.favicon }] : []),
    ],
    style: [{ id: 'theme-vars', innerHTML: cssVars() }],
    htmlAttrs: { lang: 'id' },
  })

  // Theme mode (light / dark / system) - client only
  if (import.meta.client) {
    const mode = t.mode
    const mql = window.matchMedia('(prefers-color-scheme: dark)')
    const apply = () => {
      const dark = mode === 'dark' || (mode === 'system' && mql.matches)
      document.documentElement.classList.toggle('dark', dark)
    }
    apply()
    if (mode === 'system') mql.addEventListener('change', apply)
  }

  nuxtApp.provide('site', cfg)
})
