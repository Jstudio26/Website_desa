/** robots.txt: keep the admin panel out of search engines and point to the sitemap. */
export default defineEventHandler((event) => {
  const origin = getRequestURL(event).origin
  setHeader(event, 'Content-Type', 'text/plain; charset=utf-8')
  return [
    'User-agent: *',
    'Allow: /',
    'Disallow: /admin',
    'Disallow: /confirm',
    '',
    `Sitemap: ${origin}/sitemap.xml`,
    '',
  ].join('\n')
})
