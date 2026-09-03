/**
 * Adds `.is-visible` to `.reveal` elements as they scroll into view.
 * Respects prefers-reduced-motion (CSS handles the no-op).
 */
export function useReveal() {
  onMounted(() => {
    if (!import.meta.client || !('IntersectionObserver' in window)) return
    const els = document.querySelectorAll('.reveal:not(.is-visible)')
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add('is-visible')
            io.unobserve(e.target)
          }
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.05 },
    )
    els.forEach((el) => io.observe(el))
    onBeforeUnmount(() => io.disconnect())
  })
}
