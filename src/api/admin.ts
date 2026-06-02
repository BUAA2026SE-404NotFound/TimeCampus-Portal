import { apiRequest } from "@/api/request"
import {
  dashboardMetrics,
  trendData,
  type AdminAccount,
  type AdminPermission,
  type AdminProfile,
  type AuditLog,
  type CommentItem,
  type DashboardDistribution,
  type DashboardMetric,
  type MediaRecord,
  type OfficialImport,
  type Poi,
  type TrendPoint,
  type UgcItem,
} from "@/mocks/admin"

export const ADMIN_PROFILE_KEY = "timecampus_admin"
export const ADMIN_TOKEN_KEY = "TimeCampus-Admin-Token"

type AdminLoginResponse = {
  token: string
  adminId: number
  adminName: string
  role?: AdminPermission
}

type BackendAdminAccount = {
  id: number
  adminName: string
  role: AdminPermission
  status: number
  createTime?: string
}

type BackendPoi = {
  id: number
  name: string
  latitude: number
  longitude: number
  description?: string
  funFact?: string
  status: number
  createTime?: string
  updateTime?: string
}

type BackendMedia = {
  id: number
  poiId: number
  type: string
  imagePath?: string
  previewUrl?: string
  thumbnailUrl?: string
  year: number
  description?: string
  uploadUserId?: number
  reviewStatus: string
  rejectReason?: string
  reviewTime?: string
  reviewerId?: number
  createTime?: string
  updateTime?: string
}

type BackendComment = {
  id: number
  userId?: number
  nickname?: string
  targetType?: string
  targetId?: number
  content: string
  reviewStatus: string
  rejectReason?: string
  createTime?: string
  updateTime?: string
}

type BackendLog = {
  id: number
  operatorType?: string
  operatorId?: number
  type: string
  action: string
  targetType?: string
  targetId?: number
  detail?: string | null
  createTime?: string
}

type BackendMapOverview = {
  pois?: AdminMapPoi[]
  recentFavorites?: AdminMapFavorite[]
  recentComments?: AdminMapComment[]
}

type BackendDashboardStats = {
  metrics?: Array<{
    label: string
    value: string
    detail: string
    trend: string
  }>
  trends?: TrendPoint[]
  reviewDistribution?: DashboardDistribution[]
  mediaTypeDistribution?: DashboardDistribution[]
}

export type AdminMapMedia = {
  id: number
  poiId: number
  type?: string
  imagePath?: string
  previewUrl?: string
  thumbnailUrl?: string
  year?: number
  description?: string
  uploadUserId?: number
  reviewStatus?: string
  createTime?: string
}

export type AdminMapFavorite = {
  id: number
  userId?: number
  nickname?: string
  targetType?: string
  targetId?: number
  relatedPoiId?: number
  targetName?: string
  createTime?: string
}

export type AdminMapComment = {
  id: number
  userId?: number
  nickname?: string
  targetType?: string
  targetId?: number
  relatedPoiId?: number
  targetName?: string
  content?: string
  reviewStatus?: string
  rejectReason?: string
  createTime?: string
}

export type AdminMapPoi = BackendPoi & {
  favoriteCount?: number
  commentCount?: number
  pendingCommentCount?: number
  mediaCount?: number
  ugcCount?: number
  favorites?: AdminMapFavorite[]
  comments?: AdminMapComment[]
  mediaList?: AdminMapMedia[]
}

export type AdminMapOverview = {
  pois: AdminMapPoi[]
  recentFavorites: AdminMapFavorite[]
  recentComments: AdminMapComment[]
}

export type MapToolLocation = {
  lat: number
  lng: number
}

export type MapToolPoi = {
  id?: string
  title?: string
  address?: string
  category?: string
  tel?: string
  location?: MapToolLocation
  ad_info?: {
    province?: string
    city?: string
    district?: string
    adcode?: string | number
  }
  _distance?: number
  _dir_desc?: string
}

