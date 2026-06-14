import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import type { ReactNode } from "react"
import {
  CalendarDays,
  Eye,
  EyeOff,
  LocateFixed,
  MapPin,
  Navigation,
} from "lucide-react"

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
import {
  BUAA_CAMPUS_CENTER,
  BUAA_CAMPUS_DRAG_BOUNDS,
  CAMPUS_NEAREST_POI_LIMIT,
  campusPoiKey,
  formatCampusPoiDistance,
  getCampusPoiAvailableYears,
  getCampusPoiDistanceMeters,
  getCampusPoiMediaCountForMode,
  getCampusPoiMediaCountForYear,
  isCampusPoiValid,
  type CampusPoiId,
  type CampusPoiMapMode,
  type CampusPoiMapPoi,
  type CampusPoiNearestItem,
} from "@/components/campus-poi-map-utils"
import { mergeClassName } from "@/lib/utils"

type CampusPoiMapProps<TPoi extends CampusPoiMapPoi> = {
  mapKey: string
  pois: TPoi[]
  selectedPoiId?: CampusPoiId | null
  mode?: CampusPoiMapMode
  onModeChange?: (mode: CampusPoiMapMode) => void
  selectedYear?: number | null
  onSelectedYearChange?: (year: number | null) => void
  onPoiSelect?: (poi: TPoi) => void
  loading?: boolean
  dataError?: string
  className?: string
  mapShellClassName?: string
  mapUnavailableText?: string
  emptyText?: string
  focusSelectedPoi?: boolean
  focusZoom?: number
  nearestTitle?: string
  renderNearestItem?: (
    item: CampusPoiNearestItem<TPoi>,
    actions: {
      selectPoi: () => void
      formatDistance: (meters: number) => string
    }
  ) => ReactNode
}

function markerSvg({
  active,
  count,
  status,
}: {
  active: boolean
  count: number
  status?: number | string | null
}) {
  const inactive = Number(status) === 0
  const fill = inactive ? "#7b8794" : active ? "#003a70" : "#0f6cae"
  const stroke = active ? "#002b5c" : inactive ? "#5d6672" : "#f7fbff"
  const safeCount = count > 99 ? "99+" : String(Math.max(0, count))
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="48" viewBox="0 0 40 48">
      <path fill="${fill}" stroke="${stroke}" stroke-width="2" d="M20 46C14.8 38 5 29.2 5 18.8 5 10.6 11.7 4 20 4s15 6.6 15 14.8C35 29.2 25.2 38 20 46Z"/>
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
    new TMap.LatLng(
      BUAA_CAMPUS_DRAG_BOUNDS.southWest.lat,
      BUAA_CAMPUS_DRAG_BOUNDS.southWest.lng
    ),
    new TMap.LatLng(
      BUAA_CAMPUS_DRAG_BOUNDS.northEast.lat,
      BUAA_CAMPUS_DRAG_BOUNDS.northEast.lng
    )
  )
}

