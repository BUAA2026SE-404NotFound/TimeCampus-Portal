import { Skeleton } from "@/components/ui/skeleton"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { AccountsPage } from "@/pages/admin/accounts-page"
import { DashboardPage } from "@/pages/admin/dashboard-page"
import { ImportsPage } from "@/pages/admin/imports-page"
import { LogsPage } from "@/pages/admin/logs-page"
import { MapToolsPage } from "@/pages/admin/map-tools-page"
import { OpsMapPage } from "@/pages/admin/ops-map-page"
import { PoiPage } from "@/pages/admin/poi-page"
import { CommentReviewPage, UgcReviewPage } from "@/pages/admin/review-pages"
import type { PageId } from "@/components/admin/types"
import type { AdminSnapshot } from "@/api/admin"

export function MainContent({
  activePage,
  snapshot,
  onChanged,
}: {
  activePage: PageId
  snapshot: AdminSnapshot | null
  onChanged: () => void
}) {
  if (!snapshot) {
    return (
      <div className="grid flex-1 gap-4 p-4 sm:p-6">
        <Skeleton className="h-28 rounded-none" />
        <Skeleton className="h-80 rounded-none" />
      </div>
    )
  }

  if (snapshot.profile.role === "NONE") {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4 font-mono sm:p-6">
        <Card className="rounded-none shadow-none">
          <CardHeader>
            <CardTitle>暂无可访问内容</CardTitle>
            <CardDescription>
              当前管理员账号未分配 read 或 admin
              权限，页面保持空态且不会加载地图或影像资源。
            </CardDescription>
          </CardHeader>
          <CardContent className="grid min-h-[320px] place-items-center border-t text-muted-foreground">
            ?
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 font-mono sm:p-6">
      {activePage === "dashboard" && <DashboardPage snapshot={snapshot} />}
      {activePage === "pois" && (
        <PoiPage pois={snapshot.pois} onChanged={onChanged} />
      )}
      {activePage === "imports" && (
        <ImportsPage snapshot={snapshot} onChanged={onChanged} />
      )}
      {activePage === "ugc" && (
        <UgcReviewPage items={snapshot.ugc} onChanged={onChanged} />
      )}
      {activePage === "comments" && (
        <CommentReviewPage items={snapshot.comments} onChanged={onChanged} />
      )}
      {activePage === "map-tools" && <MapToolsPage />}
      {activePage === "ops-map" && <OpsMapPage snapshot={snapshot} />}
      {activePage === "logs" && <LogsPage snapshot={snapshot} />}
      {activePage === "accounts" && <AccountsPage />}
    </div>
  )
}
