import type { Config } from 'tailwindcss'

/**
 * The palette below is intentionally driven by CSS variables that the
 * Dynamic Theme Engine writes at runtime (see app/plugins/theme.ts).
 * Changing colors / radius / fonts in the Admin Dashboard updates the
 * variables live - no rebuild required.
 */
export default <Partial<Config>>{
  darkMode: 'class',
  content: [
    './app/components/**/*.{vue,js,ts}',
    './app/layouts/**/*.vue',
    './app/pages/**/*.vue',
    './app/composables/**/*.{js,ts}',
    './app/plugins/**/*.{js,ts}',
    './app/app.vue',
    './app/error.vue',
  ],
  theme: {
    extend: {
      colors: {
        primary: withOpacity('--color-primary'),
        secondary: withOpacity('--color-secondary'),
        accent: withOpacity('--color-accent'),
        surface: withOpacity('--color-surface'),
        'surface-muted': withOpacity('--color-surface-muted'),
        ink: withOpacity('--color-ink'),
        'ink-muted': withOpacity('--color-ink-muted'),
        line: withOpacity('--color-line'),
      },
      fontFamily: {
        heading: 'var(--font-heading)',
        body: 'var(--font-body)',
      },
      borderRadius: {
        theme: 'var(--radius)',
      },
      maxWidth: {
        container: 'var(--container-width)',
      },
      fontSize: {
        'fluid-h1': ['clamp(2.25rem, 1.5rem + 3.5vw, 4rem)', { lineHeight: '1.05' }],
        'fluid-h2': ['clamp(1.75rem, 1.2rem + 2.2vw, 2.75rem)', { lineHeight: '1.12' }],
        'fluid-h3': ['clamp(1.35rem, 1.1rem + 1vw, 1.85rem)', { lineHeight: '1.2' }],
      },
      container: {
        center: true,
        padding: { DEFAULT: '1rem', lg: '2rem' },
      },
    },
  },
  plugins: [],
}

function withOpacity(variable: string) {
  return ({ opacityValue }: { opacityValue?: string }) => {
    if (opacityValue !== undefined) return `rgb(var(${variable}) / ${opacityValue})`
    return `rgb(var(${variable}))`
  }
}
