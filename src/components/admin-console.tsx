import { useCallback, useEffect, useRef, useState } from "react"
import { toast } from "sonner"

import {
  getEmptyAdminSnapshot,
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import type { AdminProfile } from "@/mocks/admin"

export function AdminConsole({
  activePage,
  onPageChange,
  onBack,
  onRegister,
  onRequireLogin,
}: {
  activePage: PageId
  onPageChange: (page: PageId) => void
  onBack?: () => void
  onRegister?: () => void
  onRequireLogin?: () => void
}) {
  const [profile, setProfile] = useState<AdminProfile | null>(() =>
    getStoredAdminProfile()
  )
  const [snapshot, setSnapshot] = useState<AdminSnapshot | null>(null)
  const [accessMessage, setAccessMessage] = useState("")
  const accessDialogShownRef = useRef(false)

  const showAccessMessageOnce = useCallback((message: string) => {
    if (accessDialogShownRef.current) {
      return
    }

    accessDialogShownRef.current = true
    setAccessMessage(message)
  }, [])

  const refreshSnapshot = useCallback(async () => {
    const currentProfile = getStoredAdminProfile()
    if (!currentProfile) {
      return
    }

    if (currentProfile.role === "NONE") {
      setSnapshot(getEmptyAdminSnapshot(currentProfile))
      showAccessMessageOnce(
        "当前管理员账号为 none 权限，只展示空界面；请联系超级管理员分配 read 或 admin 权限。"
      )
      return
    }

    try {
      setSnapshot(await getAdminSnapshot())
    } catch (error) {
      setSnapshot(getEmptyAdminSnapshot(currentProfile))
      showAccessMessageOnce(
        error instanceof Error
          ? `管理端数据加载失败：${error.message}。如果当前账号为 none 权限，这是预期表现；请联系超级管理员分配 read 或 admin 权限。`
          : "管理端数据加载失败。请检查登录状态或管理员权限。"
      )
    }
  }, [showAccessMessageOnce])

  useEffect(() => {
    if (!profile) {
      onRequireLogin?.()
      return
    }

    if (profile.role === "NONE") {
      setSnapshot(getEmptyAdminSnapshot(profile))
      showAccessMessageOnce(
        "当前管理员账号为 none 权限，只展示空界面；请联系超级管理员分配 read 或 admin 权限。"
      )
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
          setSnapshot(getEmptyAdminSnapshot(profile))
          showAccessMessageOnce(
            error instanceof Error
              ? `管理端数据加载失败：${error.message}。如果当前账号为 none 权限，这是预期表现；请联系超级管理员分配 read 或 admin 权限。`
              : "管理端数据加载失败。请检查登录状态或管理员权限。"
          )
        }
      })

    return () => {
      active = false
    }
  }, [profile, onRequireLogin, showAccessMessageOnce])

  async function handleLogout() {
    await logoutAdmin()
    accessDialogShownRef.current = false
    setProfile(null)
    setSnapshot(null)
    toast.success("已退出登录")
    onRequireLogin?.()
  }

  function handleLogin(nextProfile: AdminProfile) {
    accessDialogShownRef.current = false
    setProfile(nextProfile)
    void refreshSnapshot()
  }

  if (!profile) {
    return (
      <LoginScreen
        onLogin={handleLogin}
        onBack={onBack}
        onRegister={onRegister}
      />
    )
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-svh w-full bg-background">
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
      <AlertDialog
        open={Boolean(accessMessage)}
        onOpenChange={(open) => {
          if (!open) setAccessMessage("")
        }}
      >
        <AlertDialogContent className="rounded-none font-mono">
          <AlertDialogHeader>
            <AlertDialogTitle>无法加载管理端数据</AlertDialogTitle>
            <AlertDialogDescription>{accessMessage}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction className="rounded-none font-mono">
              确定
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SidebarProvider>
  )
}
