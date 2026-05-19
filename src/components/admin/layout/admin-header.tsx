import { Clock3, MoreHorizontal } from "lucide-react"
import { toast } from "sonner"

import { pageTitles, type PageId } from "@/components/admin/types"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Skeleton } from "@/components/ui/skeleton"
import type { AdminSnapshot } from "@/api/admin"

export function AdminHeader({
  activePage,
  snapshot,
  onBack,
  onRefresh,
}: {
  activePage: PageId
  snapshot: AdminSnapshot | null
  onBack?: () => void
  onRefresh: () => void
}) {
  const page = pageTitles[activePage]

  return (
    <header className="sticky top-0 border-b bg-background/95 px-4 py-3 font-mono backdrop-blur sm:px-6">
      <div className="flex items-center gap-3">
        <SidebarTrigger />
        <div className="min-w-0">
          <h1 className="truncate text-xl font-semibold">{page.title}</h1>
          <p className="truncate text-sm text-muted-foreground">
            {page.description}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {onBack && (
            <Button
              type="button"
              variant="outline"
              className="hidden rounded-none font-mono sm:inline-flex"
              onClick={onBack}
            >
              返回门户
            </Button>
          )}
          <div className="hidden items-center gap-2 text-sm text-muted-foreground lg:flex">
            <Clock3 />
            后端 /api/v1
          </div>
          <ThemeToggle />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="rounded-none">
                <MoreHorizontal />
                <span className="sr-only">打开更多操作</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-none font-mono">
              <DropdownMenuGroup>
                <DropdownMenuItem onSelect={onRefresh}>
                  刷新数据
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => toast.info("API 适配层位于 src/api")}
                >
                  查看 API 适配层
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      {!snapshot && (
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          <Skeleton className="h-2 rounded-none" />
          <Skeleton className="h-2 rounded-none" />
          <Skeleton className="h-2 rounded-none" />
        </div>
      )}
    </header>
  )
}
