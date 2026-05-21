import { apiRequest } from "@/api/request"
import {
  auditLogs,
  commentItems,
  dashboardMetrics,
  mediaRecords,
  mockAdminProfile,
  officialImports,
  pois,
  trendData,
  ugcItems,
  type AdminProfile,
  type AuditLog,
  type CommentItem,
  type MediaRecord,
  type OfficialImport,
  type Poi,
  type UgcItem,
} from "@/mocks/admin"

export const ADMIN_PROFILE_KEY = "timecampus_admin"
export const ADMIN_TOKEN_KEY = "TimeCampus-Admin-Token"

type AdminLoginResponse = {
  token: string
  adminId: number
  adminName: string
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

export type AdminMapMedia = {
  id: number
  poiId: number
  type?: string
  imagePath?: string
  previewUrl?: string
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
  metrics: typeof dashboardMetrics
  trends: typeof trendData
  pois: typeof pois
  imports: typeof officialImports
  media: typeof mediaRecords
  ugc: typeof ugcItems
  comments: typeof commentItems
  logs: typeof auditLogs
  mapOverview: AdminMapOverview
}

export type AdminLoginInput = {
  adminName: string
  password: string
}

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
  return {
    id: String(data.adminId),
    name: data.adminName,
    role: "ADMIN",
    email: `${data.adminName}@timecampus.local`,
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

function withMockFallback<T>(request: Promise<T>, fallback: T) {
  return request.catch(() => fallback)
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

export async function logoutAdmin() {
  await withMockFallback(
    apiRequest<string>("/admin/logout", { method: "POST" }),
    "ok"
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
  const [overview, backendPois, media, ugc, comments, logs] = await Promise.all(
    [
      withMockFallback(getAdminMapOverview(), null),
      withMockFallback(apiRequest<BackendPoi[]>("/admin/pois"), null),
      withMockFallback(apiRequest<BackendMedia[]>("/admin/media"), null),
      withMockFallback(
        apiRequest<BackendMedia[]>("/admin/ugc", {
          query: { status: "pending" },
        }),
        null
      ),
      withMockFallback(
        apiRequest<BackendComment[]>("/admin/comments", {
          query: { status: "pending" },
        }),
        null
      ),
      withMockFallback(
        apiRequest<BackendLog[]>("/admin/logs", { query: { limit: 20 } }),
        null
      ),
    ]
  )

  const adaptedPois =
    backendPois?.map((poi) => toPoi(poi, overview ?? undefined)) ?? pois
  const adaptedMedia =
    media?.map((item) => toMediaRecord(item, adaptedPois)) ?? mediaRecords
  const adaptedUgc = ugc?.map((item) => toUgc(item, adaptedPois)) ?? ugcItems
  const adaptedComments =
    comments?.map((item) => toComment(item, adaptedPois)) ?? commentItems
  const adaptedLogs = logs?.map(toLog) ?? auditLogs
  const officialMedia =
    media?.filter((item) => item.type?.toLowerCase() === "official") ?? null
  const adaptedImports: OfficialImport[] = officialMedia
    ? [
        {
          id: "official-media",
          fileName: "后端官方影像",
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
              .map((item) => item.createTime || item.updateTime)
              .filter(Boolean)
              .sort()
              .at(-1) || "-",
        },
      ]
    : officialImports

  return {
    profile: storedProfile || mockAdminProfile,
    metrics: [
      { ...dashboardMetrics[0], value: String(adaptedPois.length) },
      {
        ...dashboardMetrics[1],
        value: String(officialMedia?.length ?? adaptedImports[0]?.total ?? 0),
      },
      { ...dashboardMetrics[2], value: String(adaptedUgc.length) },
      { ...dashboardMetrics[3], value: String(adaptedComments.length) },
    ],
    trends: trendData,
    pois: adaptedPois,
    imports: adaptedImports,
    media: adaptedMedia,
    ugc: adaptedUgc,
    comments: adaptedComments,
    logs: adaptedLogs,
    mapOverview: overview ?? {
      pois: [],
      recentFavorites: [],
      recentComments: [],
    },
  }
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
