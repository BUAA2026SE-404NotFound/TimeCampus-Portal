import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react"

import { AdminConsole } from "@/components/admin-console"
import { LoginScreen } from "@/components/admin/login-screen"
import { RegisterScreen } from "@/components/admin/register-screen"
import {
  getAdminPagePath,
  getPageFromPath,
  type PageId,
} from "@/components/admin/types"
import { MiniProgramDetailPage } from "@/pages/mini-program-detail-page"
import { PortalPage } from "@/pages/portal-page"
import { ProjectInfoDetailPage } from "@/pages/project-info-detail-page"
import { SeedreamStudioPage } from "@/pages/seedream-studio-page"

const CampusMapPage = lazy(() =>
  import("@/pages/campus-map-page").then((module) => ({
    default: module.CampusMapPage,
  }))
)

function isAdminPath(pathname: string) {
  return pathname === "/admin" || pathname.startsWith("/admin/")
}

function isAdminAuthPath(pathname: string) {
  return (
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/admin/login" ||
    pathname === "/admin/register"
  )
}

function getAdminAuthBrowserPath(pathname: string) {
  if (pathname.endsWith("/register")) {
    return "/register"
  }
  return "/login"
}

const adminDomain = import.meta.env.VITE_ADMIN_DOMAIN || "admin.timecampus.asia"
const portalDomain = import.meta.env.VITE_PORTAL_DOMAIN || "www.timecampus.asia"
const adminRedirectDisabledForLocal =
  import.meta.env.VITE_ADMIN_REDIRECT === "false"

function isAdminHost() {
  return window.location.hostname === adminDomain
}

function isLocalPreviewHost() {
  return (
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1" ||
    window.location.hostname === "::1"
  )
}

function portalUrl(pathname = "/") {
  return `${window.location.protocol}//${portalDomain}${pathname}`
}

function adminBrowserPath(pathname: string) {
  const stripped = pathname.replace(/^\/admin/, "") || "/"
  return stripped.startsWith("/") ? stripped : `/${stripped}`
}

function adminUrl(pathname = "/") {
  return `${window.location.protocol}//${adminDomain}${pathname}`
}

function toInternalPath(pathname: string, adminHost: boolean) {
  if (!adminHost) {
    return pathname
  }

  if (isAdminAuthPath(pathname)) {
    return getAdminAuthBrowserPath(pathname)
  }

  if (isAdminPath(pathname)) {
    return pathname
  }

  const normalized = pathname.replace(/\/+$/, "") || "/"
  return normalized === "/" ? "/admin/dashboard" : `/admin${normalized}`
}

function toBrowserPath(pathname: string, adminHost: boolean) {
  if (adminHost && isAdminAuthPath(pathname)) {
    return getAdminAuthBrowserPath(pathname)
  }

  if (!adminHost || !isAdminPath(pathname)) {
    return pathname
  }

  return adminBrowserPath(pathname)
}

function getCanonicalPath(pathname: string, adminHost: boolean) {
  pathname = toInternalPath(pathname, adminHost)
  if (isAdminAuthPath(pathname)) {
    return getAdminAuthBrowserPath(pathname)
  }
  return isAdminPath(pathname)
    ? getAdminPagePath(getPageFromPath(pathname))
    : pathname
}

