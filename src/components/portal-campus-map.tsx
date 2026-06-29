import { useEffect, useMemo, useState } from "react"
import {
  ArrowDown,
  ArrowUp,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Info,
  LocateFixed,
  MapPin,
  Navigation,
  Plus,
  Route,
  Search,
  X,
} from "lucide-react"

import {
  ImagePreviewDialog,
  type ImagePreviewState,
} from "@/components/image-preview-dialog"
import { CampusPoiMap } from "@/components/campus-poi-map"
import {
  BUAA_CAMPUS_CENTER,
  BUAA_CAMPUS_DRAG_BOUNDS,
  getCampusPoiAvailableYears,
  getCampusPoiDistanceMeters,
  getCampusPoiMediaForYear,
  type CampusPoiMapMode,
  type CampusPoiNearestItem,
} from "@/components/campus-poi-map-utils"
import { ProgressiveImage } from "@/components/progressive-image"
import {
  getPublicMapHome,
  planWalkingRoute,
  type PublicMapMedia,
  type PublicMapPoi,
  type WalkingRoutePlan,
  type WalkingRoutePoint,
} from "@/api/public-map"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

type PortalPoi = Omit<PublicMapPoi, "mediaList"> & {
  latitude: number
  longitude: number
  mediaList: PublicMapMedia[]
}

type HotRoute = {
  label: string
  description: string
  poiIds: number[]
}

const POI_PAGE_SIZE = 6

function normalizePoi(poi: PublicMapPoi): PortalPoi | null {
  const latitude = Number(poi.latitude)
  const longitude = Number(poi.longitude)
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null
  }

  return {
    ...poi,
    latitude,
    longitude,
    mediaList: poi.mediaList ?? [],
  }
}

