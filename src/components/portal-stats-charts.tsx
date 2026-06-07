import { useEffect, useMemo, useRef, useState } from "react"
import { gsap } from "gsap"
import { useGSAP } from "@gsap/react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getPublicMapHome, type PublicMapPoi } from "@/api/public-map"
import { campusHistoryItems } from "@/data/campus-history"

gsap.registerPlugin(useGSAP)

const chartColors = [
  "var(--primary)",
  "var(--sidebar-ring)",
  "var(--muted-foreground)",
  "var(--foreground)",
  "var(--border)",
  "var(--sidebar-primary)",
]

const chart = {
  width: 640,
  height: 300,
  left: 48,
  right: 20,
  top: 24,
  bottom: 44,
}

type PieItem = {
  label: string
  buildings: number
  images: number
}

type TimelineItem = {
  label: string
  value: number
  bar?: number
}

function yearValue(year: string) {
  return /^\d{4}$/.test(year) ? Number(year) : null
}

function xAt(index: number, total: number) {
  if (total <= 1) return chart.left
  return (
    chart.left +
    (index / (total - 1)) * (chart.width - chart.left - chart.right)
  )
}

function yAt(count: number, maxCount: number) {
  const innerHeight = chart.height - chart.top - chart.bottom
  return chart.top + innerHeight - (count / maxCount) * innerHeight
}

function polarToCartesian(cx: number, cy: number, r: number, angle: number) {
  const radians = ((angle - 90) * Math.PI) / 180
  return {
    x: cx + r * Math.cos(radians),
    y: cy + r * Math.sin(radians),
  }
}

function donutPath(startAngle: number, endAngle: number) {
  const outer = 48
  const inner = 30
  const largeArc = endAngle - startAngle > 180 ? 1 : 0
  const outerStart = polarToCartesian(60, 60, outer, endAngle)
  const outerEnd = polarToCartesian(60, 60, outer, startAngle)
  const innerStart = polarToCartesian(60, 60, inner, startAngle)
  const innerEnd = polarToCartesian(60, 60, inner, endAngle)

  return [
    `M ${outerStart.x} ${outerStart.y}`,
    `A ${outer} ${outer} 0 ${largeArc} 0 ${outerEnd.x} ${outerEnd.y}`,
    `L ${innerStart.x} ${innerStart.y}`,
    `A ${inner} ${inner} 0 ${largeArc} 1 ${innerEnd.x} ${innerEnd.y}`,
    "Z",
  ].join(" ")
}

function TimelineChart({
  items,
  mode,
}: {
  items: TimelineItem[]
  mode: string
}) {
  const maxValue = Math.max(...items.map((item) => item.value), 1)
  const maxBar = Math.max(...items.map((item) => item.bar ?? item.value), 1)
  const linePoints = items
    .map(
      (item, index) =>
        `${xAt(index, items.length)},${yAt(item.value, maxValue)}`
    )
    .join(" ")
  const barWidth = Math.max(
    10,
    Math.min(30, (chart.width - chart.left - chart.right) / items.length - 8)
  )
  const labelStep = Math.max(1, Math.ceil(items.length / 7))

  return (
    <svg
      key={mode}
      viewBox={`0 0 ${chart.width} ${chart.height}`}
      role="img"
      aria-label="横坐标为时间、纵坐标为图像数量"
      className="h-72 w-full overflow-visible border bg-muted/20"
    >
      {[0, 0.5, 1].map((ratio) => {
        const y =
          chart.top + (chart.height - chart.top - chart.bottom) * (1 - ratio)
        return (
          <g key={ratio}>
            <line
              x1={chart.left}
              x2={chart.width - chart.right}
              y1={y}
              y2={y}
              stroke="var(--border)"
            />
            <text
              x={chart.left - 12}
              y={y + 4}
              textAnchor="end"
              className="fill-muted-foreground text-[11px]"
            >
              {Math.round(maxValue * ratio)}
            </text>
          </g>
        )
      })}

      {items.map((item, index) => {
        const x = xAt(index, items.length)
        const barValue = item.bar ?? item.value
        const y = yAt(barValue, maxBar)
        const barHeight = chart.height - chart.bottom - y

        return (
          <g key={`${item.label}-${index}`}>
            <rect
              className="portal-chart-bar cursor-pointer fill-primary/55 transition duration-200 hover:fill-primary"
              x={x - barWidth / 2}
              y={y}
              width={barWidth}
              height={Math.max(barHeight, 1)}
            >
              <title>{`${item.label}: ${item.value}`}</title>
            </rect>
            {index % labelStep === 0 || index === items.length - 1 ? (
              <text
                x={x}
                y={chart.height - 18}
                textAnchor="middle"
                className="fill-muted-foreground text-[11px]"
              >
                {item.label}
              </text>
            ) : null}
          </g>
        )
      })}

      <polyline
        className="portal-chart-line fill-none stroke-foreground"
        points={linePoints}
        strokeWidth="2.5"
        strokeDasharray="800"
        strokeLinecap="square"
        strokeLinejoin="round"
      />
      {items.map((item, index) => (
        <circle
          key={`${item.label}-point`}
          className="fill-background stroke-foreground transition duration-200 hover:fill-primary"
          cx={xAt(index, items.length)}
          cy={yAt(item.value, maxValue)}
          r="4"
        >
          <title>{`${item.label}: ${item.value}`}</title>
        </circle>
      ))}
    </svg>
  )
}