export function App() {
  const adminHost = isAdminHost()
  const localPreviewHost = isLocalPreviewHost()
  const adminRedirectEnabled =
    !localPreviewHost || !adminRedirectDisabledForLocal
  const canRenderAdminAuthRoutes =
    adminHost || localPreviewHost || !adminRedirectEnabled
  const shouldRedirectAdminPath =
    adminRedirectEnabled &&
    !adminHost &&
    !localPreviewHost &&
    (isAdminPath(window.location.pathname) ||
      isAdminAuthPath(window.location.pathname))
  const [pathname, setPathname] = useState(() =>
    getCanonicalPath(window.location.pathname, adminHost)
  )

  useEffect(() => {
    if (shouldRedirectAdminPath) {
      window.location.replace(
        adminUrl(adminBrowserPath(window.location.pathname))
      )
      return
    }

    const canonicalPath = getCanonicalPath(window.location.pathname, adminHost)
    const browserPath = toBrowserPath(canonicalPath, adminHost)
    if (window.location.pathname !== browserPath) {
      window.history.replaceState(null, "", browserPath)
    }

    function handlePopState() {
      const nextPath = getCanonicalPath(window.location.pathname, adminHost)
      const nextBrowserPath = toBrowserPath(nextPath, adminHost)
      if (window.location.pathname !== nextBrowserPath) {
        window.history.replaceState(null, "", nextBrowserPath)
      }
      setPathname(nextPath)
    }

    window.addEventListener("popstate", handlePopState)
    return () => window.removeEventListener("popstate", handlePopState)
  }, [adminHost, shouldRedirectAdminPath])

  const navigate = useCallback(
    (path: string) => {
      const browserPath = toBrowserPath(path, adminHost)
      if (window.location.pathname !== browserPath) {
        window.history.pushState(null, "", browserPath)
      }
      setPathname(path)
    },
    [adminHost]
  )

  const activePage = useMemo(() => getPageFromPath(pathname), [pathname])
  const isAdminRoute = isAdminPath(pathname)
  const isLoginRoute = pathname === "/login"
  const isRegisterRoute = pathname === "/register"

  if (shouldRedirectAdminPath) {
    return null
  }

  function handleAdminPageChange(page: PageId) {
    navigate(getAdminPagePath(page))
  }

  function handleBackHome() {
    if (adminHost && adminRedirectEnabled) {
      window.location.href = portalUrl("/")
      return
    }
    navigate("/")
  }

  function handleRequireLogin() {
    navigate("/login")
  }

  if (canRenderAdminAuthRoutes && isLoginRoute) {
    return (
      <LoginScreen
        onLogin={() => navigate("/admin/dashboard")}
        onBack={handleBackHome}
        onRegister={() => navigate("/register")}
      />
    )
  }

  if (canRenderAdminAuthRoutes && isRegisterRoute) {
    return (
      <RegisterScreen
        onBack={handleBackHome}
        onLogin={() => navigate("/login")}
      />
    )
  }

  if (isAdminRoute) {
    return (
      <AdminConsole
        activePage={activePage}
        onPageChange={handleAdminPageChange}
        onBack={handleBackHome}
        onRegister={() => navigate("/register")}
        onRequireLogin={handleRequireLogin}
      />
    )
  }

  if (pathname === "/project-info") {
    return <ProjectInfoDetailPage onBack={() => navigate("/")} />
  }

  if (pathname === "/mini-program") {
    return <MiniProgramDetailPage onBack={() => navigate("/")} />
  }

  if (pathname === "/campus-map") {
    return (
      <Suspense
        fallback={
          <div className="grid min-h-svh place-items-center bg-background font-mono text-muted-foreground">
            正在加载校园地图...
          </div>
        }
      >
        <CampusMapPage onBack={() => navigate("/")} />
      </Suspense>
    )
  }

  if (pathname === "/seedream-studio") {
    return <SeedreamStudioPage onBack={() => navigate("/")} />
  }

  return (
    <PortalPage
      onProjectDetail={() => navigate("/project-info")}
      onMiniProgramDetail={() => navigate("/mini-program")}
      onCampusMap={() => navigate("/campus-map")}
      onSeedreamStudio={() => navigate("/seedream-studio")}
      onEnterAdmin={() => {
        if (adminHost || localPreviewHost) {
          navigate("/login")
          return
        }
        window.location.href = adminUrl("/login")
      }}
      onRegisterAdmin={() => {
        if (adminHost || localPreviewHost) {
          navigate("/register")
          return
        }
        window.location.href = adminUrl("/register")
      }}
    />
  )
}

export default App
