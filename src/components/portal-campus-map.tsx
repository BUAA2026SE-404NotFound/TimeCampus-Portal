import { useEffect, useMemo, useRef, useState } from "react"
import {
  CalendarDays,
  Eye,
  EyeOff,
  LocateFixed,
  MapPin,
  Navigation,
} from "lucide-react"

import {
  ImagePreviewDialog,
  type ImagePreviewState,
} from "@/components/image-preview-dialog"
import { ProgressiveImage } from "@/components/progressive-image"
import {
  getPublicMapHome,
  type PublicMapMedia,
  type PublicMapPoi,
} from "@/api/public-map"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  loadTencentMap,
  type TMapNamespace,
  type TencentMap,
  type TencentMapClickEvent,
  type TencentMarkerClickEvent,
  type TencentMarkerLayer,
} from "@/lib/tencent-map"
const BUAA_CENTER = { lat: 39.981292, lng: 116.348026 }
const BUAA_BOUNDS = {
  southWest: { lat: 39.9766, lng: 116.3425 },
  northEast: { lat: 39.9877, lng: 116.3562 },
}
const NEAREST_POI_LIMIT = 5

type PortalPoi = Omit<PublicMapPoi, "mediaList"> & {
  mediaList: PublicMapMedia[]
}

function isValidPoi(poi: PortalPoi) {
  return (
    Number.isFinite(Number(poi.latitude)) &&
    Number.isFinite(Number(poi.longitude))
  )
}

function hasMedia(poi: PortalPoi) {
  return poi.mediaList.length > 0
}

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

function mediaForYear(poi: PortalPoi, year: number | null) {
  if (!year) {
    return poi.mediaList
  }

  return poi.mediaList.filter((media) => media.year === year)
}

