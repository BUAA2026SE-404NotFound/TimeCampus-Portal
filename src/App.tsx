import { useCallback, useEffect, useMemo, useState } from "react"

import { AdminConsole } from "@/components/admin-console"
import {
  getAdminPagePath,
  getPageFromPath,
  type PageId,
} from "@/components/admin/types"
import { PortalPage } from "@/pages/portal-page"

function isAdminPath(pathname: string) {
  return pathname === "/admin" || pathname.startsWith("/admin/")
}

function isAdminHost() {
  return window.location.hostname === "admin.timecampus.asia"
}

function toInternalPath(pathname: string, adminHost: boolean) {
  if (!adminHost) {
    return pathname
  }

  if (isAdminPath(pathname)) {
    return pathname
  }

  const normalized = pathname.replace(/\/+$/, "") || "/"
  return normalized === "/" ? "/admin/dashboard" : `/admin${normalized}`
}

function toBrowserPath(pathname: string, adminHost: boolean) {
  if (!adminHost || !isAdminPath(pathname)) {
    return pathname
  }

  const stripped = pathname.replace(/^\/admin/, "") || "/"
  return stripped.startsWith("/") ? stripped : `/${stripped}`
}

function getCanonicalPath(pathname: string, adminHost: boolean) {
  pathname = toInternalPath(pathname, adminHost)
  return isAdminPath(pathname) ? getAdminPagePath(getPageFromPath(pathname)) : pathname
}

export function App() {
  const adminHost = isAdminHost()
  const [pathname, setPathname] = useState(() =>
    getCanonicalPath(window.location.pathname, adminHost)
  )

  useEffect(() => {
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
  }, [adminHost])

  const navigate = useCallback((path: string) => {
    const browserPath = toBrowserPath(path, adminHost)
    if (window.location.pathname !== browserPath) {
      window.history.pushState(null, "", browserPath)
    }
    setPathname(path)
  }, [adminHost])

  const activePage = useMemo(() => getPageFromPath(pathname), [pathname])
  const isAdminRoute = isAdminPath(pathname)

  function handleAdminPageChange(page: PageId) {
    navigate(getAdminPagePath(page))
  }

  if (isAdminRoute) {
    return (
      <AdminConsole
        activePage={activePage}
        onPageChange={handleAdminPageChange}
        onBack={() => {
          if (adminHost) {
            window.location.href = `${window.location.protocol}//www.timecampus.asia/`
            return
          }
          navigate("/")
        }}
      />
    )
  }

  return <PortalPage onEnterAdmin={() => navigate("/admin/dashboard")} />
}

export default App