export function PortalStatsCharts() {
  const sectionRef = useRef<HTMLElement | null>(null)
  const [pieMode, setPieMode] = useState("archive")
  const [timelineMode, setTimelineMode] = useState("archive")
  const [databasePois, setDatabasePois] = useState<PublicMapPoi[]>([])

  useEffect(() => {
    let cancelled = false

    getPublicMapHome()
      .then((data) => {
        if (!cancelled) {
          setDatabasePois(data.pois)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setDatabasePois([])
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  const zoneStats = useMemo<PieItem[]>(
    () =>
      Object.values(
        campusHistoryItems.reduce(
          (acc, item) => {
            acc[item.zone] ??= { label: item.zone, buildings: 0, images: 0 }
            acc[item.zone].buildings += 1
            acc[item.zone].images += item.images.length
            return acc
          },
          {} as Record<string, PieItem>
        )
      ).sort((a, b) => b.images - a.images),
    []
  )
  const dbPoiStats = useMemo<PieItem[]>(
    () =>
      databasePois
        .map((poi) => ({
          label: poi.name,
          buildings: 1,
          images: poi.mediaList?.length ?? 0,
        }))
        .filter((item) => item.images > 0)
        .sort((a, b) => b.images - a.images),
    [databasePois]
  )
  const archiveTimeline = useMemo<TimelineItem[]>(() => {
    const grouped = campusHistoryItems
      .flatMap((item) => item.images)
      .reduce(
        (acc, image) => {
          const year = yearValue(image.year)
          if (year) acc[year] = (acc[year] ?? 0) + 1
          return acc
        },
        {} as Record<number, number>
      )

    return Object.entries(grouped)
      .map(([year, count]) => ({ label: year, value: count }))
      .sort((a, b) => Number(a.label) - Number(b.label))
  }, [])
  const dbTimeline = useMemo<TimelineItem[]>(
    () => {
      const grouped = databasePois
        .flatMap((poi) => poi.mediaList ?? [])
        .reduce(
          (acc, media) => {
            if (Number.isFinite(media.year)) {
              acc[media.year as number] = (acc[media.year as number] ?? 0) + 1
            }
            return acc
          },
          {} as Record<number, number>
        )

      let totalCount = 0
      return Object.entries(grouped)
        .map(([year, dailyCount]) => ({
          year: Number(year),
          dailyCount,
        }))
        .sort((a, b) => a.year - b.year)
        .map(({ year, dailyCount }) => {
          totalCount += dailyCount
          return {
            label: String(year),
            value: totalCount,
            bar: dailyCount,
          }
        })
    },
    [databasePois]
  )

  const pieItems = (pieMode === "archive" ? zoneStats : dbPoiStats).slice(0, 6)
  const pieTotal = pieItems.reduce((sum, item) => sum + item.images, 0)
  const timelineItems =
    timelineMode === "archive" ? archiveTimeline : dbTimeline
  let startAngle = 0

  useGSAP(
    () => {
      const mm = gsap.matchMedia()

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const timeline = gsap.timeline({
          defaults: { duration: 0.6, ease: "power2.out" },
        })

        timeline
          .from("[data-portal-chart]", { autoAlpha: 0, y: 18, stagger: 0.08 })
          .from(
            ".portal-chart-pie",
            { autoAlpha: 0, scale: 0.88, stagger: 0.05 },
            "-=0.25"
          )
          .from(
            ".portal-chart-bar",
            {
              scaleY: 0,
              transformOrigin: "bottom center",
              stagger: 0.035,
            },
            "-=0.3"
          )
          .from(
            ".portal-chart-line",
            { strokeDashoffset: 800, duration: 0.9 },
            "-=0.2"
          )
      })

      return () => mm.revert()
    },
    {
      scope: sectionRef,
      dependencies: [pieMode, timelineMode],
      revertOnUpdate: true,
    }
  )

  return (
    <section ref={sectionRef} className="grid gap-4 lg:grid-cols-2">
      <Card
        data-hover-lift
        data-portal-chart
        className="rounded-none shadow-none transition-colors duration-200 hover:border-primary/70"
      >
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>校史影像目录统计</CardTitle>
          <Tabs value={pieMode} onValueChange={setPieMode}>
            <TabsList className="rounded-none">
              <TabsTrigger className="rounded-none" value="archive">
                本地目录
              </TabsTrigger>
              <TabsTrigger className="rounded-none" value="database">
                数据库媒体
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-[220px_1fr] md:items-center">
          <svg
            viewBox="0 0 120 120"
            role="img"
            aria-label="影像目录占比"
            className="mx-auto size-56 overflow-visible"
          >
            <circle cx="60" cy="60" r="48" fill="var(--muted)" opacity="0.5" />
            <circle cx="60" cy="60" r="30" fill="var(--card)" />
            {pieItems.map((item, index) => {
              const angle = pieTotal ? (item.images / pieTotal) * 360 : 0
              const endAngle = startAngle + angle
              const path = donutPath(startAngle, endAngle)
              startAngle = endAngle
              return (
                <path
                  key={`${pieMode}-${item.label}`}
                  className="portal-chart-pie cursor-pointer transition duration-200 hover:opacity-80"
                  d={path}
                  fill={chartColors[index % chartColors.length]}
                >
                  <title>{`${item.label}: ${item.images} 张影像`}</title>
                </path>
              )
            })}
            <circle cx="60" cy="60" r="30" fill="var(--card)" />
          </svg>
          <div className="grid gap-2 text-sm">
            {pieItems.map((item, index) => (
              <div
                key={item.label}
                className="flex items-center justify-between gap-3 border p-2 transition duration-200 hover:-translate-y-0.5 hover:border-primary/70 hover:bg-muted/40"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <i
                    className="size-2.5 shrink-0"
                    style={{
                      background: chartColors[index % chartColors.length],
                    }}
                  />
                  <span className="truncate">{item.label}</span>
                </span>
                <span className="shrink-0 text-muted-foreground">
                  {item.buildings} 组 / {item.images} 张
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card
        data-hover-lift
        data-portal-chart
        className="rounded-none shadow-none transition-colors duration-200 hover:border-primary/70"
      >
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>年代影像数量</CardTitle>
          <Tabs value={timelineMode} onValueChange={setTimelineMode}>
            <TabsList className="rounded-none">
              <TabsTrigger className="rounded-none" value="archive">
                年代影像
              </TabsTrigger>
              <TabsTrigger className="rounded-none" value="database">
                数据库累计
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          <TimelineChart items={timelineItems} mode={timelineMode} />
        </CardContent>
      </Card>
    </section>
  )
}
