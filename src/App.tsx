import { useCallback, useEffect, useMemo, useState } from "react"

import { AdminConsole } from "@/components/admin-console"
import { AdminConsoleCard } from "@/components/admin-console-card"
import {
  getAdminPagePath,
  getPageFromPath,
  type PageId,
} from "@/components/admin/types"
import { ContactUsCard } from "@/components/contact-us-card"
import { MiniProgramCard } from "@/components/mini-program-card"
import { ProjectInfoCard } from "@/components/project-info-card"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"

export function App() {
  const [pathname, setPathname] = useState(() => window.location.pathname)

  useEffect(() => {
    function handlePopState() {
      setPathname(window.location.pathname)
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
  const isAdminRoute = pathname === "/admin" || pathname.startsWith("/admin/")

  useEffect(() => {
    if (!isAdminRoute) {
      return
    }

    const canonicalPath = getAdminPagePath(activePage)
    const normalizedPath = pathname.replace(/\/+$/, "") || "/"

    if (normalizedPath !== canonicalPath) {
      queueMicrotask(() => {
        window.history.replaceState(null, "", canonicalPath)
        setPathname(canonicalPath)
      })
    }
  }, [activePage, isAdminRoute, pathname])

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

  return (
    <div className="flex min-h-svh flex-col bg-[#f2f2f2] text-foreground dark:bg-[#262626]">
      <SiteHeader />
      <main className="flex-1 px-4 py-6 sm:px-6">
        <div className="mx-auto w-full max-w-6xl">
          <section className="grid gap-4 landscape:grid-cols-2">
            <ProjectInfoCard />
            <MiniProgramCard />
            <AdminConsoleCard onEnter={() => navigate("/admin/dashboard")} />
            <ContactUsCard />
          </section>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}

export default App
