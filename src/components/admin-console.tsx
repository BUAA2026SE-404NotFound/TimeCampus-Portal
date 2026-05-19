import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"

import {
  getAdminSnapshot,
  getStoredAdminProfile,
  logoutAdmin,
  type AdminSnapshot,
} from "@/api/admin"
import { AdminHeader } from "@/components/admin/layout/admin-header"
import { AdminSidebar } from "@/components/admin/layout/admin-sidebar"
import { LoginScreen } from "@/components/admin/login-screen"
import { MainContent } from "@/components/admin/main-content"
import { AdminFooter } from "@/components/admin/shared"
import type { PageId } from "@/components/admin/types"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import type { AdminProfile } from "@/mocks/admin"

export function AdminConsole({
  activePage,
  onPageChange,
  onBack,
}: {
  activePage: PageId
  onPageChange: (page: PageId) => void
  onBack?: () => void
}) {
  const [profile, setProfile] = useState<AdminProfile | null>(() =>
    getStoredAdminProfile()
  )
  const [snapshot, setSnapshot] = useState<AdminSnapshot | null>(null)

  const refreshSnapshot = useCallback(async () => {
    if (!getStoredAdminProfile()) {
      return
    }

    try {
      setSnapshot(await getAdminSnapshot())
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "加载管理端数据失败")
    }
  }, [])

  useEffect(() => {
    if (!profile) {
      return
    }

    let active = true

    getAdminSnapshot()
      .then((nextSnapshot) => {
        if (active) {
          setSnapshot(nextSnapshot)
        }
      })
      .catch((error) => {
        if (active) {
          toast.error(
            error instanceof Error ? error.message : "加载管理端数据失败"
          )
        }
      })

    return () => {
      active = false
    }
  }, [profile])

  async function handleLogout() {
    await logoutAdmin()
    setProfile(null)
    setSnapshot(null)
    toast.success("已退出登录")
  }

  function handleLogin(nextProfile: AdminProfile) {
    setProfile(nextProfile)
    void refreshSnapshot()
  }

  if (!profile) {
    return <LoginScreen onLogin={handleLogin} onBack={onBack} />
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-svh w-full bg-[#f2f2f2] dark:bg-[#262626]">
        <AdminSidebar
          activePage={activePage}
          onPageChange={onPageChange}
          profile={profile}
          onLogout={handleLogout}
          pendingUgc={snapshot?.ugc.length ?? 0}
          pendingComments={snapshot?.comments.length ?? 0}
        />
        <SidebarInset>
          <AdminHeader
            activePage={activePage}
            snapshot={snapshot}
            onBack={onBack}
            onRefresh={() => {
              void refreshSnapshot()
              toast.info("已刷新数据")
            }}
          />
          <MainContent
            activePage={activePage}
            snapshot={snapshot}
            onChanged={refreshSnapshot}
          />
          <AdminFooter />
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
