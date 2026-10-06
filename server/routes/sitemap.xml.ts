import { FOOTER_COLUMNS, NAV } from '../../app/config/site'

/**
 * sitemap.xml: every public page in the navigation + all published news/announcements.
 * Uses the request origin, so it is correct on any domain without extra config.
 */
export default defineEventHandler(async (event) => {
  const origin = getRequestURL(event).origin
  const { url, key } = useRuntimeConfig(event).public.supabase as { url: string, key: string }

  const pages = new Set<string>(['/'])
  for (const item of NAV) {
    pages.add(item.url)
    for (const child of item.children) pages.add(child.url)
  }
  for (const col of FOOTER_COLUMNS) for (const link of col.links) pages.add(link.url)

  let posts: { type: string, slug: string, updated_at: string }[] = []
  try {
    posts = await $fetch(`${url}/rest/v1/posts`, {
      query: { select: 'type,slug,updated_at', published: 'eq.true', order: 'published_at.desc' },
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    })
  }
  catch {
    // Database unreachable: still serve the static pages.
  }

  const entry = (path: string, lastmod?: string) =>
    `  <url><loc>${origin}${path}</loc>${lastmod ? `<lastmod>${lastmod.slice(0, 10)}</lastmod>` : ''}</url>`

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...[...pages].map((p) => entry(p)),
    ...posts.map((p) => entry(`/${p.type}/${encodeURIComponent(p.slug)}`, p.updated_at)),
    '</urlset>',
  ].join('\n')

  setHeader(event, 'Content-Type', 'application/xml; charset=utf-8')
  setHeader(event, 'Cache-Control', 'public, max-age=3600')
  return xml
})
