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

function getCanonicalPath(pathname: string) {
  return isAdminPath(pathname) ? getAdminPagePath(getPageFromPath(pathname)) : pathname
}

export function App() {
  const [pathname, setPathname] = useState(() =>
    getCanonicalPath(window.location.pathname)
  )

  useEffect(() => {
    const canonicalPath = getCanonicalPath(window.location.pathname)
    if (window.location.pathname !== canonicalPath) {
      window.history.replaceState(null, "", canonicalPath)
    }

    function handlePopState() {
      const nextPath = getCanonicalPath(window.location.pathname)
      if (window.location.pathname !== nextPath) {
        window.history.replaceState(null, "", nextPath)
      }
      setPathname(nextPath)
    }

    window.addEventListener("popstate", handlePopState)
    return () => window.removeEventListener("popstate", handlePopState)
  }, [])

  const navigate = useCallback((path: string) => {
    if (window.location.pathname !== path) {
      window.history.pushState(null, "", path)
    }
    setPathname(path)
  }, [])

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
        onBack={() => navigate("/")}
      />
    )
  }

  return <PortalPage onEnterAdmin={() => navigate("/admin/dashboard")} />
}

export default App