export type MapReverseGeocodeResult = {
  status?: number
  message?: string
  result?: {
    address?: string
    location?: MapToolLocation
    poi_count?: number
    pois?: MapToolPoi[]
    address_component?: {
      nation?: string
      province?: string
      city?: string
      district?: string
      street?: string
      street_number?: string
    }
    formatted_addresses?: {
      recommend?: string
      rough?: string
      standard_address?: string
    }
  }
  coordinateSystem?: string
  requestLocation?: MapToolLocation
}

export type MapPoiSearchResult = {
  status?: number
  message?: string
  count?: number
  data?: MapToolPoi[]
  region?: {
    title?: string
  }
}

export type AdminSnapshot = {
  profile: AdminProfile
  metrics: DashboardMetric[]
  trends: TrendPoint[]
  reviewDistribution: DashboardDistribution[]
  mediaTypeDistribution: DashboardDistribution[]
  pois: Poi[]
  imports: OfficialImport[]
  media: MediaRecord[]
  ugc: UgcItem[]
  comments: CommentItem[]
  logs: AuditLog[]
  mapOverview: AdminMapOverview
}

export type AdminLoginInput = {
  adminName: string
  password: string
  capToken?: string
}

export type AdminRegisterInput = AdminLoginInput

export type PoiPayload = {
  name: string
  latitude: number
  longitude: number
  description?: string
  funFact?: string
  status?: 0 | 1
}

export type OfficialImportPayload = {
  items: Array<{
    poiId: number
    imagePath: string
    year: number
    description?: string
    reviewStatus?: "pending" | "approved" | "rejected"
  }>
}

export type OfficialUploadPayload = {
  file: File
  poiId: number
  year: number
  description?: string
}

export type AgentRagHit = {
  score: number
  reason: string
  document: {
    id: string
    type: string
    title: string
    text: string
    uri: string
    metadata?: Record<string, unknown>
  }
}

export type AgentRagSearchResult = {
  query: string
  usage: string
  corpusSize: number
  hits: AgentRagHit[]
}

export type AgentRagContextPack = {
  task: string
  workflow: string[]
  retrieval: AgentRagSearchResult
}

export type AgentRagContextPackPayload = {
  task: string
  limit?: number
  types?: string[]
  poiId?: number
  includePending?: boolean
}

function normalizeReviewStatus(status?: string) {
  switch (status?.toLowerCase()) {
    case "approved":
      return "APPROVED"
    case "rejected":
      return "REJECTED"
    default:
      return "PENDING"
  }
}

function toProfile(data: AdminLoginResponse): AdminProfile {
  const role = (data.role || "none").toUpperCase() as AdminProfile["role"]

  return {
    id: String(data.adminId),
    name: data.adminName,
    role,
    email: `${data.adminName}@timecampus.local`,
  }
}

function toAdminAccount(item: BackendAdminAccount): AdminAccount {
  return {
    id: String(item.id),
    adminName: item.adminName,
    role: item.role,
    status: item.status === 1 ? "ENABLED" : "DISABLED",
    createTime: item.createTime || "-",
  }
}

function toBackendStatus(status: AdminAccount["status"]) {
  return status === "ENABLED"
}

function toDashboardStats(data: BackendDashboardStats) {
  return {
    metrics: (data.metrics ?? dashboardMetrics).map((metric, index) => ({
      ...metric,
      icon: dashboardMetrics[index]?.icon ?? dashboardMetrics[0].icon,
    })),
    trends: data.trends ?? trendData,
    reviewDistribution: data.reviewDistribution ?? [],
    mediaTypeDistribution: data.mediaTypeDistribution ?? [],
  }
}

function toPoi(item: BackendPoi, overview?: BackendMapOverview): Poi {
  const overviewPoi = overview?.pois?.find((poi) => poi.id === item.id)
  const mediaCount = overviewPoi?.mediaCount ?? 0
  const ugcCount = overviewPoi?.ugcCount ?? 0
  const commentCount = overviewPoi?.commentCount ?? 0
  const favoriteCount = overviewPoi?.favoriteCount ?? 0

  return {
    id: String(item.id),
    name: item.name,
    region: item.description || "未分区",
    latitude: Number(item.latitude),
    longitude: Number(item.longitude),
    status: item.status === 1 ? "ACTIVE" : "INACTIVE",
    coverage: Math.min(100, Math.max(10, mediaCount * 15 + ugcCount * 8)),
    heat: favoriteCount * 12 + commentCount * 8 + mediaCount * 20,
    updatedAt: item.updateTime || item.createTime || "-",
  }
}

