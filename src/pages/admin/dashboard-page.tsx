import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { AdminSnapshot } from "@/api/admin"

export function DashboardPage({ snapshot }: { snapshot: AdminSnapshot }) {
  const maxVisits = Math.max(...snapshot.trends.map((item) => item.visits), 1)
  const totalReview = Math.max(
    snapshot.ugc.length + snapshot.comments.length + snapshot.pois.length,
    1
  )

  return (
    <div className="flex flex-col gap-4">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {snapshot.metrics.map((metric) => (
          <Card key={metric.label} className="rounded-none shadow-none">
            <CardHeader>
              <CardDescription>{metric.label}</CardDescription>
              <CardTitle className="text-3xl">{metric.value}</CardTitle>
              <CardAction>
                <metric.icon />
              </CardAction>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              {metric.detail}
            </CardContent>
            <CardFooter className="border-t bg-muted/30 text-sm">
              {metric.trend}
            </CardFooter>
          </Card>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
        <Card className="rounded-none shadow-none">
          <CardHeader>
            <CardTitle>访问 / 投稿趋势</CardTitle>
            <CardDescription>
              后端接口尚未完成开发，暂时使用 mock 假数据
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex h-72 items-end gap-3 border bg-muted/20 p-4">
              {snapshot.trends.map((item) => (
                <div
                  key={item.date}
                  className="flex flex-1 flex-col items-center gap-2"
                >
                  <div className="flex h-56 w-full items-end gap-1">
                    <div
                      className="w-full bg-primary"
                      style={{ height: `${(item.visits / maxVisits) * 100}%` }}
                      title={`访问 ${item.visits}`}
                    />
                    <div
                      className="w-full bg-muted-foreground"
                      style={{ height: `${(item.submissions / 50) * 100}%` }}
                      title={`投稿 ${item.submissions}`}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {item.date}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-none shadow-none">
          <CardHeader>
            <CardTitle>审核状态分布</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {[
              { label: "UGC 待处理", value: snapshot.ugc.length },
              { label: "评论待处理", value: snapshot.comments.length },
              { label: "POI 总量", value: snapshot.pois.length },
            ].map((item) => (
              <div key={item.label} className="flex flex-col gap-2">
                <div className="flex items-center justify-between text-sm">
                  <span>{item.label}</span>
                  <span className="text-muted-foreground">{item.value}</span>
                </div>
                <Progress
                  value={(item.value / totalReview) * 100}
                  className="h-2 rounded-none"
                />
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <Card className="rounded-none shadow-none">
          <CardHeader>
            <CardTitle>POI 热度排行</CardTitle>
          </CardHeader>
          <CardDescription>
            heat = favoriteCount * 12 + commentCount * 8 + mediaCount * 20
          </CardDescription>
          <CardContent>
            <Table className="table-fixed">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-44">POI</TableHead>
                  <TableHead>校区/简介</TableHead>
                  <TableHead className="w-24 text-right">互动热度</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...snapshot.pois]
                  .sort((a, b) => b.heat - a.heat)
                  .map((poi) => (
                    <TableRow key={poi.id}>
                      <TableCell className="whitespace-normal">
                        <span className="line-clamp-2 font-medium">
                          {poi.name}
                        </span>
                      </TableCell>
                      <TableCell className="whitespace-normal">
                        <span className="line-clamp-2">{poi.region}</span>
                      </TableCell>
                      <TableCell className="text-right">{poi.heat}</TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="rounded-none shadow-none">
          <CardHeader>
            <CardTitle>最近审计日志</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {snapshot.logs.slice(0, 4).map((log) => (
              <div key={log.id} className="border p-3">
                <div className="flex items-center justify-between gap-3">
                  <Badge variant="outline" className="rounded-none">
                    {log.type}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {log.createdAt}
                  </span>
                </div>
                <p className="mt-2 line-clamp-3 text-sm">{log.action}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
