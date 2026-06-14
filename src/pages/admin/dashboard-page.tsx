import { useMemo, useRef } from "react"
import { gsap } from "gsap"
import { useGSAP } from "@gsap/react"

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
import type { DashboardDistribution, TrendPoint } from "@/types/admin"

gsap.registerPlugin(useGSAP)

const chartColors = [
  "var(--primary)",
  "var(--muted-foreground)",
  "var(--sidebar-ring)",
  "var(--border)",
]

function labelForStatus(label: string) {
  switch (label.toLowerCase()) {
    case "approved":
      return "已通过"
    case "pending":
      return "待审核"
    case "rejected":
      return "已驳回"
    default:
      return label || "?"
  }
}

function labelForMediaType(label: string) {
  switch (label.toLowerCase()) {
    case "official":
      return "官方影像"
    case "ugc":
      return "用户投稿"
    default:
      return label || "?"
  }
}

function trendValue(item: TrendPoint) {
  return item.mediaCount + item.ugcCount + item.commentCount
}

function trendX(index: number, length: number) {
  if (length <= 1) return 50
  return 3 + (index / (length - 1)) * 94
}

function linePoints(items: TrendPoint[], key: keyof TrendPoint, max: number) {
  if (!items.length) return ""
  return items
    .map((item, index) => {
      const x = trendX(index, items.length)
      const value = Number(item[key]) || 0
      const y = 100 - (value / max) * 82 - 8
      return `${x},${y}`
    })
    .join(" ")
}

