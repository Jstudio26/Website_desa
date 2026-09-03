/** "#1a2b3c" | "#abc" -> "26 43 60" (space separated RGB channels). */
export function hexToRgbChannels(hex: string): string {
  let h = hex.replace('#', '').trim()
  if (h.length === 3) h = h.split('').map((c) => c + c).join('')
  if (h.length !== 6) return '0 0 0'
  const n = Number.parseInt(h, 16)
  // eslint-disable-next-line no-bitwise
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`
}

/** Build a Google Fonts stylesheet URL from ["Playfair Display:wght@500;700", ...]. */
export function googleFontsHref(families: string[]): string | null {
  const clean = families.filter(Boolean)
  if (!clean.length) return null
  const params = clean.map((f) => `family=${encodeURIComponent(f).replace(/%3A/g, ':').replace(/%40/g, '@').replace(/%3B/g, ';')}`)
  return `https://fonts.googleapis.com/css2?${params.join('&')}&display=swap`
}
