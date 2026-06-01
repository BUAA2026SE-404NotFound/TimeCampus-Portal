import {
  BookOpenCheck,
  FileClock,
  Landmark,
  MessageSquareWarning,
} from "lucide-react"

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
  icon: typeof Landmark
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

export const mockAdminProfile: AdminProfile = {
  id: "0",
  name: "?",
  role: "NONE",
  email: "?",
}

export const adminAccounts: AdminAccount[] = []

export const dashboardMetrics: DashboardMetric[] = [
  {
    label: "POI 总数",
    value: "?",
    detail: "活跃 POI ? 个",
    trend: "+0 本周",
    icon: Landmark,
  },
  {
    label: "图片内容",
    value: "?",
    detail: "可见内容 ? 条",
    trend: "+0 本周",
    icon: BookOpenCheck,
  },
  {
    label: "待审核 UGC",
    value: "?",
    detail: "图片投稿 ? 条",
    trend: "+0 本周",
    icon: FileClock,
  },
  {
    label: "评论待处理",
    value: "?",
    detail: "待审核评论 ? 条",
    trend: "?",
    icon: MessageSquareWarning,
  },
]

export const trendData: TrendPoint[] = []

export const pois: Poi[] = []

export const officialImports: OfficialImport[] = []

export const mediaRecords: MediaRecord[] = []

export const ugcItems: UgcItem[] = []

export const commentItems: CommentItem[] = []

export const auditLogs: AuditLog[] = []

export const mapSearchResults: MapSearchResult[] = pois.map((poi) => ({
  id: poi.id,
  name: poi.name,
  region: poi.region,
  latitude: poi.latitude,
  longitude: poi.longitude,
}))
