import { apiRequest } from "@/api/request"

export type PublicMapMedia = {
  id: number
  year?: number
  imagePath?: string
  previewUrl?: string
  thumbnailUrl?: string
  description?: string
  type?: string
}

export type PublicMapPoi = {
  id: number
  name: string
  latitude: number
  longitude: number
  status?: number
  description?: string
  coverImagePath?: string
  coverPreviewUrl?: string
  coverThumbnailUrl?: string
  availableYears?: number[]
  mediaList?: PublicMapMedia[]
}

export type WalkingRoutePoint = {
  name: string
  lat: number
  lng: number
}

export type WalkingRouteCoordinate = {
  lat: number
  lng: number
}

export type WalkingRouteLeg = {
  from: WalkingRoutePoint
  to: WalkingRoutePoint
  distanceMeters: number
  durationSeconds: number
  path: WalkingRouteCoordinate[]
}

export type WalkingRoutePlan = {
  mode: string
  provider: string
  totalDistanceMeters: number
  totalDurationSeconds: number
  legs: WalkingRouteLeg[]
}

type PublicMapHome = {
  pois?: PublicMapPoi[]
}

export async function getPublicMapConfig() {
  const data = await apiRequest<{ tencentMapKey?: string }>(
    "/portal/map/config",
    { auth: false }
  )
  return { tencentMapKey: data.tencentMapKey ?? "" }
}

export async function getPublicMapHome(year?: number) {
  const data = await apiRequest<PublicMapHome>("/portal/map/home", {
    auth: false,
    query: { year },
  })

  return {
    pois: data.pois ?? [],
  }
}

export function planWalkingRoute(points: WalkingRoutePoint[]) {
  return apiRequest<WalkingRoutePlan>("/map/walking-route", {
    method: "POST",
    auth: false,
    body: { points },
  })
}
