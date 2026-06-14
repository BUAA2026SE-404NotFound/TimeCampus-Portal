import { apiRequest } from "@/api/request"

export type SeedreamBackground = {
  id: string
  title: string
  year: string
  description: string
  previewUrl: string
}

export type SeedreamGenerationResult = {
  imageUrl: string
  background: SeedreamBackground
  model: string
  promptVersion: string
}

export function getSeedreamBackgrounds() {
  return apiRequest<SeedreamBackground[]>("/portal/seedream/backgrounds", {
    auth: false,
  })
}

export function generateSeedreamImage(file: File, backgroundId: string) {
  const formData = new FormData()
  formData.append("file", file)
  formData.append("backgroundId", backgroundId)

  return apiRequest<SeedreamGenerationResult>("/portal/seedream/generations", {
    method: "POST",
    body: formData,
    auth: false,
  })
}