export function CampusPoiMap<TPoi extends CampusPoiMapPoi>({
  mapKey,
  pois,
  selectedPoiId,
  mode,
  onModeChange,
  selectedYear,
  onSelectedYearChange,
  onPoiSelect,
  loading = false,
  dataError = "",
  className = "",
  mapShellClassName = "relative h-140 w-full overflow-hidden border bg-muted/30",
  mapUnavailableText = "腾讯地图 Key 未配置",
  emptyText = "当前视图暂无可展示 POI",
  focusSelectedPoi = true,
  focusZoom = 17,
  nearestTitle = "附近 POI",
  renderNearestItem,
}: CampusPoiMapProps<TPoi>) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<TencentMap | null>(null)
  const markerLayerRef = useRef<TencentMarkerLayer | null>(null)
  const [internalMode, setInternalMode] = useState<CampusPoiMapMode>("all")
  const [internalYear, setInternalYear] = useState<number | null>(null)
  const [hideAllPois, setHideAllPois] = useState(false)
  const [nearestOpen, setNearestOpen] = useState(false)
  const [nearestPois, setNearestPois] = useState<CampusPoiNearestItem<TPoi>[]>(
    []
  )
  const [mapReady, setMapReady] = useState(false)
  const [error, setError] = useState("")
  const effectiveMode = mode ?? internalMode
  const effectiveSelectedYear =
    selectedYear === undefined ? internalYear : selectedYear
  const selectedPoiKey =
    selectedPoiId === undefined || selectedPoiId === null
      ? null
      : String(selectedPoiId)

  const validPois = useMemo(
    () => pois.filter((poi) => isCampusPoiValid(poi)),
    [pois]
  )
  const availableYears = useMemo(
    () => getCampusPoiAvailableYears(validPois),
    [validPois]
  )
  const activeYear =
    effectiveMode === "timeline"
      ? effectiveSelectedYear !== null &&
        availableYears.includes(effectiveSelectedYear)
        ? effectiveSelectedYear
        : (availableYears.at(-1) ?? null)
      : null
  const yearIndex = activeYear
    ? Math.max(0, availableYears.indexOf(activeYear))
    : 0
  const scopedPois = useMemo(() => {
    if (effectiveMode === "all") {
      return validPois
    }

    if (!activeYear) {
      return []
    }

    return validPois.filter(
      (poi) => getCampusPoiMediaCountForYear(poi, activeYear) > 0
    )
  }, [activeYear, effectiveMode, validPois])
  const displayedPois = useMemo(
    () => (hideAllPois ? [] : scopedPois),
    [hideAllPois, scopedPois]
  )
  const selectedPoi =
    selectedPoiKey === null
      ? null
      : (validPois.find((poi) => campusPoiKey(poi) === selectedPoiKey) ?? null)
  const mapShellClasses = mergeClassName(
    "portal-map-shell relative isolate z-0 overflow-hidden",
    mapShellClassName
  )

  const setMode = useCallback(
    (nextMode: CampusPoiMapMode) => {
      setInternalMode(nextMode)
      onModeChange?.(nextMode)
      setNearestOpen(false)
    },
    [onModeChange]
  )

  const setYear = useCallback(
    (year: number | null) => {
      setInternalYear(year)
      onSelectedYearChange?.(year)
      setNearestOpen(false)
    },
    [onSelectedYearChange]
  )

  const handleReturnCenter = useCallback(() => {
    if (!window.TMap || !mapRef.current) {
      return
    }

    const center = new window.TMap.LatLng(
      BUAA_CAMPUS_CENTER.lat,
      BUAA_CAMPUS_CENTER.lng
    )
    if (mapRef.current.panTo) {
      mapRef.current.panTo(center)
    } else {
      mapRef.current.setCenter(center)
    }
    mapRef.current.setZoom(16)
  }, [])

  const selectPoi = useCallback(
    (poi: TPoi) => {
      onPoiSelect?.(poi)
    },
    [onPoiSelect]
  )

  const handleMapClick = useCallback(
    (event: TencentMapClickEvent) => {
      if (!hideAllPois || !event.latLng) {
        return
      }

      const clickPoint = {
        lat: event.latLng.getLat(),
        lng: event.latLng.getLng(),
      }
      const sourcePois = scopedPois.length ? scopedPois : validPois
      const nearest = sourcePois
        .map((poi) => ({
          poi,
          distance: getCampusPoiDistanceMeters(clickPoint, {
            lat: Number(poi.latitude),
            lng: Number(poi.longitude),
          }),
          mediaCount: getCampusPoiMediaCountForMode(
            poi,
            effectiveMode,
            activeYear
          ),
        }))
        .sort((a, b) => a.distance - b.distance)
        .slice(0, CAMPUS_NEAREST_POI_LIMIT)

      setNearestPois(nearest)
      setNearestOpen(true)
    },
    [activeYear, effectiveMode, hideAllPois, scopedPois, validPois]
  )

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
          center: new TMap.LatLng(
            BUAA_CAMPUS_CENTER.lat,
            BUAA_CAMPUS_CENTER.lng
          ),
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
        `poi-${campusPoiKey(poi)}`,
        new TMap.MarkerStyle({
          width: 40,
          height: 48,
          anchor: new TMap.Point(20, 44),
          src: markerSvg({
            active: campusPoiKey(poi) === selectedPoiKey,
            count: getCampusPoiMediaCountForMode(
              poi,
              effectiveMode,
              activeYear
            ),
            status: poi.status,
          }),
        }),
      ])
    )
    const geometries = displayedPois.map((poi) => ({
      id: campusPoiKey(poi),
      styleId: `poi-${campusPoiKey(poi)}`,
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
      const nextPoiId =
        event.geometry?.properties?.poiId ??
        event.geometry?.properties?.id ??
        event.geometry?.id
      const poi = validPois.find(
        (item) => campusPoiKey(item) === String(nextPoiId)
      )
      if (poi) {
        selectPoi(poi)
      }
    }
    markerLayer.on("click", handleMarkerClick)
    markerLayerRef.current = markerLayer

    return () => {
      markerLayer.off?.("click", handleMarkerClick)
      markerLayer.setMap?.(null)
    }
  }, [
    activeYear,
    displayedPois,
    effectiveMode,
    mapKey,
    mapReady,
    selectPoi,
    selectedPoiKey,
    validPois,
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
  }, [handleMapClick, mapReady])

  useEffect(() => {
    if (!focusSelectedPoi || !selectedPoi || !window.TMap || !mapRef.current) {
      return
    }

    const latitude = Number(selectedPoi.latitude)
    const longitude = Number(selectedPoi.longitude)
    mapRef.current.setCenter(new window.TMap.LatLng(latitude, longitude))
    mapRef.current.setZoom(focusZoom)
  }, [focusSelectedPoi, focusZoom, selectedPoi])

  useEffect(() => {
    const map = mapRef.current

    return () => {
      map?.destroy?.()
      markerLayerRef.current = null
      mapRef.current = null
    }
  }, [])

  return (
    <div className={`grid gap-4 ${className}`}>
      <div className="grid gap-3 border bg-background p-3 font-mono">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <CalendarDays className="size-4" />
              地图浏览
            </div>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              {loading
                ? "正在从后端加载 POI 数据。"
                : effectiveMode === "all"
                  ? `当前显示全部 ${validPois.length} 个 POI。`
                  : `当前显示 ${activeYear ?? "?"} 年有影像记录的 ${scopedPois.length} 个 POI。`}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant={effectiveMode === "all" ? "default" : "outline"}
              size="sm"
              className="w-fit rounded-none font-mono"
              onClick={() => setMode("all")}
            >
              <MapPin data-icon="inline-start" />
              全部 POI
            </Button>
            <Button
              type="button"
              variant={effectiveMode === "timeline" ? "default" : "outline"}
              size="sm"
              className="w-fit rounded-none font-mono"
              onClick={() => setMode("timeline")}
            >
              <CalendarDays data-icon="inline-start" />
              时间轴
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
            disabled={
              effectiveMode !== "timeline" || availableYears.length <= 1
            }
            className="h-2 w-full cursor-pointer accent-primary disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="选择地图影像年代"
            onChange={(event) => {
              const nextYear = availableYears[Number(event.target.value)]
              if (nextYear) {
                setYear(nextYear)
              }
            }}
          />
          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <span>{availableYears[0] ?? "?"}</span>
            <span className="font-semibold text-foreground">
              {effectiveMode === "all" ? "全部" : (activeYear ?? "?")}
            </span>
            <span>{availableYears[availableYears.length - 1] ?? "?"}</span>
          </div>
        </div>

        {dataError ? (
          <div className="border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            POI 数据加载失败：{dataError}
          </div>
        ) : null}

        {hideAllPois ? (
          <div className="flex items-center gap-2 border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
            <Navigation className="size-4 shrink-0" />
            POI 标记已隐藏，点击地图任意位置会展示
            {effectiveMode === "all" ? "全部 POI" : "当前年代"}附近的点位。
          </div>
        ) : null}
      </div>

      <div className={mapShellClasses}>
        {mapKey ? (
          <div ref={containerRef} className="relative z-0 size-full" />
        ) : (
          <div className="grid size-full place-items-center text-center text-sm text-muted-foreground">
            <span>{mapUnavailableText}</span>
          </div>
        )}

        {error ? (
          <div className="absolute top-3 left-3 z-10 max-w-[min(22rem,calc(100%-1.5rem))] border bg-background/95 p-3 text-xs text-muted-foreground shadow-sm">
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
            {loading ? "正在加载后端 POI 数据..." : emptyText}
          </div>
        ) : null}
      </div>

      <Dialog open={nearestOpen} onOpenChange={setNearestOpen}>
        <DialogContent className="max-h-[90svh] overflow-hidden rounded-none font-mono sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{nearestTitle}</DialogTitle>
            <DialogDescription>
              {effectiveMode === "all" ? "全部 POI" : `${activeYear ?? "?"} 年`}
              视图下，距离点击位置最近的 {nearestPois.length} 个 POI。
            </DialogDescription>
          </DialogHeader>
          {nearestPois.length ? (
            <div className="grid max-h-[min(62svh,34rem)] gap-3 overflow-y-auto pr-1">
              {nearestPois.map((item) =>
                renderNearestItem ? (
                  <div key={campusPoiKey(item.poi)}>
                    {renderNearestItem(item, {
                      selectPoi: () => {
                        setNearestOpen(false)
                        selectPoi(item.poi)
                      },
                      formatDistance: formatCampusPoiDistance,
                    })}
                  </div>
                ) : (
                  <button
                    key={campusPoiKey(item.poi)}
                    type="button"
                    className="grid gap-1 border p-3 text-left transition-colors hover:border-primary/70 hover:bg-accent/40"
                    onClick={() => {
                      setNearestOpen(false)
                      selectPoi(item.poi)
                    }}
                  >
                    <span className="flex items-center justify-between gap-3">
                      <span className="truncate font-semibold">
                        {item.poi.name}
                      </span>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {formatCampusPoiDistance(item.distance)}
                      </span>
                    </span>
                    <span className="line-clamp-2 text-sm leading-5 text-muted-foreground">
                      {item.mediaCount} 张影像 · {item.poi.description || "?"}
                    </span>
                  </button>
                )
              )}
            </div>
          ) : (
            <div className="grid min-h-28 place-items-center border bg-muted/20 text-sm text-muted-foreground">
              当前视图暂无可匹配的 POI
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