function toUgc(item: BackendMedia, poiList: Poi[]): UgcItem {
  const poi = poiList.find((candidate) => candidate.id === String(item.poiId))
  const reviewStatus = normalizeReviewStatus(item.reviewStatus)

  return {
    id: String(item.id),
    poiName: poi?.name || `POI ${item.poiId}`,
    uploader: item.uploadUserId ? `用户 ${item.uploadUserId}` : "未知用户",
    year: item.year,
    description: item.description || item.imagePath || "未填写描述",
    source: item.previewUrl || item.imagePath,
    reviewStatus,
    publishStatus: reviewStatus === "APPROVED" ? "VISIBLE" : "HIDDEN",
    createdAt: item.createTime || item.updateTime || "-",
  }
}

function toMediaRecord(item: BackendMedia, poiList: Poi[]): MediaRecord {
  const poi = poiList.find((candidate) => candidate.id === String(item.poiId))
  const reviewStatus = normalizeReviewStatus(item.reviewStatus)

  return {
    id: String(item.id),
    poiId: String(item.poiId),
    poiName: poi?.name || `POI ${item.poiId}`,
    type: item.type?.toUpperCase() || "UNKNOWN",
    imagePath: item.imagePath,
    previewUrl: item.previewUrl,
    thumbnailUrl: item.thumbnailUrl,
    year: item.year,
    description: item.description || item.imagePath || "未填写描述",
    uploader: item.uploadUserId ? `用户 ${item.uploadUserId}` : undefined,
    reviewStatus,
    publishStatus: reviewStatus === "APPROVED" ? "VISIBLE" : "HIDDEN",
    rejectReason: item.rejectReason,
    reviewTime: item.reviewTime,
    reviewer: item.reviewerId ? `管理员 ${item.reviewerId}` : undefined,
    createdAt: item.createTime || item.updateTime || "-",
    updatedAt: item.updateTime || item.createTime || "-",
  }
}

function toComment(item: BackendComment, poiList: Poi[]): CommentItem {
  const poi = poiList.find(
    (candidate) => candidate.id === String(item.targetId)
  )

  return {
    id: String(item.id),
    poiName:
      poi?.name || `${item.targetType || "target"} ${item.targetId || ""}`,
    userName:
      item.nickname || (item.userId ? `用户 ${item.userId}` : "匿名用户"),
    comment: item.content,
    reviewStatus: normalizeReviewStatus(item.reviewStatus),
    createdAt: item.createTime || item.updateTime || "-",
  }
}

function toLog(item: BackendLog): AuditLog {
  return {
    id: String(item.id),
    type: item.type,
    action: item.detail ? `${item.action}：${item.detail}` : item.action,
    operator: `${item.operatorType || "ADMIN"} ${item.operatorId || ""}`.trim(),
    target: `${item.targetType || "target"} ${item.targetId || ""}`.trim(),
    createdAt: item.createTime || "-",
  }
}

export async function loginAdmin(input: AdminLoginInput) {
  if (!input.adminName || !input.password) {
    throw new Error("请输入管理员账号和密码")
  }

  const data = await apiRequest<AdminLoginResponse>("/admin/login", {
    method: "POST",
    body: input,
    auth: false,
  })
  const profile = toProfile(data)

  localStorage.setItem(ADMIN_TOKEN_KEY, data.token)
  localStorage.setItem(ADMIN_PROFILE_KEY, JSON.stringify(profile))

  return {
    token: data.token,
    profile,
  }
}

