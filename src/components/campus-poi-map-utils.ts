export type CampusPoiMapMode = "all" | "timeline"
export type CampusPoiId = number | string

export type CampusPoiMapMedia = {
  id?: CampusPoiId
  year?: number | string | null
  description?: string | null
  type?: string | null
}

export type CampusPoiMapPoi = {
  id: CampusPoiId
  name: string
  latitude: number | string
  longitude: number | string
  status?: number | string | null
  description?: string | null
  mediaCount?: number | string | null
  availableYears?: Array<number | string | null | undefined> | null
  mediaList?: CampusPoiMapMedia[] | null
}

export type CampusPoiNearestItem<TPoi extends CampusPoiMapPoi> = {
  poi: TPoi
  distance: number
  mediaCount: number
}

export const BUAA_CAMPUS_CENTER = { lat: 39.981316, lng: 116.348009 }

const BUAA_CAMPUS_CORNERS = [
  { lat: 39.986038, lng: 116.340689 },
  { lat: 39.986499, lng: 116.353036 },
  { lat: 39.976506, lng: 116.340064 },
  { lat: 39.976435, lng: 116.354171 },
]

const CAMPUS_BOUNDS_PADDING = { lat: 0.0012, lng: 0.0015 }

export const CAMPUS_NEAREST_POI_LIMIT = 5

export const BUAA_CAMPUS_DRAG_BOUNDS = {
  southWest: {
    lat:
      Math.min(...BUAA_CAMPUS_CORNERS.map((corner) => corner.lat)) -
      CAMPUS_BOUNDS_PADDING.lat,
    lng:
      Math.min(...BUAA_CAMPUS_CORNERS.map((corner) => corner.lng)) -
      CAMPUS_BOUNDS_PADDING.lng,
  },
  northEast: {
    lat:
      Math.max(...BUAA_CAMPUS_CORNERS.map((corner) => corner.lat)) +
      CAMPUS_BOUNDS_PADDING.lat,
    lng:
      Math.max(...BUAA_CAMPUS_CORNERS.map((corner) => corner.lng)) +
      CAMPUS_BOUNDS_PADDING.lng,
  },
}

function toNumber(value: unknown) {
  const numberValue = Number(value)
  return Number.isFinite(numberValue) ? numberValue : null
}

function normalizeYear(value: unknown) {
  const year = Number(value)
  return Number.isInteger(year) ? year : null
}

export function campusPoiKey(poi: CampusPoiMapPoi) {
  return String(poi.id)
}

export function isCampusPoiValid(poi: CampusPoiMapPoi) {
  return toNumber(poi.latitude) !== null && toNumber(poi.longitude) !== null
}

export function getCampusPoiMediaForYear<TMedia extends CampusPoiMapMedia>(
  poi: { mediaList?: TMedia[] | null },
  year: number | null | undefined
) {
  const mediaList = poi.mediaList ?? []
  if (!year) {
    return mediaList
  }

  return mediaList.filter((media) => normalizeYear(media.year) === year)
}

export function getCampusPoiMediaCount(poi: CampusPoiMapPoi) {
  const listedCount = poi.mediaList?.length ?? 0
  const explicitCount = Math.max(0, Number(poi.mediaCount) || 0)

  return Math.max(listedCount, explicitCount)
}

export function getCampusPoiAvailableYears(pois: CampusPoiMapPoi[]) {
  return Array.from(
    new Set(
      pois.flatMap((poi) => [
        ...(poi.availableYears ?? [])
          .map(normalizeYear)
          .filter((year): year is number => year !== null),
        ...(poi.mediaList ?? [])
          .map((media) => normalizeYear(media.year))
          .filter((year): year is number => year !== null),
      ])
    )
  ).sort((a, b) => a - b)
}

export function getCampusPoiMediaCountForYear(
  poi: CampusPoiMapPoi,
  year: number | null
) {
  if (!year) {
    return getCampusPoiMediaCount(poi)
  }

  const mediaList = poi.mediaList ?? []
  const matchedCount = getCampusPoiMediaForYear(poi, year).length
  if (matchedCount > 0 || mediaList.length > 0) {
    return matchedCount
  }

  const hasYear = (poi.availableYears ?? []).map(normalizeYear).includes(year)

  return hasYear ? getCampusPoiMediaCount(poi) : 0
}

export function getCampusPoiMediaCountForMode(
  poi: CampusPoiMapPoi,
  mode: CampusPoiMapMode,
  activeYear: number | null
) {
  return mode === "all"
    ? getCampusPoiMediaCount(poi)
    : getCampusPoiMediaCountForYear(poi, activeYear)
}

export function getCampusPoiDistanceMeters(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number }
) {
  const radius = 6371000
  const lat1 = (from.lat * Math.PI) / 180
  const lat2 = (to.lat * Math.PI) / 180
  const dLat = ((to.lat - from.lat) * Math.PI) / 180
  const dLng = ((to.lng - from.lng) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2

  return radius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export function formatCampusPoiDistance(meters: number) {
  return meters >= 1000
    ? `${(meters / 1000).toFixed(1)} km`
    : `${Math.round(meters)} m`
}
