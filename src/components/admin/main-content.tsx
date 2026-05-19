import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { DashboardPage } from "@/components/admin/pages/dashboard-page"
import { ImportsPage } from "@/components/admin/pages/imports-page"
import { LogsPage } from "@/components/admin/pages/logs-page"
import { MapToolsPage, OpsMapPage } from "@/components/admin/pages/map-pages"
import { PoiPage } from "@/components/admin/pages/poi-page"
import {
  CommentReviewPage,
  UgcReviewPage,
} from "@/components/admin/pages/review-pages"
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
      <div className="grid gap-4 p-4 sm:p-6">
        <Skeleton className="h-28 rounded-none" />
        <Skeleton className="h-80 rounded-none" />
      </div>
    )
  }

  return (
    <ScrollArea className="flex-1">
      <div className="flex flex-col gap-4 p-4 font-mono sm:p-6">
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

        <Tabs defaultValue="api" className="rounded-none border bg-card p-4">
          <TabsList className="rounded-none">
            <TabsTrigger value="api" className="rounded-none">
              API 边界
            </TabsTrigger>
            <TabsTrigger value="notice" className="rounded-none">
              开发注意
            </TabsTrigger>
          </TabsList>
          <TabsContent value="api" className="text-muted-foreground">
            页面层通过 src/api/admin.ts 访问后端；未完成接口保留 mock 或本地 UI
            状态。
          </TabsContent>
          <TabsContent value="notice" className="text-muted-foreground">
            删除、审核、退出登录等操作会调用真实后端接口，测试时请注意数据状态变化。
          </TabsContent>
        </Tabs>
      </div>
    </ScrollArea>
  )
}