export async function registerAdmin(input: AdminRegisterInput) {
  if (!input.adminName || !input.password) {
    throw new Error("请输入管理员账号和密码")
  }
  if (!input.capToken) {
    throw new Error("请先完成人机验证")
  }

  const data = await apiRequest<AdminLoginResponse>("/admin/register", {
    method: "POST",
    body: input,
    auth: false,
  })
  const profile = toProfile(data)

  localStorage.setItem(ADMIN_TOKEN_KEY, data.token)
  localStorage.setItem(ADMIN_PROFILE_KEY, JSON.stringify(profile))

  return {
    token: data.token,
    profile,
  }
}

export async function logoutAdmin() {
  await apiRequest<string>("/admin/logout", { method: "POST" }).catch(
    () => "ok"
  )
  localStorage.removeItem(ADMIN_TOKEN_KEY)
  localStorage.removeItem(ADMIN_PROFILE_KEY)
}

export function getStoredAdminProfile() {
  const token = localStorage.getItem(ADMIN_TOKEN_KEY)
  const profile = localStorage.getItem(ADMIN_PROFILE_KEY)

  if (!token || !profile) {
    return null
  }

  try {
    return JSON.parse(profile) as AdminProfile
  } catch {
    localStorage.removeItem(ADMIN_PROFILE_KEY)
    return null
  }
}

export async function getAdminSnapshot(): Promise<AdminSnapshot> {
  const storedProfile = getStoredAdminProfile()
  const [stats, overview, backendPois, media, ugc, comments, logs] =
    await Promise.all([
      getAdminDashboardStats(),
      getAdminMapOverview(),
      apiRequest<BackendPoi[]>("/admin/pois"),
      apiRequest<BackendMedia[]>("/admin/media"),
      apiRequest<BackendMedia[]>("/admin/ugc", {
        query: { status: "pending" },
      }),
      apiRequest<BackendComment[]>("/admin/comments", {
        query: { status: "pending" },
      }),
      apiRequest<BackendLog[]>("/admin/logs", { query: { limit: 20 } }),
    ])

  const adaptedPois = backendPois.map((poi) => toPoi(poi, overview))
  const adaptedMedia = media.map((item) => toMediaRecord(item, adaptedPois))
  const adaptedUgc = ugc.map((item) => toUgc(item, adaptedPois))
  const adaptedComments = comments.map((item) => toComment(item, adaptedPois))
  const adaptedLogs = logs.map(toLog)
  const officialMedia = media.filter(
    (item) => item.type?.toLowerCase() === "official"
  )
  const adaptedImports: OfficialImport[] = officialMedia
    ? [
        {
          id: "official-media",
          fileName: "后端影像",
          type: "OFFICIAL",
          total: officialMedia.length,
          success: officialMedia.filter(
            (item) => normalizeReviewStatus(item.reviewStatus) === "APPROVED"
          ).length,
          reviewStatus: "APPROVED",
          publishStatus: "VISIBLE",
          operator: storedProfile?.name || "admin",
          createdAt:
            officialMedia
              .flatMap((item) => {
                const t = item.createTime || item.updateTime
                return t ? [t] : []
              })
              .sort()
              .at(-1) || "-",
        },
      ]
    : []

  return {
    profile: storedProfile ?? {
      id: "0",
      name: "?",
      role: "NONE",
      email: "?",
    },
    metrics: stats.metrics,
    trends: stats.trends,
    reviewDistribution: stats.reviewDistribution,
    mediaTypeDistribution: stats.mediaTypeDistribution,
    pois: adaptedPois,
    imports: adaptedImports,
    media: adaptedMedia,
    ugc: adaptedUgc,
    comments: adaptedComments,
    logs: adaptedLogs,
    mapOverview: overview,
  }
}

export function getEmptyAdminSnapshot(profile: AdminProfile): AdminSnapshot {
  return {
    profile,
    metrics: dashboardMetrics,
    trends: trendData,
    reviewDistribution: [],
    mediaTypeDistribution: [],
    pois: [],
    imports: [],
    media: [],
    ugc: [],
    comments: [],
    logs: [],
    mapOverview: {
      pois: [],
      recentFavorites: [],
      recentComments: [],
    },
  }
}

export async function getAdminDashboardStats() {
  return toDashboardStats(
    await apiRequest<BackendDashboardStats>("/admin/dashboard/stats")
  )
}

