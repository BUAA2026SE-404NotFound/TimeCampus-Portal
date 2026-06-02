import { useMemo, useState } from "react"
import {
  Compass,
  LocateFixed,
  MessageSquare,
  Route,
  Sparkles,
} from "lucide-react"
import { toast } from "sonner"

import {
  planWalkingRoute,
  type PublicMapPoi,
  type WalkingRoutePlan,
} from "@/api/public-map"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import {
  qualityBand,
  scoreAgentOutput,
  type AgentQualityScore,
} from "@/features/agents/agent-quality"

type GuideStop = {
  poi: PublicMapPoi
  reason: string
  minutes: number
}

type GuidePlan = {
  title: string
  routeMode: string
  narrative: string
  stops: GuideStop[]
  quality: AgentQualityScore
}

const DEFAULT_PROMPT = "想看主楼、图书馆和有老照片的地点，控制在 45 分钟内"

function normalize(value?: string | number) {
  return String(value ?? "").toLowerCase().trim()
}

function terms(value: string) {
  const normalized = normalize(value)
  const result = new Set<string>()

  normalized
    .split(/[^\p{L}\p{N}\p{Script=Han}]+/u)
    .filter(Boolean)
    .forEach((term) => result.add(term))

  for (let index = 0; index < normalized.length; index += 1) {
    const current = normalized[index]
    if (/\p{Script=Han}/u.test(current)) {
      result.add(current)
      const next = normalized[index + 1]
      if (next && /\p{Script=Han}/u.test(next)) {
        result.add(`${current}${next}`)
      }
    }
  }

  return [...result]
}

function poiText(poi: PublicMapPoi) {
  return [
    poi.name,
    poi.description,
    poi.availableYears?.join(" "),
    poi.mediaList
      ?.map((item) => [item.year, item.description, item.imagePath].join(" "))
      .join(" "),
  ]
    .filter(Boolean)
    .join(" ")
}

function scorePoi(poi: PublicMapPoi, promptTerms: string[]) {
  const text = normalize(poiText(poi))
  let score = poi.mediaList?.length ? 8 : 2

  promptTerms.forEach((term) => {
    if (normalize(poi.name).includes(term)) score += 18
    if (text.includes(term)) score += 6
  })

  if (poi.availableYears?.length) score += Math.min(10, poi.availableYears.length * 2)
  if (poi.coverPreviewUrl || poi.coverThumbnailUrl || poi.coverImagePath) score += 4

  return score
}

function inferMinutes(prompt: string) {
  const match = prompt.match(/(\d{2,3})\s*(分钟|min)/i)
  return match ? Math.max(20, Math.min(120, Number(match[1]))) : 50
}

function formatDistance(meters?: number) {
  if (!meters) return "-"
  return meters >= 1000 ? `${(meters / 1000).toFixed(1)} km` : `${meters} m`
}

function formatDuration(seconds?: number) {
  if (!seconds) return "-"
  return `${Math.max(1, Math.round(seconds / 60))} min`
}

function routePoints(stops: GuideStop[]) {
  return stops
    .map((stop) => ({
      name: stop.poi.name,
      lat: Number(stop.poi.latitude),
      lng: Number(stop.poi.longitude),
    }))
    .filter(
      (point) =>
        Number.isFinite(point.lat) &&
        point.lat >= -90 &&
        point.lat <= 90 &&
        Number.isFinite(point.lng) &&
        point.lng >= -180 &&
        point.lng <= 180
    )
}

function stopDurationLabel(
  routePlan: WalkingRoutePlan | null,
  stopIndex: number,
  fallbackMinutes: number
) {
  const duration = routePlan?.legs[stopIndex - 1]?.durationSeconds
  return duration ? formatDuration(duration) : `${fallbackMinutes} min`
}

function buildGuidePlan(prompt: string, pois: PublicMapPoi[]): GuidePlan {
  const promptTerms = terms(prompt)
  const duration = inferMinutes(prompt)
  const stopCount = duration >= 70 ? 5 : duration >= 45 ? 4 : 3
  const ranked = pois
    .filter((poi) => poi.status !== 0)
    .map((poi) => ({ poi, score: scorePoi(poi, promptTerms) }))
    .sort((left, right) => right.score - left.score || left.poi.id - right.poi.id)
    .slice(0, stopCount)

  const stops = ranked.map(({ poi }, index) => ({
    poi,
    reason:
      poi.mediaList?.length || poi.availableYears?.length
        ? "影像与年代资料较完整"
        : index === 0
          ? "与检索意图匹配度最高"
          : "适合作为串联点位",
    minutes: Math.max(8, Math.round(duration / Math.max(1, ranked.length)) - 2),
  }))

  const quality = scoreAgentOutput({
    citedItems: stops.length,
    plannedActions: stops.length + 1,
    destructiveActions: 0,
    unresolvedRisks: stops.length ? 0 : 2,
    requiredFields: 3,
    completedFields: [prompt, stops.length, duration].filter(Boolean).length,
  })

  return {
    title: stops.length ? `${stops[0].poi.name} 起点导览` : "校园导览",
    routeMode: duration <= 40 ? "短线步行" : duration >= 70 ? "深度步行" : "标准步行",
    narrative: stops.length
      ? `按 ${duration} 分钟生成，优先选择可被 POI 与影像资料引用的地点。`
      : "当前没有足够 POI 数据生成路线。",
    stops,
    quality,
  }
}

