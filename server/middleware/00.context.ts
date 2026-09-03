/**
 * Runs first on every request:
 *  - resolves the authenticated user (cached on event.context.authUser)
 *  - applies baseline security headers
 * Route handlers then call requireAuth() / requirePermission() as needed.
 */
export default defineEventHandler(async (event) => {
  // Security headers (API + pages)
  setResponseHeaders(event, {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'SAMEORIGIN',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'X-XSS-Protection': '0',
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
  })

  // Pre-resolve the session so downstream handlers + activity logs have it.
  if (event.path.startsWith('/api/')) {
    await getSessionUser(event).catch(() => null)
  }
})
