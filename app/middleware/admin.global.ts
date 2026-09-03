/**
 * Guards every /admin route (except /admin/login). Client-side only — the
 * server APIs enforce their own auth + RBAC, this just handles redirects/UX.
 */
export default defineNuxtRouteMiddleware(async (to) => {
  if (!to.path.startsWith('/admin')) return
  if (to.path === '/admin/login') return

  const auth = useAuthStore()
  if (!auth.ready) await auth.fetchMe()

  if (!auth.isAuthenticated) {
    return navigateTo({ path: '/admin/login', query: { redirect: to.fullPath } })
  }
})