function DistributionPie({
  items,
  label,
}: {
  items: DashboardDistribution[]
  label: string
}) {
  const total = items.reduce((sum, item) => sum + item.value, 0)
  const segments = items.reduce<
    Array<{ item: DashboardDistribution; index: number; dash: number; offset: number }>
  >((current, item, index) => {
    const previous = current.at(-1)
    const offset = previous ? previous.offset + previous.dash : 0
    const dash = total ? (item.value / total) * 263.89 : 0

    return [...current, { item, index, dash, offset }]
  }, [])

  if (!total) {
    return (
      <div className="grid min-h-72 place-items-center border bg-muted/20 text-sm text-muted-foreground">
        暂无{label}数据
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-[220px_1fr] md:items-center">
      <svg
        viewBox="0 0 120 120"
        role="img"
        aria-label={label}
        className="mx-auto size-56"
      >
        <circle
          cx="60"
          cy="60"
          r="42"
          fill="none"
          stroke="var(--muted)"
          strokeWidth="18"
        />
        {segments.map(({ item, index, dash, offset }) => (
            <circle
              key={item.label}
              className="dashboard-pie-segment"
              cx="60"
              cy="60"
              r="42"
              fill="none"
              stroke={chartColors[index % chartColors.length]}
              strokeWidth="18"
              strokeDasharray={`${dash} ${263.89 - dash}`}
              strokeDashoffset={-offset}
              strokeLinecap="butt"
              transform="rotate(-90 60 60)"
            />
        ))}
        <text
          x="60"
          y="56"
          textAnchor="middle"
          className="fill-foreground text-xl font-semibold"
        >
          {total}
        </text>
        <text
          x="60"
          y="74"
          textAnchor="middle"
          className="fill-muted-foreground text-[10px]"
        >
          total
        </text>
      </svg>
      <div className="grid gap-3">
        {items.map((item, index) => (
          <div key={item.label} className="flex items-center gap-3 text-sm">
            <span
              className="size-3 shrink-0 border"
              style={{
                backgroundColor: chartColors[index % chartColors.length],
              }}
            />
            <span className="min-w-0 flex-1 truncate">
              {labelForStatus(item.label)}
            </span>
            <span className="text-muted-foreground">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function DashboardPage({ snapshot }: { snapshot: AdminSnapshot }) {
  const pageRef = useRef<HTMLDivElement | null>(null)
  const maxTrend = Math.max(...snapshot.trends.map(trendValue), 1)
  const maxLine = Math.max(
    ...snapshot.trends.flatMap((item) => [
      item.mediaCount,
      item.ugcCount,
      item.commentCount,
    ]),
    1
  )
  const totalReview = Math.max(
    snapshot.reviewDistribution.reduce((sum, item) => sum + item.value, 0),
    1
  )
  const sortedPois = useMemo(
    () => [...snapshot.pois].sort((a, b) => b.heat - a.heat),
    [snapshot.pois]
  )

  useGSAP(
    () => {
      const mm = gsap.matchMedia()

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const timeline = gsap.timeline({
          defaults: { duration: 0.55, ease: "power2.out" },
        })

        timeline
          .from("[data-dashboard-card]", { autoAlpha: 0, y: 18, stagger: 0.05 })
          .from(
            ".dashboard-bar",
            {
              scaleY: 0,
              transformOrigin: "bottom center",
              stagger: 0.03,
            },
            "-=0.25"
          )
          .from(
            ".dashboard-line",
            { autoAlpha: 0, y: 8, stagger: 0.08 },
            "-=0.2"
          )
          .from(
            ".dashboard-pie-segment",
            {
              autoAlpha: 0,
              scale: 0.82,
              transformOrigin: "center center",
              stagger: 0.06,
            },
            "-=0.25"
          )
      })

      return () => mm.revert()
    },
    { scope: pageRef, dependencies: [snapshot] }
  )

  return (
    <div ref={pageRef} className="flex flex-col gap-4">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {snapshot.metrics.map((metric) => (
          <Card
            key={metric.label}
            data-dashboard-card
            className="rounded-none shadow-none"
          >
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

      <section className="grid gap-4 xl:grid-cols-[1.35fr_1fr]">
        <Card data-dashboard-card className="rounded-none shadow-none">
          <CardHeader>
            <CardTitle>内容增长柱状图</CardTitle>
            <CardDescription>
              来自 GET /api/v1/admin/dashboard/stats
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex h-72 items-end gap-3 border bg-muted/20 p-4">
              {snapshot.trends.length ? (
                snapshot.trends.map((item) => (
                  <div
                    key={item.date}
                    className="flex flex-1 flex-col items-center gap-2"
                  >
                    <div className="flex h-56 w-full items-end gap-1">
                      <div
                        className="dashboard-bar w-full bg-primary"
                        style={{
                          height: `${(item.mediaCount / maxTrend) * 100}%`,
                        }}
                        title={`新增媒体 ${item.mediaCount}`}
                      />
                      <div
                        className="dashboard-bar w-full bg-muted-foreground"
                        style={{
                          height: `${(item.ugcCount / maxTrend) * 100}%`,
                        }}
                        title={`新增 UGC ${item.ugcCount}`}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {item.date}
                    </span>
                  </div>
                ))
              ) : (
                <div className="grid flex-1 place-items-center text-sm text-muted-foreground">
                  暂无趋势数据
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card data-dashboard-card className="rounded-none shadow-none">
          <CardHeader>
            <CardTitle>审核状态分布</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {snapshot.reviewDistribution.length ? (
              snapshot.reviewDistribution.map((item) => (
                <div key={item.label} className="flex flex-col gap-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>{labelForStatus(item.label)}</span>
                    <span className="text-muted-foreground">{item.value}</span>
                  </div>
                  <Progress
                    value={(item.value / totalReview) * 100}
                    className="h-2 rounded-none"
                  />
                </div>
              ))
            ) : (
              <div className="grid min-h-40 place-items-center border bg-muted/20 text-sm text-muted-foreground">
                暂无审核数据
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.35fr_1fr]">
        <Card data-dashboard-card className="rounded-none shadow-none">
          <CardHeader>
            <CardTitle>内容增长折线图</CardTitle>
            <CardDescription>媒体、UGC 与评论按日聚合。</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border bg-muted/20 p-4">
              {snapshot.trends.length ? (
                <>
                  <svg
                    viewBox="0 0 100 100"
                    className="h-64 w-full overflow-visible"
                    role="img"
                    aria-label="内容增长折线图"
                  >
                    {[8, 29, 50, 71, 92].map((y) => (
                      <line
                        key={y}
                        x1="3"
                        x2="97"
                        y1={y}
                        y2={y}
                        stroke="var(--border)"
                        strokeWidth="0.3"
                        vectorEffect="non-scaling-stroke"
                      />
                    ))}
                    <line
                      x1="3"
                      x2="97"
                      y1="92"
                      y2="92"
                      stroke="var(--border)"
                      strokeWidth="0.45"
                      vectorEffect="non-scaling-stroke"
                    />
                    <polyline
                      className="dashboard-line"
                      points={linePoints(
                        snapshot.trends,
                        "mediaCount",
                        maxLine
                      )}
                      fill="none"
                      stroke="var(--primary)"
                      strokeWidth="1.6"
                      vectorEffect="non-scaling-stroke"
                    />
                    <polyline
                      className="dashboard-line"
                      points={linePoints(snapshot.trends, "ugcCount", maxLine)}
                      fill="none"
                      stroke="var(--muted-foreground)"
                      strokeWidth="1.4"
                      vectorEffect="non-scaling-stroke"
                    />
                    <polyline
                      className="dashboard-line"
                      points={linePoints(
                        snapshot.trends,
                        "commentCount",
                        maxLine
                      )}
                      fill="none"
                      stroke="var(--sidebar-ring)"
                      strokeWidth="1.2"
                      vectorEffect="non-scaling-stroke"
                    />
                    {snapshot.trends.map((item, index) => (
                      <g key={item.date}>
                        <circle
                          cx={trendX(index, snapshot.trends.length)}
                          cy={
                            100 -
                            ((Number(item.mediaCount) || 0) / maxLine) * 82 -
                            8
                          }
                          r="1.1"
                          fill="var(--primary)"
                          vectorEffect="non-scaling-stroke"
                        />
                      </g>
                    ))}
                  </svg>
                  <div
                    className="mt-2 grid gap-2 text-xs text-muted-foreground"
                    style={{
                      gridTemplateColumns: `repeat(${snapshot.trends.length}, minmax(0, 1fr))`,
                    }}
                  >
                    {snapshot.trends.map((item, index) => (
                      <span
                        key={item.date}
                        className={
                          index === 0
                            ? "text-left"
                            : index === snapshot.trends.length - 1
                              ? "text-right"
                              : "text-center"
                        }
                      >
                        {item.date}
                      </span>
                    ))}
                  </div>
                </>
              ) : (
                <div className="grid h-72 place-items-center text-sm text-muted-foreground">
                  暂无趋势数据
                </div>
              )}
              <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
                <span>媒体</span>
                <span>UGC</span>
                <span>评论</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card data-dashboard-card className="rounded-none shadow-none">
          <CardHeader>
            <CardTitle>审核状态饼图</CardTitle>
          </CardHeader>
          <CardContent>
            <DistributionPie
              label="审核状态"
              items={snapshot.reviewDistribution}
            />
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <Card data-dashboard-card className="rounded-none shadow-none">
          <CardHeader>
            <CardTitle>媒体类型分布</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {snapshot.mediaTypeDistribution.length ? (
              snapshot.mediaTypeDistribution.map((item, index) => {
                const total = snapshot.mediaTypeDistribution.reduce(
                  (sum, current) => sum + current.value,
                  0
                )
                return (
                  <div key={item.label} className="grid gap-2">
                    <div className="flex justify-between text-sm">
                      <span>{labelForMediaType(item.label)}</span>
                      <span className="text-muted-foreground">
                        {item.value}
                      </span>
                    </div>
                    <div className="h-3 overflow-hidden border bg-muted">
                      <div
                        className="dashboard-bar h-full"
                        style={{
                          width: `${total ? (item.value / total) * 100 : 0}%`,
                          backgroundColor:
                            chartColors[index % chartColors.length],
                        }}
                      />
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="grid min-h-40 place-items-center border bg-muted/20 text-sm text-muted-foreground">
                暂无媒体数据
              </div>
            )}
          </CardContent>
        </Card>

        <Card data-dashboard-card className="rounded-none shadow-none">
          <CardHeader>
            <CardTitle>POI 热度排行</CardTitle>
          </CardHeader>
          <CardDescription className="px-6">
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
                {sortedPois.length ? (
                  sortedPois.map((poi) => (
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
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={3}
                      className="h-24 text-center text-muted-foreground"
                    >
                      暂无 POI 数据
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card
          data-dashboard-card
          className="rounded-none shadow-none xl:col-span-2"
        >
          <CardHeader>
            <CardTitle>最近审计日志</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            {snapshot.logs.length ? (
              snapshot.logs.slice(0, 4).map((log) => (
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
              ))
            ) : (
              <div className="grid min-h-24 place-items-center border bg-muted/20 text-sm text-muted-foreground md:col-span-2">
                暂无审计日志
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