export function PortalCampusMap() {
  const [selectedPoiId, setSelectedPoiId] = useState<number | null>(null)
  const [mapMode, setMapMode] = useState<CampusPoiMapMode>("all")
  const [selectedYear, setSelectedYear] = useState<number | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [poiLoading, setPoiLoading] = useState(true)
  const [poiError, setPoiError] = useState("")
  const [portalPois, setPortalPois] = useState<PortalPoi[]>([])
  const [preview, setPreview] = useState<ImagePreviewState | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [poiPage, setPoiPage] = useState(1)
  const [activeTab, setActiveTab] = useState("pois")
  const [originMode, setOriginMode] = useState<"poi" | "location">("poi")
  const [visitorLocation, setVisitorLocation] =
    useState<WalkingRoutePoint | null>(null)
  const [routePoiIds, setRoutePoiIds] = useState<number[]>([])
  const [routePlan, setRoutePlan] = useState<WalkingRoutePlan | null>(null)
  const [routeLoading, setRouteLoading] = useState(false)
  const [routeError, setRouteError] = useState("")
  const [routeNotice, setRouteNotice] = useState("")
  const mapKey = import.meta.env.VITE_TENCENT_MAP_KEY || ""

  const availableYears = useMemo(
    () => getCampusPoiAvailableYears(portalPois),
    [portalPois]
  )
  const activeYear =
    mapMode === "timeline"
      ? selectedYear !== null && availableYears.includes(selectedYear)
        ? selectedYear
        : (availableYears.at(-1) ?? null)
      : null
  const selectedPoi = portalPois.find((poi) => poi.id === selectedPoiId) ?? null
  const selectedMedia = selectedPoi
    ? mapMode === "all"
      ? selectedPoi.mediaList
      : (getCampusPoiMediaForYear(
          selectedPoi,
          activeYear
        ) as PortalPoi["mediaList"])
    : []
  const selectedYears = useMemo(() => {
    if (!selectedPoi) return []
    return Array.from(
      new Set(
        selectedPoi.mediaList
          .map((media) => media.year)
          .filter((year) => year !== undefined && year !== null)
          .map(String)
      )
    ).sort()
  }, [selectedPoi])
  const filteredPois = useMemo(() => {
    const query = searchQuery.trim().toLocaleLowerCase()
    if (!query) return portalPois
    return portalPois.filter((poi) =>
      `${poi.name} ${poi.description ?? ""}`.toLocaleLowerCase().includes(query)
    )
  }, [portalPois, searchQuery])
  const poiPageCount = Math.max(
    1,
    Math.ceil(filteredPois.length / POI_PAGE_SIZE)
  )
  const activePoiPage = Math.min(poiPage, poiPageCount)
  const pagedPois = filteredPois.slice(
    (activePoiPage - 1) * POI_PAGE_SIZE,
    activePoiPage * POI_PAGE_SIZE
  )
  const selectedRoutePois = routePoiIds
    .map((id) => portalPois.find((poi) => poi.id === id))
    .filter((poi): poi is PortalPoi => Boolean(poi))
  const hotRoutes = useMemo(() => buildHotRoutes(portalPois), [portalPois])
  const routePaths = routePlan?.legs.map((leg) => leg.path) ?? []
  const requiredPoiCount = originMode === "location" ? 1 : 2
  const canPlanRoute =
    selectedRoutePois.length >= requiredPoiCount && !routeLoading

  useEffect(() => {
    let cancelled = false

    getPublicMapHome()
      .then((data) => {
        if (!cancelled) {
          setPortalPois(
            data.pois
              .map(normalizePoi)
              .filter((poi): poi is PortalPoi => Boolean(poi))
          )
        }
      })
      .catch((apiError) => {
        if (!cancelled) {
          setPoiError(
            apiError instanceof Error ? apiError.message : "公开地图数据加载失败"
          )
        }
      })
      .finally(() => {
        if (!cancelled) setPoiLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  function openPoiDetail(poi: PortalPoi) {
    setSelectedPoiId(Number(poi.id))
    setDetailOpen(true)
  }

  function addRoutePoi(poi: PortalPoi) {
    if (routePoiIds.includes(poi.id)) {
      setRouteNotice(`${poi.name} 已在路线中`)
      setActiveTab("route")
      return
    }
    const maxPois = originMode === "location" ? 7 : 8
    if (routePoiIds.length >= maxPois) {
      setRouteError(`当前起点模式最多还能选择 ${maxPois} 个景点`)
      return
    }
    setRoutePoiIds((current) => [...current, poi.id])
    setRoutePlan(null)
    setRouteError("")
    setRouteNotice(`已加入 ${poi.name}，继续点击地图景点添加一个或多个目的地`)
    setActiveTab("route")
  }

  function handleMapPoiSelect(poi: PortalPoi) {
    if (activeTab === "route") {
      addRoutePoi(poi)
      return
    }
    openPoiDetail(poi)
  }

  function removeRoutePoi(index: number) {
    setRoutePoiIds((current) => current.filter((_, item) => item !== index))
    setRoutePlan(null)
    setRouteNotice("")
  }

  function moveRoutePoi(index: number, direction: -1 | 1) {
    const nextIndex = index + direction
    if (nextIndex < 0 || nextIndex >= routePoiIds.length) return
    setRoutePoiIds((current) => {
      const next = [...current]
      ;[next[index], next[nextIndex]] = [next[nextIndex], next[index]]
      return next
    })
    setRoutePlan(null)
    setRouteNotice("")
  }

  async function locateVisitor() {
    setRouteError("")
    if (!navigator.geolocation) {
      throw new Error("当前浏览器不支持定位，请改用景点起点")
    }
    const position = await new Promise<GeolocationPosition>((resolve, reject) =>
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 30000,
      })
    )
    const point = {
      name: "我的位置",
      lat: position.coords.latitude,
      lng: position.coords.longitude,
    }
    if (!insideCampus(point)) {
      throw new Error("当前位置不在校园地图范围内，请改用景点起点")
    }
    setVisitorLocation(point)
    return point
  }

  async function planRoute(ids = routePoiIds) {
    setRouteError("")
    setRouteNotice("")
    setRouteLoading(true)
    try {
      const pois = ids
        .map((id) => portalPois.find((poi) => poi.id === id))
        .filter((poi): poi is PortalPoi => Boolean(poi))
      let location: WalkingRoutePoint | null = null
      if (originMode === "location") {
        try {
          location = visitorLocation || (await locateVisitor())
        } catch {
          setOriginMode("poi")
          setVisitorLocation(null)
          if (pois.length < 2) {
            throw new Error(
              "定位不可用，已切换为首个景点起点；请至少选择 2 个景点"
            )
          }
          setRouteNotice("定位不可用，已自动改用首个景点作为起点")
        }
      }
      const points: WalkingRoutePoint[] = [
        ...(location ? [location] : []),
        ...pois.map((poi) => ({
          name: poi.name,
          lat: poi.latitude,
          lng: poi.longitude,
        })),
      ]
      if (points.length < 2) {
        throw new Error("请至少选择起点和一个游览目标")
      }
      if (points.length > 8) {
        throw new Error("路线最多支持 8 个点位")
      }
      const plan = await planWalkingRoute(points)
      if (!plan.legs.length || plan.legs.some((leg) => leg.path.length < 2)) {
        throw new Error("路线服务未返回可绘制的步行路径")
      }
      setRoutePlan(plan)
      setRoutePoiIds(ids)
      setActiveTab("route")
    } catch (error) {
      setRoutePlan(null)
      setRouteError(routeErrorMessage(error))
    } finally {
      setRouteLoading(false)
    }
  }

  function renderNearestItem(
    item: CampusPoiNearestItem<PortalPoi>,
    actions: {
      selectPoi: () => void
      formatDistance: (meters: number) => string
    }
  ) {
    const scopedMedia =
      mapMode === "all"
        ? item.poi.mediaList
        : (getCampusPoiMediaForYear(
            item.poi,
            activeYear
          ) as PortalPoi["mediaList"])
    const media = scopedMedia[0] ?? item.poi.mediaList[0]

    return (
      <button
        type="button"
        className="grid grid-cols-[84px_1fr] items-center gap-3 border p-2 text-left transition-colors hover:border-primary/70 hover:bg-accent/40"
        onClick={actions.selectPoi}
      >
        <ProgressiveImage
          src={media ? mediaImageSource(item.poi, media) : undefined}
          placeholderSrc={
            media ? mediaThumbnailSource(item.poi, media) : undefined
          }
          alt={media?.description || item.poi.name}
          className="aspect-square border"
        />
        <span className="min-w-0">
          <span className="flex items-center justify-between gap-3">
            <span className="truncate font-semibold">{item.poi.name}</span>
            <span className="shrink-0 text-xs text-muted-foreground">
              {actions.formatDistance(item.distance)}
            </span>
          </span>
          <span className="mt-1 line-clamp-2 block text-sm leading-5 text-muted-foreground">
            {item.mediaCount} 张影像 · {media?.year ?? "?"} ·{" "}
            {media?.description || item.poi.description || "暂无简介"}
          </span>
        </span>
      </button>
    )
  }

  return (
    <>
      <div className="grid items-start gap-4 lg:grid-cols-[420px_minmax(0,1fr)]">
        <section className="min-w-0 border bg-card p-4 font-mono lg:sticky lg:top-4 lg:h-[76svh] lg:min-h-[620px] lg:max-h-[840px] lg:overflow-hidden">
          <Tabs
            value={activeTab}
            className="h-full min-h-0 flex-col"
            onValueChange={setActiveTab}
          >
            <TabsList className="grid w-full grid-cols-2 rounded-none">
              <TabsTrigger value="pois">
                <Search data-icon="inline-start" />
                景点查询
              </TabsTrigger>
              <TabsTrigger value="route">
                <Route data-icon="inline-start" />
                路线规划
              </TabsTrigger>
            </TabsList>

            <TabsContent
              value="pois"
              className="mt-4 min-h-0 overflow-y-auto pr-1"
            >
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="poi-search">搜索景点</FieldLabel>
                  <Input
                    id="poi-search"
                    value={searchQuery}
                    placeholder="名称或简介"
                    onChange={(event) => {
                      setSearchQuery(event.target.value)
                      setPoiPage(1)
                    }}
                  />
                  <FieldDescription>
                    共 {filteredPois.length} 个公开景点 · 第 {activePoiPage}/
                    {poiPageCount} 页
                  </FieldDescription>
                </Field>
              </FieldGroup>
              <div className="mt-4 grid gap-2">
                {pagedPois.map((poi) => {
                  const media = poi.mediaList[0]
                  return (
                    <div
                      key={poi.id}
                      className="grid grid-cols-[72px_minmax(0,1fr)] gap-3 border p-2"
                    >
                      <ProgressiveImage
                        src={
                          media
                            ? mediaThumbnailSource(poi, media)
                            : poi.coverThumbnailUrl
                        }
                        alt={poi.name}
                        className="aspect-square border"
                      />
                      <div className="grid min-w-0 gap-2">
                        <div className="min-w-0">
                          <p className="truncate font-semibold">{poi.name}</p>
                          <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">
                            {poi.description || "暂无简介"}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="flex-1 rounded-none"
                            onClick={() => openPoiDetail(poi)}
                          >
                            <Info data-icon="inline-start" />
                            详情
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            className="flex-1 rounded-none"
                            disabled={routePoiIds.includes(poi.id)}
                            onClick={() => addRoutePoi(poi)}
                          >
                            <Plus data-icon="inline-start" />
                            {routePoiIds.includes(poi.id) ? "已选择" : "加入"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
                })}
                {!poiLoading && !filteredPois.length ? (
                  <p className="border p-4 text-center text-sm text-muted-foreground">
                    没有匹配的公开景点
                  </p>
                ) : null}
              </div>
              {filteredPois.length > POI_PAGE_SIZE ? (
                <div className="mt-3 flex items-center justify-between gap-2 border-t pt-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="rounded-none"
                    disabled={activePoiPage <= 1}
                    onClick={() => setPoiPage(activePoiPage - 1)}
                  >
                    <ChevronLeft data-icon="inline-start" />
                    上一页
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    {activePoiPage} / {poiPageCount}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="rounded-none"
                    disabled={activePoiPage >= poiPageCount}
                    onClick={() => setPoiPage(activePoiPage + 1)}
                  >
                    下一页
                    <ChevronRight data-icon="inline-end" />
                  </Button>
                </div>
              ) : null}
            </TabsContent>

            <TabsContent
              value="route"
              className="mt-4 min-h-0 overflow-y-auto pr-1"
            >
              <div className="mb-4 border bg-muted/20 p-3 text-xs leading-5 text-muted-foreground">
                点击右侧地图上的 POI，或从景点查询列表加入路线。路线按下方顺序规划，最多 8 个点位。
              </div>
              <FieldGroup>
                <Field>
                  <FieldLabel>路线起点</FieldLabel>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      type="button"
                      variant={originMode === "poi" ? "default" : "outline"}
                      className="rounded-none"
                      onClick={() => {
                        setOriginMode("poi")
                        setRoutePlan(null)
                        setRouteError("")
                        setRouteNotice("")
                      }}
                    >
                      <MapPin data-icon="inline-start" />
                      首个景点
                    </Button>
                    <Button
                      type="button"
                      variant={
                        originMode === "location" ? "default" : "outline"
                      }
                      className="rounded-none"
                      onClick={async () => {
                        setOriginMode("location")
                        setRoutePlan(null)
                        setRouteNotice("")
                        try {
                          await locateVisitor()
                        } catch (error) {
                          setOriginMode("poi")
                          setRouteError(
                            error instanceof Error
                              ? error.message
                              : "无法获取位置"
                          )
                        }
                      }}
                    >
                      <LocateFixed data-icon="inline-start" />
                      我的位置
                    </Button>
                  </div>
                </Field>

                <Field>
                  <FieldLabel>热门路线</FieldLabel>
                  <div className="grid gap-2">
                    {hotRoutes.map((route) => (
                      <button
                        key={route.label}
                        type="button"
                        className="border p-3 text-left transition-colors hover:border-primary/70 hover:bg-accent/40"
                        onClick={() => void planRoute(route.poiIds)}
                      >
                        <span className="font-semibold">{route.label}</span>
                        <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                          {route.description}
                        </span>
                      </button>
                    ))}
                  </div>
                </Field>
              </FieldGroup>

              <div className="mt-4 grid max-h-[310px] gap-2 overflow-y-auto pr-1">
                {originMode === "location" && visitorLocation ? (
                  <div className="flex items-center gap-2 border bg-muted/20 p-2">
                    <LocateFixed className="size-4 shrink-0" />
                    <span className="text-sm font-semibold">我的位置</span>
                    <Badge variant="secondary" className="ml-auto rounded-none">
                      起点
                    </Badge>
                  </div>
                ) : null}
                {selectedRoutePois.map((poi, index) => (
                  <div
                    key={poi.id}
                    className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 border p-2"
                  >
                    <span className="grid size-7 place-items-center bg-primary text-xs text-primary-foreground">
                      {originMode === "location" ? index + 2 : index + 1}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate font-semibold">
                        {poi.name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {originMode === "poi" && index === 0 ? "起点" : "游览目标"}
                      </span>
                    </span>
                    <span className="flex">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        disabled={index === 0}
                        title="上移"
                        onClick={() => moveRoutePoi(index, -1)}
                      >
                        <ArrowUp />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        disabled={index === selectedRoutePois.length - 1}
                        title="下移"
                        onClick={() => moveRoutePoi(index, 1)}
                      >
                        <ArrowDown />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        title="移除"
                        onClick={() => removeRoutePoi(index)}
                      >
                        <X />
                      </Button>
                    </span>
                  </div>
                ))}
                {!selectedRoutePois.length ? (
                  <button
                    type="button"
                    className="border p-4 text-center text-sm text-muted-foreground"
                    onClick={() => setActiveTab("pois")}
                  >
                    从景点查询中加入路线点
                  </button>
                ) : null}
              </div>

              {routeError ? (
                <p
                  role="alert"
                  className="mt-3 border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive"
                >
                  {routeError}
                </p>
              ) : null}
              {routeNotice ? (
                <p className="mt-3 border bg-muted/20 p-3 text-xs text-muted-foreground">
                  {routeNotice}
                </p>
              ) : null}

              <div className="mt-4 flex gap-2">
                <Button
                  type="button"
                  className="flex-1 rounded-none"
                  disabled={!canPlanRoute}
                  onClick={() => void planRoute()}
                >
                  <Navigation data-icon="inline-start" />
                  {routeLoading
                    ? "规划中..."
                    : canPlanRoute
                      ? "规划步行路线"
                      : `还需选择 ${requiredPoiCount - selectedRoutePois.length} 个点`}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="rounded-none"
                  title="清空路线"
                  onClick={() => {
                    setRoutePoiIds([])
                    setRoutePlan(null)
                    setRouteError("")
                    setRouteNotice("")
                  }}
                >
                  <X />
                </Button>
              </div>

              {routePlan ? (
                <div className="mt-4 grid gap-3 border bg-muted/20 p-3">
                  <div className="grid grid-cols-2 gap-3">
                    <span>
                      <span className="block text-xs text-muted-foreground">
                        总距离
                      </span>
                      <span className="font-semibold">
                        {formatDistance(routePlan.totalDistanceMeters)}
                      </span>
                    </span>
                    <span>
                      <span className="block text-xs text-muted-foreground">
                        预计耗时
                      </span>
                      <span className="font-semibold">
                        {formatDuration(routePlan.totalDurationSeconds)}
                      </span>
                    </span>
                  </div>
                  {routePlan.legs.map((leg, index) => (
                    <div
                      key={`${leg.from.name}-${leg.to.name}-${index}`}
                      className="flex items-start gap-2 border-t pt-2 text-xs"
                    >
                      <Clock3 className="mt-0.5 size-4 shrink-0" />
                      <span>
                        {leg.from.name} → {leg.to.name}
                        <span className="mt-1 block text-muted-foreground">
                          {formatDistance(leg.distanceMeters)} ·{" "}
                          {formatDuration(leg.durationSeconds)}
                        </span>
                      </span>
                    </div>
                  ))}
                </div>
              ) : null}
            </TabsContent>
          </Tabs>
        </section>

        <CampusPoiMap
          className="lg:h-[76svh] lg:min-h-[620px] lg:max-h-[840px] lg:grid-rows-[auto_minmax(0,1fr)] lg:overflow-hidden"
          mapKey={mapKey}
          pois={portalPois}
          selectedPoiId={selectedPoiId}
          mode={mapMode}
          onModeChange={setMapMode}
          selectedYear={selectedYear}
          onSelectedYearChange={setSelectedYear}
          onPoiSelect={handleMapPoiSelect}
          highlightedPoiIds={routePoiIds}
          loading={poiLoading}
          dataError={poiError}
          routePaths={routePaths}
          focusSelectedPoi={activeTab === "pois"}
          mapShellClassName="relative h-[70svh] min-h-[560px] max-h-[760px] w-full overflow-hidden border bg-muted/30 lg:h-auto lg:min-h-0 lg:max-h-none"
          emptyText="当前视图暂无可展示的 POI 影像，请切换显示模式或年代。"
          nearestTitle="附近影像点位"
          renderNearestItem={renderNearestItem}
        />
      </div>

      <Dialog
        open={Boolean(selectedPoi && detailOpen)}
        onOpenChange={setDetailOpen}
      >
        <DialogContent className="max-h-[90svh] overflow-hidden rounded-none font-mono sm:max-w-2xl">
          {selectedPoi ? (
            <>
              <DialogHeader>
                <DialogTitle>{selectedPoi.name}</DialogTitle>
                <DialogDescription>
                  {mapMode === "all" ? "全部年代" : `${activeYear ?? "?"} 年`}
                  影像 · {selectedPoi.description || "暂无简介"}
                </DialogDescription>
              </DialogHeader>
              <PoiDetailCard
                poi={selectedPoi}
                years={selectedYears}
                activeYear={activeYear}
                mediaList={selectedMedia}
                onPreview={setPreview}
              />
            </>
          ) : null}
        </DialogContent>
      </Dialog>
      <ImagePreviewDialog
        image={preview}
        onOpenChange={(open) => {
          if (!open) setPreview(null)
        }}
      />
    </>
  )
}

function insideCampus(point: WalkingRoutePoint) {
  const { southWest, northEast } = BUAA_CAMPUS_DRAG_BOUNDS
  return (
    point.lat >= southWest.lat &&
    point.lat <= northEast.lat &&
    point.lng >= southWest.lng &&
    point.lng <= northEast.lng
  )
}

function routeErrorMessage(error: unknown) {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof error.code === "number"
  ) {
    return "无法获取位置，请允许定位或改用景点起点"
  }
  return error instanceof Error ? error.message : "路线规划失败"
}

function buildHotRoutes(pois: PortalPoi[]): HotRoute[] {
  if (pois.length < 2) return []
  const candidates = [
    {
      label: "热门影像线",
      description: "优先串联历史影像数量较多的景点",
      pois: topPois(pois, (poi) => poi.mediaList.length),
    },
    {
      label: "年代纵览线",
      description: "优先串联年代覆盖更丰富的景点",
      pois: topPois(
        pois,
        (poi) => new Set(poi.mediaList.map((media) => media.year)).size
      ),
    },
    {
      label: "校园精华线",
      description: "从校园中心附近的代表性景点开始游览",
      pois: [...pois]
        .sort(
          (left, right) =>
            distanceFromCenter(left) - distanceFromCenter(right)
        )
        .slice(0, 4),
    },
  ]
  const seen = new Set<string>()
  return candidates.flatMap((candidate) => {
    const poiIds = nearestNeighborOrder(candidate.pois).map((poi) => poi.id)
    const key = poiIds.join(",")
    if (poiIds.length < 2 || seen.has(key)) return []
    seen.add(key)
    return [{ ...candidate, poiIds }]
  })
}

function topPois(pois: PortalPoi[], score: (poi: PortalPoi) => number) {
  return [...pois].sort((a, b) => score(b) - score(a)).slice(0, 4)
}

function nearestNeighborOrder(pois: PortalPoi[]) {
  if (!pois.length) return []
  const remaining = [...pois]
  const ordered = [
    remaining.splice(
      remaining.reduce(
        (best, poi, index) =>
          distanceFromCenter(poi) < distanceFromCenter(remaining[best])
            ? index
            : best,
        0
      ),
      1
    )[0],
  ]
  while (remaining.length) {
    const last = ordered.at(-1)!
    const nextIndex = remaining.reduce(
      (best, poi, index) =>
        getCampusPoiDistanceMeters(
          { lat: last.latitude, lng: last.longitude },
          { lat: poi.latitude, lng: poi.longitude }
        ) <
        getCampusPoiDistanceMeters(
          { lat: last.latitude, lng: last.longitude },
          {
            lat: remaining[best].latitude,
            lng: remaining[best].longitude,
          }
        )
          ? index
          : best,
      0
    )
    ordered.push(remaining.splice(nextIndex, 1)[0])
  }
  return ordered
}

function distanceFromCenter(poi: PortalPoi) {
  return getCampusPoiDistanceMeters(BUAA_CAMPUS_CENTER, {
    lat: poi.latitude,
    lng: poi.longitude,
  })
}

function formatDistance(meters: number) {
  return meters >= 1000 ? `${(meters / 1000).toFixed(1)} km` : `${meters} m`
}

function formatDuration(seconds: number) {
  return `${Math.max(1, Math.ceil(seconds / 60))} 分钟`
}

function mediaImageSource(
  poi: PortalPoi,
  media: PortalPoi["mediaList"][number]
) {
  return media.previewUrl || media.imagePath || poi.coverPreviewUrl || null
}

function mediaThumbnailSource(
  poi: PortalPoi,
  media: PortalPoi["mediaList"][number]
) {
  return (
    media.thumbnailUrl || poi.coverThumbnailUrl || mediaImageSource(poi, media)
  )
}

function PoiDetailCard({
  poi,
  years,
  activeYear,
  mediaList,
  onPreview,
}: {
  poi: PortalPoi
  years: string[]
  activeYear?: number | null
  mediaList: PortalPoi["mediaList"]
  onPreview: (preview: ImagePreviewState | null) => void
}) {
  return (
    <div className="grid min-h-0 gap-4">
      <div className="flex flex-wrap gap-1 text-[11px] text-muted-foreground">
        {years.length ? (
          years.slice(0, 10).map((year) => (
            <Badge
              key={year}
              variant={Number(year) === activeYear ? "default" : "outline"}
              className="rounded-none"
            >
              {year}
            </Badge>
          ))
        ) : (
          <Badge variant="outline" className="rounded-none">
            暂无年代影像
          </Badge>
        )}
      </div>

      {mediaList.length ? (
        <div className="grid max-h-[min(48svh,28rem)] gap-3 overflow-y-auto pr-1">
          {mediaList.map((media) => {
            const src = mediaImageSource(poi, media)
            return (
              <button
                key={media.id}
                type="button"
                className="grid grid-cols-[96px_1fr] items-center gap-3 border p-2 text-left transition-colors hover:border-primary/70 hover:bg-accent/40"
                onClick={() =>
                  src &&
                  onPreview({
                    src,
                    alt: media.description || poi.name,
                    caption: `${poi.name} / ${media.year ?? "?"}`,
                  })
                }
              >
                <ProgressiveImage
                  src={src}
                  placeholderSrc={mediaThumbnailSource(poi, media)}
                  alt={media.description || poi.name}
                  className="aspect-square border"
                />
                <span className="min-w-0">
                  <span className="block font-semibold">
                    {media.year ?? "?"} · {media.type || "official"}
                  </span>
                  <span className="mt-1 line-clamp-2 block text-sm leading-5 text-muted-foreground">
                    {media.description || poi.name}
                  </span>
                </span>
              </button>
            )
          })}
        </div>
      ) : (
        <div className="grid min-h-28 place-items-center border bg-muted/20 text-sm text-muted-foreground">
          当前年代暂无关联影像
        </div>
      )}
    </div>
  )
}
