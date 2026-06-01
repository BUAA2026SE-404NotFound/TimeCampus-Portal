import { useEffect, useMemo, useRef, useState } from "react"
import { LocateFixed, MapPin } from "lucide-react"

import {
  ImagePreviewDialog,
  type ImagePreviewState,
} from "@/components/image-preview-dialog"
import { ProgressiveImage } from "@/components/progressive-image"
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
  type TencentMarkerClickEvent,
  type TencentMarkerLayer,
} from "@/lib/tencent-map"
import {
  hardcodedPortalPois,
  localPortalImageForPoi,
  type PortalPoi,
} from "@/data/portal-map-data"

const BUAA_CENTER = { lat: 39.981292, lng: 116.348026 }
const BUAA_BOUNDS = {
  southWest: { lat: 39.9766, lng: 116.3425 },
  northEast: { lat: 39.9877, lng: 116.3562 },
}

function isValidPoi(poi: PortalPoi) {
  return (
    Number.isFinite(Number(poi.latitude)) &&
    Number.isFinite(Number(poi.longitude))
  )
}

function markerSvg(poi: PortalPoi, active: boolean) {
  const fill = active ? "#003a70" : "#0f6cae"
  const count = String(poi.mediaList?.length ?? 0)
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
  const [detailOpen, setDetailOpen] = useState(false)
  const [mapReady, setMapReady] = useState(false)
  const [error, setError] = useState("")
  const [preview, setPreview] = useState<ImagePreviewState | null>(null)
  const mapKey = import.meta.env.VITE_TENCENT_MAP_KEY || ""

  const validPois = useMemo(() => hardcodedPortalPois.filter(isValidPoi), [])
  const selectedPoi = validPois.find((poi) => poi.id === selectedPoiId) ?? null
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
    if (!validPois.some((poi) => poi.id === poiId)) {
      return
    }

    setSelectedPoiId(poiId)
    setDetailOpen(true)
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

    if (!validPois.length) {
      return
    }

    const TMap = window.TMap
    const styles = Object.fromEntries(
      validPois.map((poi) => [
        `poi-${poi.id}`,
        new TMap.MarkerStyle({
          width: 40,
          height: 48,
          anchor: new TMap.Point(20, 44),
          src: markerSvg(poi, poi.id === selectedPoi?.id),
        }),
      ])
    )
    const geometries = validPois.map((poi) => ({
      id: String(poi.id),
      styleId: `poi-${poi.id}`,
      position: new TMap.LatLng(Number(poi.latitude), Number(poi.longitude)),
      properties: { poiId: poi.id },
    }))

    const markerLayer = new TMap.MultiMarker({
      map: mapRef.current,
      styles,
      geometries,
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
  }, [mapKey, mapReady, selectedPoi?.id, validPois])

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
            腾讯地图卫星底图与用户端可见 POI，点击点位查看地点影像。
          </CardDescription>
        </CardHeader>
        <CardContent>
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
                  {selectedPoi.description || "?"}
                </DialogDescription>
              </DialogHeader>
              <PoiDetailCard
                poi={selectedPoi}
                years={selectedYears}
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
  return media.imagePath.startsWith("http")
    ? media.imagePath
    : localPortalImageForPoi(poi.name, media.id)
}

function PoiDetailCard({
  poi,
  years,
  onPreview,
  compact = false,
}: {
  poi: PortalPoi
  years: string[]
  onPreview: (preview: ImagePreviewState | null) => void
  compact?: boolean
}) {
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
            <span key={year} className="border px-2 py-1">
              {year}
            </span>
          ))
        ) : (
          <span className="border px-2 py-1">暂无年代影像</span>
        )}
      </div>

      {poi.mediaList.length ? (
        <div className="grid max-h-[min(48svh,28rem)] gap-3 overflow-y-auto pr-1">
          {poi.mediaList.map((media) => {
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
          暂无关联影像
        </div>
      )}
    </div>
  )
}