export function VisitorGuideAgent({ pois }: { pois: PublicMapPoi[] }) {
  const [prompt, setPrompt] = useState(DEFAULT_PROMPT)
  const [plan, setPlan] = useState<GuidePlan>(() =>
    buildGuidePlan(DEFAULT_PROMPT, pois)
  )
  const [routePlan, setRoutePlan] = useState<WalkingRoutePlan | null>(null)
  const [routeError, setRouteError] = useState("")
  const [planning, setPlanning] = useState(false)

  const corpusStats = useMemo(() => {
    const mediaCount = pois.reduce(
      (total, poi) => total + (poi.mediaList?.length ?? 0),
      0
    )
    const yearCount = new Set(pois.flatMap((poi) => poi.availableYears ?? []))
      .size

    return { poiCount: pois.length, mediaCount, yearCount }
  }, [pois])

  async function handleGenerate() {
    const nextPlan = buildGuidePlan(prompt, pois)
    setPlan(nextPlan)
    setRoutePlan(null)
    setRouteError("")

    if (nextPlan.stops.length < 2) {
      toast.success("导览方案已更新")
      return
    }

    setPlanning(true)
    try {
      const points = routePoints(nextPlan.stops)
      if (points.length < 2) {
        toast.success("导览方案已更新")
        return
      }
      const nextRoutePlan = await planWalkingRoute(points)
      setRoutePlan(nextRoutePlan)
      toast.success("导览方案和步行路线已更新")
    } catch (error) {
      setRouteError(
        error instanceof Error ? error.message : "腾讯步行路线规划暂不可用"
      )
      toast.warning("导览已生成，路线规划暂不可用")
    } finally {
      setPlanning(false)
    }
  }

  return (
    <Card className="rounded-none shadow-none">
      <CardHeader>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="grid gap-1.5">
            <CardTitle className="flex items-center gap-2">
              <Sparkles />
              游客导览 Agent
            </CardTitle>
            <CardDescription>
              {corpusStats.poiCount} 个 POI · {corpusStats.mediaCount} 条影像 ·{" "}
              {corpusStats.yearCount} 个年代标签
            </CardDescription>
          </div>
          <Badge variant="secondary">
            {qualityBand(plan.quality.overall)} · {plan.quality.overall}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="grid gap-5 lg:grid-cols-[360px_minmax(0,1fr)]">
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="visitor-agent-prompt">导览需求</FieldLabel>
            <Textarea
              id="visitor-agent-prompt"
              className="min-h-28 resize-none rounded-none font-mono"
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
            />
            <FieldDescription>
              可写入主题、时间、想看的地点或影像年代。
            </FieldDescription>
          </Field>
          <Field>
            <FieldLabel htmlFor="visitor-agent-origin">起点</FieldLabel>
            <Input
              id="visitor-agent-origin"
              className="rounded-none font-mono"
              value={plan.stops[0]?.poi.name ?? "自动选择"}
              readOnly
            />
          </Field>
          <Button
            className="w-fit rounded-none font-mono"
            disabled={planning}
            onClick={() => {
              void handleGenerate()
            }}
          >
            <Compass data-icon="inline-start" />
            {planning ? "规划中" : "生成导览"}
          </Button>
        </FieldGroup>

        <div className="grid gap-4">
          <div className="grid gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">
                <Route data-icon="inline-start" />
                {routePlan
                  ? `${formatDistance(routePlan.totalDistanceMeters)} · ${formatDuration(routePlan.totalDurationSeconds)}`
                  : plan.routeMode}
              </Badge>
              <Badge variant="outline">
                <MessageSquare data-icon="inline-start" />
                {plan.title}
              </Badge>
            </div>
            <p className="text-sm leading-6 text-muted-foreground">
              {plan.narrative}
              {routeError ? ` 路线规划：${routeError}` : ""}
            </p>
          </div>
          <Separator />
          <div className="grid gap-3">
            {plan.stops.map((stop, index) => (
              <div
                key={stop.poi.id}
                className="grid gap-3 border bg-muted/20 p-3 sm:grid-cols-[auto_1fr_auto]"
              >
                <div className="grid size-9 place-items-center border bg-background">
                  {index + 1}
                </div>
                <div className="min-w-0">
                  <h3 className="truncate font-semibold">{stop.poi.name}</h3>
                  <p className="mt-1 line-clamp-2 text-sm leading-6 text-muted-foreground">
                    {stop.poi.description || stop.reason}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    引用：POI {stop.poi.id}
                    {stop.poi.availableYears?.length
                      ? ` · ${stop.poi.availableYears.slice(0, 4).join("/")}`
                      : ""}
                  </p>
                </div>
                <Badge variant="secondary" className="h-fit">
                  <LocateFixed data-icon="inline-start" />
                  {stopDurationLabel(routePlan, index, stop.minutes)}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
