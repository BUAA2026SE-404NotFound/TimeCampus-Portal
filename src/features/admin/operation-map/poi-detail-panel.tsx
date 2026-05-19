import type {
  AdminMapComment,
  AdminMapFavorite,
  AdminMapMedia,
  AdminMapPoi,
} from "@/api/admin"
import { StatusBadge } from "@/components/admin/shared"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  commentContent,
  mediaDescription,
  poiDescription,
  poiName,
  targetName,
  userName,
} from "@/features/admin/operation-map/map-text"

export function PoiDetailPanel({ selectedPoi }: { selectedPoi: AdminMapPoi | null }) {
  if (!selectedPoi) {
    return (
      <Card className="min-h-[560px] rounded-none shadow-none">
        <CardContent className="grid min-h-[520px] place-items-center text-muted-foreground">
          选择一个 POI 查看详情
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="min-h-[560px] rounded-none shadow-none">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="truncate">{poiName(selectedPoi)}</CardTitle>
            <CardDescription className="mt-2">
              {poiDescription(selectedPoi)}
            </CardDescription>
          </div>
          <StatusBadge status={selectedPoi.status === 1 ? "ACTIVE" : "INACTIVE"} />
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" className="flex flex-col gap-4">
          <TabsList className="grid w-full grid-cols-4 rounded-none">
            <TabsTrigger value="overview" className="rounded-none">
              概况
            </TabsTrigger>
            <TabsTrigger value="media" className="rounded-none">
              影像
            </TabsTrigger>
            <TabsTrigger value="favorites" className="rounded-none">
              收藏
            </TabsTrigger>
            <TabsTrigger value="comments" className="rounded-none">
              评论
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-0">
            <OverviewPanel selectedPoi={selectedPoi} />
          </TabsContent>
          <TabsContent value="media" className="mt-0">
            <PanelIntro
              title="影像"
              description={`${selectedPoi.mediaList?.length ?? 0} 条关联影像`}
            />
            <MediaList items={selectedPoi.mediaList} />
          </TabsContent>
          <TabsContent value="favorites" className="mt-0">
            <PanelIntro
              title="收藏用户"
              description={`${selectedPoi.favorites?.length ?? 0} 条最近收藏记录`}
            />
            <FavoriteList items={selectedPoi.favorites} />
          </TabsContent>
          <TabsContent value="comments" className="mt-0">
            <PanelIntro
              title="评论"
              description={`${selectedPoi.comments?.length ?? 0} 条评论记录`}
            />
            <CommentList items={selectedPoi.comments} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

function OverviewPanel({ selectedPoi }: { selectedPoi: AdminMapPoi }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-2">
        {[
          ["收藏", selectedPoi.favoriteCount || 0],
          ["评论", selectedPoi.commentCount || 0],
          ["待审评论", selectedPoi.pendingCommentCount || 0],
          ["影像", selectedPoi.mediaCount || 0],
          ["UGC", selectedPoi.ugcCount || 0],
        ].map(([label, value]) => (
          <div key={label} className="border bg-muted/20 p-3">
            <b className="block text-2xl">{value}</b>
            <span className="mt-1 block text-sm text-muted-foreground">
              {label}
            </span>
          </div>
        ))}
      </div>
      <dl className="grid grid-cols-[64px_1fr] gap-x-3 gap-y-2 text-sm">
        <dt className="text-muted-foreground">POI ID</dt>
        <dd>{selectedPoi.id}</dd>
        <dt className="text-muted-foreground">纬度</dt>
        <dd>{Number(selectedPoi.latitude).toFixed(8)}</dd>
        <dt className="text-muted-foreground">经度</dt>
        <dd>{Number(selectedPoi.longitude).toFixed(8)}</dd>
      </dl>
    </div>
  )
}

function PanelIntro({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div className="mb-3">
      <h3 className="font-medium">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </div>
  )
}

function MediaList({ items }: { items?: AdminMapMedia[] }) {
  if (!items?.length) {
    return <p className="py-8 text-center text-sm text-muted-foreground">暂无影像</p>
  }

  return (
    <div className="grid max-h-96 gap-2 overflow-auto">
      {items.map((media) => (
        <div
          key={media.id}
          className="grid grid-cols-[96px_1fr] items-center gap-3 border p-2"
        >
          {media.previewUrl || media.imagePath ? (
            <img
              className="h-16 w-24 object-cover"
              src={media.previewUrl || media.imagePath}
              alt={mediaDescription(media)}
            />
          ) : (
            <div className="h-16 w-24 bg-muted" />
          )}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <b>{media.year || "-"}</b>
              <Badge variant="outline" className="rounded-none">
                {media.type || "-"}
              </Badge>
            </div>
            <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
              {mediaDescription(media)}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}

function FavoriteList({ items }: { items?: AdminMapFavorite[] }) {
  if (!items?.length) {
    return <p className="py-8 text-center text-sm text-muted-foreground">暂无收藏</p>
  }

  return (
    <div className="grid max-h-96 gap-2 overflow-auto">
      {items.map((favorite) => (
        <div key={favorite.id} className="border bg-muted/20 p-3">
          <b className="block truncate">{userName(favorite)}</b>
          <span className="mt-1 block truncate text-sm text-muted-foreground">
            {targetName(favorite)}
          </span>
          <span className="mt-2 block text-xs text-muted-foreground">
            {favorite.createTime || "-"}
          </span>
        </div>
      ))}
    </div>
  )
}

function CommentList({ items }: { items?: AdminMapComment[] }) {
  if (!items?.length) {
    return <p className="py-8 text-center text-sm text-muted-foreground">暂无评论</p>
  }

  return (
    <div className="grid max-h-96 gap-2 overflow-auto">
      {items.map((comment) => (
        <div key={comment.id} className="border bg-muted/20 p-3">
          <div className="flex items-start justify-between gap-2">
            <b className="min-w-0 truncate">{userName(comment)}</b>
            <Badge variant="outline" className="rounded-none">
              {comment.reviewStatus || "-"}
            </Badge>
          </div>
          <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">
            {commentContent(comment)}
          </p>
          <span className="mt-2 block text-xs text-muted-foreground">
            {comment.createTime || "-"}
          </span>
        </div>
      ))}
    </div>
  )
}
