import {
  auditLogs,
  commentItems,
  dashboardMetrics,
  mapSearchResults,
  mockAdminProfile,
  officialImports,
  pois,
  trendData,
  ugcItems,
  type AdminProfile,
} from "@/mocks/admin"

export const ADMIN_PROFILE_KEY = "timecampus_admin"
export const ADMIN_TOKEN_KEY = "TimeCampus-Admin-Token"

export type AdminSnapshot = {
  profile: AdminProfile
  metrics: typeof dashboardMetrics
  trends: typeof trendData
  pois: typeof pois
  imports: typeof officialImports
  ugc: typeof ugcItems
  comments: typeof commentItems
  logs: typeof auditLogs
  mapResults: typeof mapSearchResults
}

export type AdminLoginInput = {
  email: string
  password: string
}

const mockToken = "dev-admin-token"

function isDevelopmentMockEnabled() {
  return import.meta.env.DEV
}

export async function loginAdmin(input: AdminLoginInput) {
  if (!input.email || !input.password) {
    throw new Error("请输入管理员邮箱和密码")
  }

  if (!isDevelopmentMockEnabled()) {
    throw new Error("管理端登录接口尚未接入，请配置 POST /api/admin/login")
  }

  localStorage.setItem(ADMIN_TOKEN_KEY, mockToken)
  localStorage.setItem(ADMIN_PROFILE_KEY, JSON.stringify(mockAdminProfile))

  return {
    token: mockToken,
    profile: mockAdminProfile,
  }
}

export async function logoutAdmin() {
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
  return {
    profile: mockAdminProfile,
    metrics: dashboardMetrics,
    trends: trendData,
    pois,
    imports: officialImports,
    ugc: ugcItems,
    comments: commentItems,
    logs: auditLogs,
    mapResults: mapSearchResults,
  }
}
