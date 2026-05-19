import { LogOut } from "lucide-react"

import { AdminLogo } from "@/components/admin/shared"
import { navigationGroups, type PageId } from "@/components/admin/types"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar"
import { mergeClassName } from "@/lib/utils"
import type { AdminProfile } from "@/mocks/admin"

export function AdminSidebar({
  activePage,
  onPageChange,
  profile,
  onLogout,
  pendingUgc,
  pendingComments,
}: {
  activePage: PageId
  onPageChange: (page: PageId) => void
  profile: AdminProfile
  onLogout: () => void
  pendingUgc: number
  pendingComments: number
}) {
  const { open } = useSidebar()

  return (
    <Sidebar collapsible="icon" className="font-mono">
      <SidebarHeader>
        <div
          className={mergeClassName("flex items-center gap-3", !open && "justify-center")}
        >
          <AdminLogo />
          {open && (
            <div className="min-w-0">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase">
                TimeCampus
              </p>
              <p className="truncate text-base font-semibold">管理端</p>
            </div>
          )}
        </div>
      </SidebarHeader>
      <SidebarSeparator />
      <SidebarContent>
        {navigationGroups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const badge =
                    item.id === "ugc"
                      ? pendingUgc
                      : item.id === "comments"
                        ? pendingComments
                        : item.badge

                  return (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton
                        asChild
                        isActive={activePage === item.id}
                        tooltip={item.label}
                      >
                        <a
                          href={item.path}
                          onClick={(event) => {
                            event.preventDefault()
                            onPageChange(item.id)
                          }}
                        >
                          <item.icon />
                          {open && (
                            <span className="truncate">{item.label}</span>
                          )}
                        </a>
                      </SidebarMenuButton>
                      {badge ? (
                        <SidebarMenuBadge>{badge}</SidebarMenuBadge>
                      ) : null}
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter>
        <div
          className={mergeClassName("flex items-center gap-3", !open && "justify-center")}
        >
          <Avatar className="size-9 rounded-none">
            <AvatarFallback className="rounded-none">
              {profile.name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          {open && (
            <div className="min-w-0 text-sm">
              <p className="truncate font-medium">{profile.name}</p>
              <p className="truncate text-xs text-muted-foreground">
                {profile.role}
              </p>
            </div>
          )}
        </div>
        {open && (
          <Button
            variant="outline"
            className="w-full rounded-none font-mono"
            onClick={onLogout}
          >
            <LogOut data-icon="inline-start" />
            退出登录
          </Button>
        )}
      </SidebarFooter>
    </Sidebar>
  )
}
