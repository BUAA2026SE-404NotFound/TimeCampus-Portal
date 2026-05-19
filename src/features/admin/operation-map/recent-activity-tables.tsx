import type { AdminMapOverview } from "@/api/admin"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  commentContent,
  targetName,
  userName,
} from "@/features/admin/operation-map/map-text"

export function RecentFavoritesTable({
  overview,
}: {
  overview: AdminMapOverview
}) {
  return (
    <Card className="rounded-none shadow-none">
      <CardHeader>
        <CardTitle>最近收藏</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table className="table-fixed">
          <TableHeader>
            <TableRow>
              <TableHead className="w-24">ID</TableHead>
              <TableHead className="w-36">用户</TableHead>
              <TableHead>目标</TableHead>
              <TableHead className="w-44">时间</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {overview.recentFavorites.map((favorite) => (
              <TableRow key={favorite.id}>
                <TableCell className="truncate">{favorite.id}</TableCell>
                <TableCell className="whitespace-normal">
                  <span className="line-clamp-2">{userName(favorite)}</span>
                </TableCell>
                <TableCell className="whitespace-normal">
                  <span className="line-clamp-2">{targetName(favorite)}</span>
                </TableCell>
                <TableCell>{favorite.createTime || "-"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

export function RecentCommentsTable({
  overview,
}: {
  overview: AdminMapOverview
}) {
  return (
    <Card className="rounded-none shadow-none">
      <CardHeader>
        <CardTitle>最近评论</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table className="table-fixed">
          <TableHeader>
            <TableRow>
              <TableHead className="w-24">ID</TableHead>
              <TableHead className="w-36">用户</TableHead>
              <TableHead className="w-24">状态</TableHead>
              <TableHead>内容</TableHead>
              <TableHead className="w-44">时间</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {overview.recentComments.map((comment) => (
              <TableRow key={comment.id}>
                <TableCell className="truncate">{comment.id}</TableCell>
                <TableCell className="whitespace-normal">
                  <span className="line-clamp-2">{userName(comment)}</span>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="rounded-none">
                    {comment.reviewStatus || "-"}
                  </Badge>
                </TableCell>
                <TableCell className="whitespace-normal">
                  <p className="line-clamp-3">{commentContent(comment)}</p>
                </TableCell>
                <TableCell>{comment.createTime || "-"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
