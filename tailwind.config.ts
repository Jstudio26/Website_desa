/**
 * Palette / radius / fonts are driven by CSS variables defined once, statically,
 * in app/assets/css/main.css. Change the look there.
 */
function withOpacity(variable: string) {
  return ({ opacityValue }: { opacityValue?: string }) => {
    if (opacityValue !== undefined) return `rgb(var(${variable}) / ${opacityValue})`
    return `rgb(var(${variable}))`
  }
}

export default {
  darkMode: 'class',
  content: [
    './app/components/**/*.{vue,js,ts}',
    './app/layouts/**/*.vue',
    './app/pages/**/*.vue',
    './app/composables/**/*.{js,ts}',
    './app/app.vue',
    './app/error.vue',
  ],
  theme: {
    extend: {
      colors: {
        primary: withOpacity('--color-primary'),
        'primary-deep': withOpacity('--color-primary-deep'),
        secondary: withOpacity('--color-secondary'),
        accent: withOpacity('--color-accent'),
        canvas: withOpacity('--color-canvas'),
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
      boxShadow: {
        card: 'var(--shadow-card)',
        lift: 'var(--shadow-lift)',
        red: 'var(--shadow-red)',
      },
      fontSize: {
        'fluid-h1': ['clamp(2.4rem, 1.6rem + 3.8vw, 4.25rem)', { lineHeight: '1.04' }],
        'fluid-h2': ['clamp(1.9rem, 1.3rem + 2.4vw, 2.9rem)', { lineHeight: '1.1' }],
        'fluid-h3': ['clamp(1.4rem, 1.1rem + 1.1vw, 1.9rem)', { lineHeight: '1.2' }],
      },
      container: {
        center: true,
        padding: { DEFAULT: '1rem', lg: '2rem' },
      },
    },
  },
  plugins: [],
}