export async function getAdminAccounts() {
  return apiRequest<BackendAdminAccount[]>("/admin/accounts").then((items) =>
    items.map(toAdminAccount)
  )
}

export async function updateAdminRole(id: string, role: AdminPermission) {
  return toAdminAccount(
    await apiRequest<BackendAdminAccount>(`/admin/accounts/${id}/role`, {
      method: "POST",
      body: { role },
    })
  )
}

export async function updateAdminStatus(
  id: string,
  status: AdminAccount["status"]
) {
  return toAdminAccount(
    await apiRequest<BackendAdminAccount>(`/admin/accounts/${id}/status`, {
      method: "POST",
      body: { enabled: toBackendStatus(status) },
    })
  )
}

export async function getAdminMapConfig() {
  const config = await apiRequest<{ key?: string; tencentMapKey?: string }>(
    "/admin/map/config"
  )

  return {
    tencentMapKey:
      config.tencentMapKey ||
      config.key ||
      import.meta.env.VITE_TENCENT_MAP_KEY ||
      "",
  }
}

export async function getAdminMapOverview(query?: {
  keyword?: string
  status?: number
  commentStatus?: string
  limit?: number
}): Promise<AdminMapOverview> {
  const data = await apiRequest<BackendMapOverview>("/admin/map/overview", {
    query,
  })

  return {
    pois: data.pois ?? [],
    recentFavorites: data.recentFavorites ?? [],
    recentComments: data.recentComments ?? [],
  }
}

export async function reverseGeocode(lat: number, lng: number) {
  return apiRequest<MapReverseGeocodeResult>("/map/reverse-geocode", {
    auth: false,
    query: { lat, lng },
  })
}

export async function searchMapPois(keyword: string, region?: string) {
  return apiRequest<MapPoiSearchResult>("/map/poi-search", {
    auth: false,
    query: { keyword, region },
  })
}

export async function createPoi(payload: PoiPayload) {
  return toPoi(
    await apiRequest<BackendPoi>("/admin/pois", {
      method: "POST",
      body: payload,
    })
  )
}

export async function updatePoi(id: string, payload: Partial<PoiPayload>) {
  return toPoi(
    await apiRequest<BackendPoi>(`/admin/pois/${id}`, {
      method: "PUT",
      body: payload,
    })
  )
}

export async function deletePoi(id: string) {
  await apiRequest<string>(`/admin/pois/${id}`, { method: "DELETE" })
}

export async function approveUgc(id: string) {
  await apiRequest<BackendMedia>(`/admin/ugc/${id}/approve`, { method: "POST" })
}

export async function rejectUgc(id: string, reason: string) {
  await apiRequest<BackendMedia>(`/admin/ugc/${id}/reject`, {
    method: "POST",
    body: { key: reason, rejectReason: reason },
  })
}

export async function approveComment(id: string) {
  await apiRequest<BackendComment>(`/admin/comments/${id}/approve`, {
    method: "POST",
  })
}

export async function rejectComment(id: string, reason: string) {
  await apiRequest<BackendComment>(`/admin/comments/${id}/reject`, {
    method: "POST",
    body: { key: reason, rejectReason: reason },
  })
}

export async function importOfficialContent(payload: OfficialImportPayload) {
  return apiRequest<{
    total: number
    successCount: number
    failCount: number
    failures: Array<{ index: number; reason: string }>
  }>("/admin/contents/batch-import", {
    method: "POST",
    body: payload,
  })
}

export async function uploadOfficialContent(payload: OfficialUploadPayload) {
  const body = new FormData()
  body.set("file", payload.file)

  return apiRequest<BackendMedia>("/admin/media/upload", {
    method: "POST",
    query: {
      poiId: payload.poiId,
      year: payload.year,
      description: payload.description,
    },
    body,
  })
}

export async function getAgentRagContextPack(
  payload: AgentRagContextPackPayload
) {
  return apiRequest<AgentRagContextPack>("/admin/agent/rag/context-pack", {
    method: "POST",
    body: payload,
  })
}
