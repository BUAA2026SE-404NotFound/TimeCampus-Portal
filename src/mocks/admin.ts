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
  role: "ADMIN"
  email: string
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
  visits: number
  submissions: number
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
  id: "admin-001",
  name: "TimeCampus Admin",
  role: "ADMIN",
  email: "kurna2026@outlook.com",
}

export const dashboardMetrics: DashboardMetric[] = [
  {
    label: "POI 总数",
    value: "128",
    detail: "活跃 POI 112 个",
    trend: "+12 本周",
    icon: Landmark,
  },
  {
    label: "官方内容",
    value: "842",
    detail: "可见内容 801 条",
    trend: "+48 本月",
    icon: BookOpenCheck,
  },
  {
    label: "待审核 UGC",
    value: "19",
    detail: "图片投稿 16 条",
    trend: "6 条超 24h",
    icon: FileClock,
  },
  {
    label: "评论待处理",
    value: "31",
    detail: "高风险 4 条",
    trend: "-8 今日",
    icon: MessageSquareWarning,
  },
]

export const trendData: TrendPoint[] = [
  { date: "05-09", visits: 820, submissions: 23 },
  { date: "05-10", visits: 940, submissions: 26 },
  { date: "05-11", visits: 1120, submissions: 31 },
  { date: "05-12", visits: 1058, submissions: 29 },
  { date: "05-13", visits: 1286, submissions: 42 },
  { date: "05-14", visits: 1320, submissions: 39 },
  { date: "05-15", visits: 1488, submissions: 46 },
]

export const pois: Poi[] = [
  {
    id: "poi-001",
    name: "沙河主楼",
    region: "沙河校区",
    latitude: 40.15938,
    longitude: 116.28791,
    status: "ACTIVE",
    coverage: 92,
    heat: 8840,
    updatedAt: "2026-05-15 10:12",
  },
  {
    id: "poi-002",
    name: "学院路晨兴音乐厅",
    region: "学院路校区",
    latitude: 39.98119,
    longitude: 116.34774,
    status: "ACTIVE",
    coverage: 74,
    heat: 5360,
    updatedAt: "2026-05-14 18:40",
  },
  {
    id: "poi-003",
    name: "老图书馆旧址",
    region: "学院路校区",
    latitude: 39.98014,
    longitude: 116.34572,
    status: "INACTIVE",
    coverage: 38,
    heat: 1260,
    updatedAt: "2026-05-12 09:25",
  },
  {
    id: "poi-004",
    name: "沙河操场",
    region: "沙河校区",
    latitude: 40.16076,
    longitude: 116.29046,
    status: "ACTIVE",
    coverage: 68,
    heat: 4120,
    updatedAt: "2026-05-11 15:08",
  },
]

export const officialImports: OfficialImport[] = [
  {
    id: "import-001",
    fileName: "shahe-history-photos.xlsx",
    type: "OFFICIAL",
    total: 96,
    success: 94,
    reviewStatus: "APPROVED",
    publishStatus: "VISIBLE",
    operator: "TimeCampus Admin",
    createdAt: "2026-05-15 09:10",
  },
  {
    id: "import-002",
    fileName: "xueyuan-road-archive.csv",
    type: "OFFICIAL",
    total: 48,
    success: 48,
    reviewStatus: "APPROVED",
    publishStatus: "VISIBLE",
    operator: "TimeCampus Admin",
    createdAt: "2026-05-13 16:22",
  },
]

export const ugcItems: UgcItem[] = [
  {
    id: "ugc-001",
    poiName: "沙河主楼",
    uploader: "航迹用户 2031",
    year: 2014,
    description: "沙河主楼启用初期的正门照片，含拍摄者授权说明。",
    source: "校友投稿",
    reviewStatus: "PENDING",
    publishStatus: "HIDDEN",
    createdAt: "2026-05-15 11:42",
  },
  {
    id: "ugc-002",
    poiName: "老图书馆旧址",
    uploader: "北航记忆",
    year: 1988,
    description: "疑似学院路老图书馆外立面，需要核验年代。",
    reviewStatus: "PENDING",
    publishStatus: "HIDDEN",
    createdAt: "2026-05-14 22:03",
  },
  {
    id: "ugc-003",
    poiName: "沙河操场",
    uploader: "tc_user_512",
    year: 2020,
    description: "夜跑活动照片，画面有可识别个人面部。",
    reviewStatus: "PENDING",
    publishStatus: "HIDDEN",
    createdAt: "2026-05-14 15:27",
  },
]

export const commentItems: CommentItem[] = [
  {
    id: "comment-001",
    poiName: "学院路晨兴音乐厅",
    userName: "tc_user_381",
    comment: "这张照片应该是 2008 年左右，不是 2011 年。",
    reviewStatus: "PENDING",
    createdAt: "2026-05-15 08:31",
  },
  {
    id: "comment-002",
    poiName: "沙河主楼",
    userName: "校友访客",
    comment: "建议补充建设过程中的施工围挡照片。",
    reviewStatus: "PENDING",
    createdAt: "2026-05-14 20:16",
  },
]

export const auditLogs: AuditLog[] = [
  {
    id: "log-001",
    type: "UGC_REVIEW",
    action: "驳回投稿 ugc-1024，原因：缺少来源说明",
    operator: "TimeCampus Admin",
    target: "ugc-1024",
    createdAt: "2026-05-15 12:02",
  },
  {
    id: "log-002",
    type: "POI_UPDATE",
    action: "更新 POI 坐标与校区归属",
    operator: "TimeCampus Admin",
    target: "poi-001",
    createdAt: "2026-05-15 10:14",
  },
  {
    id: "log-003",
    type: "CONTENT_IMPORT",
    action: "批量导入官方内容 94 条",
    operator: "TimeCampus Admin",
    target: "import-001",
    createdAt: "2026-05-15 09:12",
  },
  {
    id: "log-004",
    type: "COMMENT_REVIEW",
    action: "通过评论 comment-088",
    operator: "TimeCampus Admin",
    target: "comment-088",
    createdAt: "2026-05-14 18:09",
  },
]

export const mapSearchResults: MapSearchResult[] = pois.map((poi) => ({
  id: poi.id,
  name: poi.name,
  region: poi.region,
  latitude: poi.latitude,
  longitude: poi.longitude,
}))
