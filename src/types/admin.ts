import type { LucideIcon } from "lucide-react"

export type ReviewStatus = "PENDING" | "APPROVED" | "REJECTED"
export type PublishStatus = "VISIBLE" | "HIDDEN"
export type PoiStatus = "ACTIVE" | "INACTIVE"

export type AdminProfile = {
  id: string
  name: string
  role: "SUPER" | "ADMIN" | "READ" | "NONE"
  email: string
}

export type AdminPermission = "super" | "admin" | "read" | "none"

export type AdminAccount = {
  id: string
  adminName: string
  role: AdminPermission
  status: "ENABLED" | "DISABLED"
  createTime: string
}

export type DashboardMetric = {
  label: string
  value: string
  detail: string
  trend: string
  icon: LucideIcon
}

export type TrendPoint = {
  date: string
  mediaCount: number
  ugcCount: number
  commentCount: number
}

export type DashboardDistribution = {
  label: string
  value: number
}

export type Poi = {
  id: string
  name: string
  region: string
  latitude: number
  longitude: number
  status: PoiStatus
  coverage: number
  heat: number
  updatedAt: string
}

export type OfficialImport = {
  id: string
  fileName: string
  type: "OFFICIAL"
  total: number
  success: number
  reviewStatus: "APPROVED"
  publishStatus: "VISIBLE"
  operator: string
  createdAt: string
}

export type MediaRecord = {
  id: string
  poiId: string
  poiName: string
  type: string
  imagePath?: string
  previewUrl?: string
  thumbnailUrl?: string
  year: number
  description: string
  uploader?: string
  reviewStatus: ReviewStatus
  publishStatus: PublishStatus
  rejectReason?: string
  reviewTime?: string
  reviewer?: string
  createdAt: string
  updatedAt: string
}

export type UgcItem = {
  id: string
  poiName: string
  uploader: string
  year: number
  description: string
  source?: string
  reviewStatus: ReviewStatus
  publishStatus: PublishStatus
  createdAt: string
}

export type CommentItem = {
  id: string
  poiName: string
  userName: string
  comment: string
  reviewStatus: ReviewStatus
  createdAt: string
}

export type AuditLog = {
  id: string
  type: string
  action: string
  operator: string
  target: string
  createdAt: string
}

export type MapSearchResult = {
  id: string
  name: string
  region: string
  latitude: number
  longitude: number
}
