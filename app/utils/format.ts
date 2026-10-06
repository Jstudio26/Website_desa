import { SITE_LOCALE } from '~/config/site'

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '') // strip diacritics
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80)
}

export function formatDate(value?: string | null, style: 'medium' | 'long' = 'medium'): string {
  if (!value) return '—'
  return new Intl.DateTimeFormat(SITE_LOCALE, { dateStyle: style }).format(new Date(value))
}

export function formatNumber(value?: number | null): string {
  if (value == null) return '—'
  return new Intl.NumberFormat(SITE_LOCALE).format(value)
}

/** Date + time, e.g. "6 Okt 2026, 09.31" — for status history. */
export function formatDateTime(value?: string | null): string {
  if (!value) return '—'
  return new Intl.DateTimeFormat(SITE_LOCALE, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}
