import type { Directive } from 'vue'

/**
 * `v-reveal` — fades/slides an element in as it scrolls into view (styles: `.reveal` in main.css).
 *
 * - Each element registers itself, so content rendered later (async data, pagination, v-if)
 *   is animated too — a one-off querySelectorAll would leave it stuck at opacity 0.
 * - On the first load, elements already on screen were painted by SSR, so they are left
 *   alone instead of flashing out and back in. After hydration everything animates.
 * - The classes are removed once the transition ends, so the element's own
 *   transform/transition (e.g. `.card-hover` lift) works normally afterwards.
 * - Optional value is a stagger index: `v-reveal="i"` delays by i × 70ms (capped).
 */
type RevealDirective = Directive<HTMLElement, number | undefined>

declare module 'vue' {
  interface GlobalDirectives {
    vReveal: RevealDirective
  }
}

const STEP_MS = 70
const MAX_STEPS = 6

export default defineNuxtPlugin((nuxtApp) => {
  if (import.meta.server) {
    nuxtApp.vueApp.directive<HTMLElement, number | undefined>('reveal', { getSSRProps: () => ({}) })
    return
  }

  const enabled = 'IntersectionObserver' in window
    && !window.matchMedia('(prefers-reduced-motion: reduce)').matches

  let hydrated = false
  nuxtApp.hook('app:mounted', () => { hydrated = true })

  const cleanup = (el: HTMLElement) => {
    el.classList.remove('reveal', 'is-visible')
    el.style.transitionDelay = ''
  }

  const io = enabled
    ? new IntersectionObserver((entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          const el = entry.target as HTMLElement
          io!.unobserve(el)
          el.classList.add('is-visible')
          const delay = parseFloat(el.style.transitionDelay) || 0
          const onEnd = (ev: TransitionEvent) => {
            if (ev.target !== el) return
            el.removeEventListener('transitionend', onEnd)
            cleanup(el)
          }
          el.addEventListener('transitionend', onEnd)
          // Fallback in case transitionend never fires (e.g. element hidden mid-transition).
          setTimeout(() => {
            el.removeEventListener('transitionend', onEnd)
            cleanup(el)
          }, 900 + delay)
        }
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 })
    : null

  nuxtApp.vueApp.directive<HTMLElement, number | undefined>('reveal', {
    mounted(el, binding) {
      if (!io) return
      if (!hydrated) {
        const r = el.getBoundingClientRect()
        if (r.top < window.innerHeight && r.bottom > 0) return
      }
      el.classList.add('reveal')
      const step = binding.value
      if (typeof step === 'number' && step > 0) el.style.transitionDelay = `${Math.min(step, MAX_STEPS) * STEP_MS}ms`
      io.observe(el)
    },
    unmounted(el) {
      io?.unobserve(el)
    },
  })
})
