import type { NeighborhoodBoundary } from '~/types/database'
import { guessLandmarkCategory, type LandmarkCategory } from '~/config/landmark'

/**
 * Parsing for the admin "Import Peta" flow (GeoJSON or zipped shapefile → selectable polygons).
 * Kept free of Vue/Supabase so every branch can be exercised directly.
 */

export type ImportCandidate = {
  key: number
  name: string
  boundary: NeighborhoodBoundary
  /** Why the row can't be picked: a lingkungan with this name already exists, or the file repeats it. */
  blocked: 'exists' | 'duplicate' | null
  selected: boolean
}

/** Read a .geojson/.json or zipped shapefile into GeoJSON. Throws with a user-facing message. */
export async function readBoundaryFile(file: File): Promise<unknown> {
  const name = file.name.toLowerCase()
  if (name.endsWith('.geojson') || name.endsWith('.json')) {
    try {
      return JSON.parse(await file.text())
    }
    catch {
      throw new Error('Isi file bukan JSON yang valid.')
    }
  }
  if (name.endsWith('.zip')) {
    const shp = (await import('shpjs')).default
    try {
      return await shp(await file.arrayBuffer())
    }
    catch {
      throw new Error('File .zip harus berisi shapefile (.shp, .dbf, .prj).')
    }
  }
  throw new Error('Format tidak didukung. Gunakan .geojson, .json, atau .zip (shapefile).')
}

function featuresOf(parsed: unknown): GeoJSON.Feature[] {
  const items = Array.isArray(parsed) ? parsed : [parsed]
  return items.flatMap((item) => {
    if (!item || typeof item !== 'object') return []
    const obj = item as { type?: string, features?: unknown }
    if (obj.type === 'Feature') return [item as GeoJSON.Feature]
    return Array.isArray(obj.features) ? (obj.features as GeoJSON.Feature[]) : []
  })
}

export function featureName(props: GeoJSON.GeoJsonProperties, index: number): string {
  const p = props ?? {}
  for (const key of ['NAMOBJ', 'WADMKD', 'DESA', 'Name', 'NAME', 'name', 'Nama', 'NAMA', 'nama']) {
    const v = p[key]
    if (v != null && String(v).trim()) return String(v).trim()
  }
  return `Area ${index + 1}`
}

function positions(b: NeighborhoodBoundary): number[][] {
  return (b.coordinates as number[][][]).flat(b.type === 'MultiPolygon' ? 2 : 1) as number[][]
}

/** Bounding-box centre, or null when the geometry has no usable points. */
export function boundaryCenter(b: NeighborhoodBoundary): { lat: number, lng: number } | null {
  let minLat = Infinity, maxLat = -Infinity, minLng = Infinity, maxLng = -Infinity
  for (const [lng, lat] of positions(b) as [number, number][]) {
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue
    minLat = Math.min(minLat, lat); maxLat = Math.max(maxLat, lat)
    minLng = Math.min(minLng, lng); maxLng = Math.max(maxLng, lng)
  }
  return Number.isFinite(minLat) ? { lat: (minLat + maxLat) / 2, lng: (minLng + maxLng) / 2 } : null
}

function isLngLat(b: NeighborhoodBoundary) {
  return positions(b).every(([lng, lat]) => Math.abs(lng!) <= 180 && Math.abs(lat!) <= 90)
}

/**
 * Turn parsed GeoJSON into import candidates. Non-polygons and empty geometries are skipped.
 * Throws if the file has no polygons, or if its coordinates are not WGS84 lng/lat
 * (e.g. a GeoJSON exported in UTM metres), which would otherwise land in the wrong place.
 */
export function extractCandidates(parsed: unknown, existingNames: string[]): ImportCandidate[] {
  const existing = new Set(existingNames.map((n) => n.trim().toLowerCase()))
  const seen = new Set<string>()
  const out: ImportCandidate[] = []

  featuresOf(parsed).forEach((f, i) => {
    const g = f?.geometry
    if (!g || (g.type !== 'Polygon' && g.type !== 'MultiPolygon')) return
    const boundary = { type: g.type, coordinates: g.coordinates } as NeighborhoodBoundary
    if (!boundaryCenter(boundary)) return
    if (!isLngLat(boundary)) {
      throw new Error('Koordinat file bukan lat/lng (WGS84). Ekspor ulang dengan CRS EPSG:4326, atau sertakan file .prj di dalam zip.')
    }
    const name = featureName(f.properties, i)
    const lower = name.toLowerCase()
    const blocked = existing.has(lower) ? 'exists' : seen.has(lower) ? 'duplicate' : null
    seen.add(lower)
    out.push({ key: i, name, boundary, blocked, selected: false })
  })

  if (!out.length) throw new Error('Tidak ada poligon batas wilayah di file ini.')
  return out.sort((a, b) => a.name.localeCompare(b.name, 'id'))
}

// ---- Titik landmark ---------------------------------------------------------

export type PointCandidate = {
  key: number
  name: string
  lat: number
  lng: number
  category: LandmarkCategory
  /** Same name at (practically) the same spot is already saved — e.g. the file was imported before. */
  exists: boolean
  selected: boolean
}

const CATEGORY_KEYS = ['kategori', 'KATEGORI', 'Kategori', 'jenis', 'JENIS', 'Jenis', 'category', 'type', 'TYPE', 'REMARK']

/**
 * Turn parsed GeoJSON into landmark candidates: every Point (and each point of a MultiPoint).
 * Polygons in the same file — e.g. the boundaries zipped alongside — are ignored.
 * New points start selected, since a landmark file is normally made for this kelurahan only.
 */
export function extractPointCandidates(
  parsed: unknown,
  existing: { name: string, lat: number, lng: number }[],
): PointCandidate[] {
  const out: PointCandidate[] = []
  let key = 0
  featuresOf(parsed).forEach((f, i) => {
    const g = f?.geometry
    const points = g?.type === 'Point' ? [g.coordinates] : g?.type === 'MultiPoint' ? g.coordinates : []
    const name = featureName(f.properties, i).replace(/^Area /, 'Titik ')
    const hint = [name, ...CATEGORY_KEYS.map((k) => f.properties?.[k]).filter((v) => v != null)].join(' ')
    for (const [lng, lat] of points as [number, number][]) {
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue
      if (Math.abs(lng) > 180 || Math.abs(lat) > 90) {
        throw new Error('Koordinat file bukan lat/lng (WGS84). Ekspor ulang dengan CRS EPSG:4326, atau sertakan file .prj di dalam zip.')
      }
      const exists = existing.some((e) =>
        e.name.trim().toLowerCase() === name.toLowerCase() && Math.abs(e.lat - lat) < 1e-5 && Math.abs(e.lng - lng) < 1e-5)
      out.push({ key: key++, name, lat, lng, category: guessLandmarkCategory(hint), exists, selected: !exists })
    }
  })
  if (!out.length) throw new Error('Tidak ada titik (Point) di file ini. Pastikan layer landmark disimpan sebagai titik, bukan poligon/garis.')
  return out.sort((a, b) => a.name.localeCompare(b.name, 'id'))
}
