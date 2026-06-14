import buildingEightImage from "@/assets/seedream-backgrounds/building-eight-001.jpg"
import buildingOneImage from "@/assets/seedream-backgrounds/building-one-002.jpg"
import gateImage from "@/assets/seedream-backgrounds/gate-001.jpg"
import libraryImage from "@/assets/seedream-backgrounds/library-007.jpg"
import mainBuildingImage from "@/assets/seedream-backgrounds/main-building-2010-001.jpg"

export type SeedreamTemplateAsset = {
  id: string
  title: string
  year: string
  description: string
  imageUrl: string
}

export const SEEDREAM_TEMPLATE_ASSETS: SeedreamTemplateAsset[] = [
  {
    id: "campus-gate-001",
    title: "北航校门",
    year: "历史影像",
    description: "北航校门历史场景",
    imageUrl: gateImage,
  },
  {
    id: "building-one-002",
    title: "一号楼",
    year: "历史影像",
    description: "八楼区域一号楼历史场景",
    imageUrl: buildingOneImage,
  },
  {
    id: "building-eight-001",
    title: "八号楼如心楼",
    year: "历史影像",
    description: "八楼区域如心楼历史场景",
    imageUrl: buildingEightImage,
  },
  {
    id: "main-building-2010",
    title: "主楼",
    year: "2010",
    description: "主楼历史影像场景",
    imageUrl: mainBuildingImage,
  },
  {
    id: "library-007",
    title: "图书馆",
    year: "历史影像",
    description: "图书馆历史影像场景",
    imageUrl: libraryImage,
  },
]

export function getSeedreamTemplateAssetUrl(id: string) {
  return SEEDREAM_TEMPLATE_ASSETS.find((template) => template.id === id)
    ?.imageUrl
}
