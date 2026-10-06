import type { Landmark } from '~/types/database'
import { landmarkCategory } from '~/config/landmark'

type Leaflet = typeof import('leaflet')

function svg(name: string, size: number) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${ICON_PATHS[name] ?? ICON_PATHS.mapPin}"/></svg>`
}

function escapeHtml(text: string) {
  return text.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', '\'': '&#39;' })[c]!)
}

/** Red teardrop pin with the category icon. Styles: `.landmark-pin` in main.css. */
export function landmarkIcon(L: Leaflet, category: string) {
  return L.divIcon({
    className: 'landmark-pin',
    html: `<span>${svg(landmarkCategory(category).icon, 16)}</span>`,
    iconSize: [32, 32],
    // The rotated square's tip sits ~6px below its box.
    iconAnchor: [16, 38],
    popupAnchor: [0, -34],
  })
}

export function directionsUrl(l: Pick<Landmark, 'lat' | 'lng'>) {
  return `https://www.google.com/maps/dir/?api=1&destination=${l.lat},${l.lng}`
}

/** Popup body for the public map. Every admin-entered value is escaped. */
export function landmarkPopupHtml(l: Landmark) {
  const cat = landmarkCategory(l.category)
  return `<div class="landmark-popup">
    ${l.photo_url ? `<img src="${escapeHtml(l.photo_url)}" alt="${escapeHtml(l.name)}" loading="lazy">` : ''}
    <p class="lp-cat">${cat.label}</p>
    <p class="lp-name">${escapeHtml(l.name)}</p>
    ${l.address ? `<p class="lp-addr">${escapeHtml(l.address)}</p>` : ''}
    ${l.description ? `<p class="lp-desc">${escapeHtml(l.description)}</p>` : ''}
    <a class="lp-dir" href="${directionsUrl(l)}" target="_blank" rel="noopener">${svg('navigation', 13)} Petunjuk Arah</a>
  </div>`
}
