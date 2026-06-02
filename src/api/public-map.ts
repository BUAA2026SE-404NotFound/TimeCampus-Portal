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

type PublicMapHome = {
  pois?: PublicMapPoi[]
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
