const API_PREFIX = "/api/v1"
const ADMIN_TOKEN_KEY = "TimeCampus-Admin-Token"

type ApiResponse<T> = {
  code: number
  message: string
  data: T
}

type RequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown
  query?: Record<string, string | number | undefined | null>
  auth?: boolean
}

function buildUrl(path: string, query?: RequestOptions["query"]) {
  const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || "").replace(
    /\/$/,
    ""
  )
  const baseUrl = apiBaseUrl || window.location.origin
  const apiPath = apiBaseUrl ? path : `${API_PREFIX}${path}`
  const url = new URL(apiPath, baseUrl)

  Object.entries(query ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value))
    }
  })

  return apiBaseUrl ? url.toString() : `${url.pathname}${url.search}`
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {}
) {
  const headers = new Headers(options.headers)

  if (!(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json")
  }

  if (options.auth !== false) {
    const token = localStorage.getItem(ADMIN_TOKEN_KEY)
    if (token) {
      headers.set("Authorization", `Bearer ${token}`)
    }
  }

  const response = await fetch(buildUrl(path, options.query), {
    ...options,
    headers,
    body:
      options.body instanceof FormData
        ? options.body
        : options.body === undefined
          ? undefined
          : JSON.stringify(options.body),
  })

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`)
  }

  const payload = (await response.json()) as ApiResponse<T>

  if (payload.code !== 0) {
    throw new Error(payload.message || `API code ${payload.code}`)
  }

  return payload.data
}
