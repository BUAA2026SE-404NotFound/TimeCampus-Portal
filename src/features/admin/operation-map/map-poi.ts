import type { AdminMapPoi } from "@/api/admin"

export function isValidPoi(poi: AdminMapPoi) {
  return Number.isFinite(Number(poi.latitude)) && Number.isFinite(Number(poi.longitude))
}
