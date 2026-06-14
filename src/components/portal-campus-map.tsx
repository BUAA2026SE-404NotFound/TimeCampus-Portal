import { useEffect, useMemo, useState } from "react"
import { MapPin } from "lucide-react"

import {
  ImagePreviewDialog,
  type ImagePreviewState,
} from "@/components/image-preview-dialog"
import { CampusPoiMap } from "@/components/campus-poi-map"
import {
  getCampusPoiAvailableYears,
  getCampusPoiMediaForYear,
  type CampusPoiMapMode,
  type CampusPoiNearestItem,
} from "@/components/campus-poi-map-utils"
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

type PortalPoi = Omit<PublicMapPoi, "mediaList"> & {
  latitude: number
  longitude: number
  mediaList: PublicMapMedia[]
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

export function PortalCampusMap() {
  const [selectedPoiId, setSelectedPoiId] = useState<number | null>(null)
  const [mapMode, setMapMode] = useState<CampusPoiMapMode>("all")
  const [selectedYear, setSelectedYear] = useState<number | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [poiLoading, setPoiLoading] = useState(true)
  const [poiError, setPoiError] = useState("")
  const [portalPois, setPortalPois] = useState<PortalPoi[]>([])
  const [preview, setPreview] = useState<ImagePreviewState | null>(null)
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
    let cancelled = false

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

  function openPoiDetail(poi: PortalPoi) {
    setSelectedPoiId(Number(poi.id))
    setDetailOpen(true)
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
    const src = media ? mediaImageSource(item.poi, media) : undefined

    return (
      <button
        type="button"
        className="grid grid-cols-[84px_1fr] items-center gap-3 border p-2 text-left transition-colors hover:border-primary/70 hover:bg-accent/40"
        onClick={actions.selectPoi}
      >
        <ProgressiveImage
          src={src}
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
            {media?.description || item.poi.description || "?"}
          </span>
        </span>
      </button>
    )
  }

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
        <CardContent>
          <CampusPoiMap
            mapKey={mapKey}
            pois={portalPois}
            selectedPoiId={selectedPoiId}
            mode={mapMode}
            onModeChange={setMapMode}
            selectedYear={selectedYear}
            onSelectedYearChange={setSelectedYear}
            onPoiSelect={openPoiDetail}
            loading={poiLoading}
            dataError={poiError}
            mapShellClassName="portal-map-shell relative isolate mx-auto aspect-square w-full max-w-5xl overflow-hidden border bg-muted/30"
            emptyText="当前视图暂无可展示的 POI 影像，请切换显示模式或拖动年代滑动条查看其他时间点。"
            nearestTitle="附近影像点位"
            renderNearestItem={renderNearestItem}
          />
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
                  {mapMode === "all" ? "全部年代" : `${activeYear ?? "?"} 年`}
                  影像 · {selectedPoi.description || "?"}
                </DialogDescription>
              </DialogHeader>
              <PoiDetailCard
                poi={selectedPoi}
                years={selectedYears}
                activeYear={activeYear}
                mediaList={selectedMedia}
                onPreview={setPreview}
                compact
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