function distanceMeters(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number }
) {
  const radius = 6371000
  const lat1 = (from.lat * Math.PI) / 180
  const lat2 = (to.lat * Math.PI) / 180
  const dLat = ((to.lat - from.lat) * Math.PI) / 180
  const dLng = ((to.lng - from.lng) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2

  return radius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function formatDistance(meters: number) {
  return meters >= 1000
    ? `${(meters / 1000).toFixed(1)} km`
    : `${Math.round(meters)} m`
}

function markerSvg(poi: PortalPoi, active: boolean, year: number | null) {
  const fill = active ? "#003a70" : "#0f6cae"
  const count = String(mediaForYear(poi, year).length)
  const safeCount = count.length > 2 ? "99+" : count
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="48" viewBox="0 0 40 48">
      <path fill="${fill}" stroke="#f7fbff" stroke-width="2" d="M20 46C14.8 38 5 29.2 5 18.8 5 10.6 11.7 4 20 4s15 6.6 15 14.8C35 29.2 25.2 38 20 46Z"/>
      <circle cx="20" cy="18.8" r="10.5" fill="#f7fbff"/>
      <text x="20" y="23" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" font-weight="700" fill="${fill}">${safeCount}</text>
    </svg>`

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`
}

function makeCampusBounds(TMap: TMapNamespace) {
  if (!TMap.LatLngBounds) {
    return null
  }

  return new TMap.LatLngBounds(
    new TMap.LatLng(BUAA_BOUNDS.southWest.lat, BUAA_BOUNDS.southWest.lng),
    new TMap.LatLng(BUAA_BOUNDS.northEast.lat, BUAA_BOUNDS.northEast.lng)
  )
}

export function PortalCampusMap() {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<TencentMap | null>(null)
  const markerLayerRef = useRef<TencentMarkerLayer | null>(null)
  const [selectedPoiId, setSelectedPoiId] = useState<number | null>(null)
  const [selectedYear, setSelectedYear] = useState<number | null>(null)
  const [showAllPois, setShowAllPois] = useState(false)
  const [hideAllPois, setHideAllPois] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [nearestOpen, setNearestOpen] = useState(false)
  const [nearestPois, setNearestPois] = useState<
    { poi: PortalPoi; distance: number }[]
  >([])
  const [mapReady, setMapReady] = useState(false)
  const [error, setError] = useState("")
  const [poiLoading, setPoiLoading] = useState(true)
  const [poiError, setPoiError] = useState("")
  const [portalPois, setPortalPois] = useState<PortalPoi[]>([])
  const [preview, setPreview] = useState<ImagePreviewState | null>(null)
  const mapKey = import.meta.env.VITE_TENCENT_MAP_KEY || ""

  const imagePois = useMemo(
    () => portalPois.filter(isValidPoi).filter(hasMedia),
    [portalPois]
  )
  const availableYears = useMemo(
    () =>
      Array.from(
        new Set(
          imagePois.flatMap((poi) =>
            poi.mediaList
              .map((media) => media.year)
              .filter((year) => Number.isFinite(year))
          )
        )
      ).sort((a, b) => a - b),
    [imagePois]
  )
  const yearIndex = selectedYear
    ? Math.max(0, availableYears.indexOf(selectedYear))
    : 0
  const yearPois = useMemo(() => {
    if (!selectedYear) {
      return imagePois
    }

    return imagePois.filter((poi) => mediaForYear(poi, selectedYear).length)
  }, [imagePois, selectedYear])
  const scopedPois = showAllPois ? imagePois : yearPois
  const displayedPois = hideAllPois ? [] : scopedPois
  const selectedPoi = imagePois.find((poi) => poi.id === selectedPoiId) ?? null
  const selectedMedia = selectedPoi
    ? showAllPois
      ? selectedPoi.mediaList
      : mediaForYear(selectedPoi, selectedYear)
    : []
  const selectedYears = useMemo(() => {
    if (!selectedPoi) {
      return []
    }

    return Array.from(
      new Set(
        (selectedPoi.mediaList ?? [])
          .map((media) => media.year)
          .filter((year) => year !== undefined && year !== null)
          .map(String)
      )
    ).sort()
  }, [selectedPoi])

  useEffect(() => {
    if (!availableYears.length) {
      return
    }
    if (selectedYear !== null && availableYears.includes(selectedYear)) {
      return
    }

    setSelectedYear(availableYears[availableYears.length - 1])
  }, [availableYears, selectedYear])

  useEffect(() => {
    let cancelled = false

    setPoiLoading(true)
    setPoiError("")
    getPublicMapHome()
      .then((data) => {
        if (cancelled) {
          return
        }

        setPortalPois(
          data.pois
            .map(normalizePoi)
            .filter((poi): poi is PortalPoi => Boolean(poi))
        )
      })
      .catch((apiError) => {
        if (cancelled) {
          return
        }

        setPortalPois([])
        setPoiError(
          apiError instanceof Error ? apiError.message : "公开地图数据加载失败"
        )
      })
      .finally(() => {
        if (!cancelled) {
          setPoiLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  function handleReturnCenter() {
    if (!window.TMap || !mapRef.current) {
      return
    }

    const center = new window.TMap.LatLng(BUAA_CENTER.lat, BUAA_CENTER.lng)
    if (mapRef.current.panTo) {
      mapRef.current.panTo(center)
    } else {
      mapRef.current.setCenter(center)
    }
    mapRef.current.setZoom(16)
  }

  function openPoiDetail(poiId: number) {
    if (!imagePois.some((poi) => poi.id === poiId)) {
      return
    }

    setSelectedPoiId(poiId)
    setDetailOpen(true)
  }

  function handleMapClick(event: TencentMapClickEvent) {
    if (!hideAllPois || !event.latLng) {
      return
    }

    const clickPoint = {
      lat: event.latLng.getLat(),
      lng: event.latLng.getLng(),
    }
    const sourcePois = scopedPois.length ? scopedPois : imagePois
    const nearest = sourcePois
      .map((poi) => ({
        poi,
        distance: distanceMeters(clickPoint, {
          lat: Number(poi.latitude),
          lng: Number(poi.longitude),
        }),
      }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, NEAREST_POI_LIMIT)

    setNearestPois(nearest)
    setNearestOpen(true)
  }

  useEffect(() => {
    if (!mapKey || !containerRef.current) {
      return
    }

    let cancelled = false

    loadTencentMap(mapKey)
      .then((TMap) => {
        if (cancelled || !containerRef.current || mapRef.current) {
          return
        }

        const campusBounds = makeCampusBounds(TMap)
        const mapOptions: Record<string, unknown> = {
          center: new TMap.LatLng(BUAA_CENTER.lat, BUAA_CENTER.lng),
          zoom: 16,
          minZoom: 14,
          maxZoom: 19,
          control: { zoom: true, scale: true, rotation: false },
          baseMap: { type: "satellite" },
        }

        if (campusBounds) {
          mapOptions.boundary = campusBounds
        }

        mapRef.current = new TMap.Map(containerRef.current, mapOptions)
        if (campusBounds) {
          mapRef.current.setBoundary?.(campusBounds)
        }
        setMapReady(true)
      })
      .catch((mapError) => {
        setError(
          mapError instanceof Error ? mapError.message : "腾讯地图加载失败"
        )
      })

    return () => {
      cancelled = true
    }
  }, [mapKey])

  useEffect(() => {
    if (!mapKey || !mapReady || !window.TMap || !mapRef.current) {
      return
    }

    markerLayerRef.current?.setMap?.(null)

    if (!displayedPois.length) {
      return
    }

    const TMap = window.TMap
    const styles = Object.fromEntries(
      displayedPois.map((poi) => [
        `poi-${poi.id}`,
        new TMap.MarkerStyle({
          width: 40,
          height: 48,
          anchor: new TMap.Point(20, 44),
          src: markerSvg(
            poi,
            poi.id === selectedPoi?.id,
            showAllPois ? null : selectedYear
          ),
        }),
      ])
    )
    const geometries = displayedPois.map((poi) => ({
      id: String(poi.id),
      styleId: `poi-${poi.id}`,
      position: new TMap.LatLng(Number(poi.latitude), Number(poi.longitude)),
      properties: { poiId: poi.id },
    }))

    const markerLayer = new TMap.MultiMarker({
      map: mapRef.current,
      styles,
      geometries,
      isStopPropagation: true,
    })
    const handleMarkerClick = (event: TencentMarkerClickEvent) => {
      const poiId = Number(
        event.geometry?.properties?.poiId ??
          event.geometry?.properties?.id ??
          event.geometry?.id
      )
      openPoiDetail(poiId)
    }
    markerLayer.on("click", handleMarkerClick)
    markerLayerRef.current = markerLayer

    return () => {
      markerLayer.off?.("click", handleMarkerClick)
      markerLayer.setMap?.(null)
    }
  }, [
    displayedPois,
    mapKey,
    mapReady,
    selectedPoi?.id,
    selectedYear,
    showAllPois,
  ])

  useEffect(() => {
    if (!mapReady || !mapRef.current) {
      return
    }

    const map = mapRef.current
    map.on("click", handleMapClick)

    return () => {
      map.off?.("click", handleMapClick)
    }
  }, [hideAllPois, imagePois, mapReady, scopedPois])

  useEffect(() => {
    if (!selectedPoi || !window.TMap || !mapRef.current) {
      return
    }

    mapRef.current.setCenter(
      new window.TMap.LatLng(
        Number(selectedPoi.latitude),
        Number(selectedPoi.longitude)
      )
    )
  }, [selectedPoi])

  useEffect(() => {
    const map = mapRef.current

    return () => {
      map?.destroy?.()
      markerLayerRef.current = null
      mapRef.current = null
    }
  }, [])

  return (
    <>
      <Card
        data-hover-lift
        className="rounded-none shadow-none transition-colors duration-200 hover:border-primary/70"
      >
        <CardHeader>
          <CardTitle>校园卫星底图</CardTitle>
          <CardDescription>
            腾讯地图卫星底图与用户端可见 POI，可按年代筛选影像点位。
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-3 border bg-background p-3 font-mono">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <CalendarDays className="size-4" />
                  年代浏览
                </div>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  {poiLoading
                    ? "正在从后端加载公开 POI 数据。"
                    : showAllPois
                      ? `当前显示全部年代有影像记录的 ${imagePois.length} 个 POI。`
                      : `当前显示 ${selectedYear ?? "?"} 年有影像记录的 ${yearPois.length} 个 POI。`}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant={showAllPois ? "default" : "outline"}
                  size="sm"
                  className="w-fit rounded-none font-mono"
                  onClick={() => {
                    setShowAllPois((value) => !value)
                    setNearestOpen(false)
                  }}
                >
                  <MapPin data-icon="inline-start" />
                  {showAllPois ? "回到年代筛选" : "显示所有 POI"}
                </Button>
                <Button
                  type="button"
                  variant={hideAllPois ? "default" : "outline"}
                  size="sm"
                  className="w-fit rounded-none font-mono"
                  onClick={() => {
                    setHideAllPois((value) => !value)
                    setNearestOpen(false)
                  }}
                >
                  {hideAllPois ? (
                    <EyeOff data-icon="inline-start" />
                  ) : (
                    <Eye data-icon="inline-start" />
                  )}
                  {hideAllPois ? "点击地图找最近 POI" : "隐藏所有 POI"}
                </Button>
              </div>
            </div>

            <div className="grid gap-2">
              <input
                type="range"
                min={0}
                max={Math.max(availableYears.length - 1, 0)}
                step={1}
                value={yearIndex}
                disabled={showAllPois || availableYears.length <= 1}
                className="h-2 w-full cursor-pointer accent-primary disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="选择地图影像年代"
                onChange={(event) => {
                  const nextYear = availableYears[Number(event.target.value)]
                  if (nextYear) {
                    setSelectedYear(nextYear)
                    setNearestOpen(false)
                  }
                }}
              />
              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span>{availableYears[0] ?? "?"}</span>
                <span className="font-semibold text-foreground">
                  {showAllPois ? "全部" : selectedYear ?? "?"}
                </span>
                <span>{availableYears[availableYears.length - 1] ?? "?"}</span>
              </div>
            </div>

            {poiError ? (
              <div className="border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                公开地图数据加载失败：{poiError}
              </div>
            ) : null}

            {hideAllPois ? (
              <div className="flex items-center gap-2 border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
                <Navigation className="size-4 shrink-0" />
                POI 标记已隐藏，点击地图任意位置会展示
                {showAllPois ? "全部年代" : "当前年代"}附近的影像点位。
              </div>
            ) : null}
          </div>

          <div className="portal-map-shell relative isolate mx-auto aspect-square w-full max-w-5xl overflow-hidden border bg-muted/30">
            {mapKey ? (
              <div ref={containerRef} className="size-full" />
            ) : (
              <div className="grid size-full place-items-center text-center text-sm text-muted-foreground">
                <span>腾讯地图 Key 未配置</span>
              </div>
            )}

            {error ? (
              <div className="absolute top-3 left-3 max-w-[min(22rem,calc(100%-1.5rem))] border bg-background/95 p-3 text-xs text-muted-foreground shadow-sm">
                {error}
              </div>
            ) : null}

            {mapReady ? (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="absolute top-3 left-3 z-10 rounded-none bg-background/95 font-mono shadow-sm backdrop-blur"
                onClick={handleReturnCenter}
              >
                <LocateFixed data-icon="inline-start" />
                回到北航
              </Button>
            ) : null}

            {mapReady && !hideAllPois && !displayedPois.length ? (
              <div className="absolute right-3 bottom-3 left-3 z-10 border bg-background/95 p-3 text-xs text-muted-foreground shadow-sm backdrop-blur sm:left-auto sm:max-w-xs">
                {poiLoading
                  ? "正在加载后端 POI 数据..."
                  : "当前年代暂无可展示的 POI 影像，请拖动年代滑动条查看其他时间点。"}
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>
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
                  {showAllPois ? "全部年代" : `${selectedYear ?? "?"} 年`}影像 ·{" "}
                  {selectedPoi.description || "?"}
                </DialogDescription>
              </DialogHeader>
              <PoiDetailCard
                poi={selectedPoi}
                years={selectedYears}
                activeYear={selectedYear}
                mediaList={selectedMedia}
                onPreview={setPreview}
                compact
              />
            </>
          ) : null}
        </DialogContent>
      </Dialog>
      <Dialog open={nearestOpen} onOpenChange={setNearestOpen}>
        <DialogContent className="max-h-[90svh] overflow-hidden rounded-none font-mono sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>附近影像点位</DialogTitle>
            <DialogDescription>
              {showAllPois ? "全部年代" : `${selectedYear ?? "?"} 年`}视图下，距离点击位置最近的{" "}
              {nearestPois.length} 个 POI。
            </DialogDescription>
          </DialogHeader>
          {nearestPois.length ? (
            <div className="grid max-h-[min(62svh,34rem)] gap-3 overflow-y-auto pr-1">
              {nearestPois.map(({ poi, distance }) => {
                const media =
                  (showAllPois ? poi.mediaList : mediaForYear(poi, selectedYear))[0] ??
                  poi.mediaList[0]
                const src = media ? mediaImageSource(poi, media) : undefined

                return (
                  <button
                    key={poi.id}
                    type="button"
                    className="grid grid-cols-[84px_1fr] items-center gap-3 border p-2 text-left transition-colors hover:border-primary/70 hover:bg-accent/40"
                    onClick={() => {
                      setNearestOpen(false)
                      openPoiDetail(poi.id)
                    }}
                  >
                    <ProgressiveImage
                      src={src}
                      placeholderSrc={
                        media ? mediaThumbnailSource(poi, media) : undefined
                      }
                      alt={media?.description || poi.name}
                      className="aspect-square border"
                    />
                    <span className="min-w-0">
                      <span className="flex items-center justify-between gap-3">
                        <span className="truncate font-semibold">
                          {poi.name}
                        </span>
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {formatDistance(distance)}
                        </span>
                      </span>
                      <span className="mt-1 line-clamp-2 block text-sm leading-5 text-muted-foreground">
                        {media?.year ?? "?"} · {media?.description || poi.description || "?"}
                      </span>
                    </span>
                  </button>
                )
              })}
            </div>
          ) : (
            <div className="grid min-h-28 place-items-center border bg-muted/20 text-sm text-muted-foreground">
              当前年代暂无可匹配的影像点位
            </div>
          )}
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
  return media.thumbnailUrl || poi.coverThumbnailUrl || mediaImageSource(poi, media)
}

function PoiDetailCard({
  poi,
  years,
  activeYear,
  mediaList,
  onPreview,
  compact = false,
}: {
  poi: PortalPoi
  years: string[]
  activeYear?: number | null
  mediaList?: PortalPoi["mediaList"]
  onPreview: (preview: ImagePreviewState | null) => void
  compact?: boolean
}) {
  const visibleMedia = mediaList ?? poi.mediaList

  return (
    <div
      className={
        compact
          ? "grid min-h-0 gap-4"
          : "max-h-[min(640px,calc(100svh-10rem))] overflow-y-auto border bg-background p-4 shadow-sm"
      }
    >
      {!compact ? (
        <div className="flex items-start gap-2">
          <MapPin className="mt-0.5 shrink-0" />
          <div className="min-w-0">
            <h3 className="truncate text-lg font-semibold">{poi.name}</h3>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              {poi.description || "?"}
            </p>
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-1 text-[11px] text-muted-foreground">
        {years.length ? (
          years.slice(0, 10).map((year) => (
            <span
              key={year}
              className={
                Number(year) === activeYear
                  ? "border border-primary bg-primary px-2 py-1 text-primary-foreground"
                  : "border px-2 py-1"
              }
            >
              {year}
            </span>
          ))
        ) : (
          <span className="border px-2 py-1">暂无年代影像</span>
        )}
      </div>

      {visibleMedia.length ? (
        <div className="grid max-h-[min(48svh,28rem)] gap-3 overflow-y-auto pr-1">
          {visibleMedia.map((media) => {
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
