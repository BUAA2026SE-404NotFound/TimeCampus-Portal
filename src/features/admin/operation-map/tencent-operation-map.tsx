import { useEffect, useMemo, useRef, useState } from "react"
import { toast } from "sonner"

import type { AdminMapPoi } from "@/api/admin"
import { isValidPoi } from "@/features/admin/operation-map/map-poi"
import {
  loadTencentMap,
  type TencentMap,
  type TencentMarkerClickEvent,
  type TencentMarkerLayer,
} from "@/lib/tencent-map"

const BUAA_CENTER = { lat: 39.981292, lng: 116.348026 }
const ACTIVE_MARKER_FILL = "#003a70"
const ACTIVE_MARKER_STROKE = "#002b5c"
const INACTIVE_MARKER_FILL = "#7b8794"
const INACTIVE_MARKER_STROKE = "#5d6672"
const MARKER_LABEL_BACKGROUND = "#f7fbff"

function markerSvg(poi: AdminMapPoi) {
  const active = poi.status === 1
  const fill = active ? ACTIVE_MARKER_FILL : INACTIVE_MARKER_FILL
  const stroke = active ? ACTIVE_MARKER_STROKE : INACTIVE_MARKER_STROKE
  const count = String(poi.favoriteCount || 0)
  const safeCount = count.length > 2 ? "99+" : count
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="38" height="46" viewBox="0 0 38 46">
      <path fill="${fill}" stroke="${stroke}" stroke-width="2" d="M19 44C14.2 36.6 5 28.2 5 18.5 5 10.5 11.3 4 19 4s14 6.5 14 14.5C33 28.2 23.8 36.6 19 44Z"/>
      <circle cx="19" cy="18.5" r="10.5" fill="${MARKER_LABEL_BACKGROUND}"/>
      <text x="19" y="23" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" font-weight="700" fill="${fill}">${safeCount}</text>
    </svg>`

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`
}

function poiPosition(poi: AdminMapPoi) {
  return { lat: Number(poi.latitude), lng: Number(poi.longitude) }
}

export function TencentOperationMap({
  mapKey,
  pois,
  selectedPoi,
  onSelectPoi,
}: {
  mapKey: string
  pois: AdminMapPoi[]
  selectedPoi: AdminMapPoi | null
  onSelectPoi: (poi: AdminMapPoi) => void
}) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<TencentMap | null>(null)
  const markerLayerRef = useRef<TencentMarkerLayer | null>(null)
  const [mapReady, setMapReady] = useState(false)
  const validPois = useMemo(() => pois.filter(isValidPoi), [pois])

  useEffect(() => {
    if (!mapKey || !containerRef.current) {
      return
    }

    let cancelled = false

    loadTencentMap(mapKey)
      .then((TMap) => {
        if (cancelled || !containerRef.current) {
          return
        }

        if (!mapRef.current) {
          mapRef.current = new TMap.Map(containerRef.current, {
            center: new TMap.LatLng(BUAA_CENTER.lat, BUAA_CENTER.lng),
            zoom: 16,
            minZoom: 14,
            maxZoom: 19,
            control: { zoom: true, scale: true, rotation: false },
            baseMap: {
              type: "satellite",
            },
          })
        }

        setMapReady(true)
      })
      .catch((error) => {
        toast.error(error instanceof Error ? error.message : "腾讯地图加载失败")
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
          width: 38,
          height: 46,
          anchor: new TMap.Point(19, 42),
          src: markerSvg(poi),
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
        event.geometry?.properties?.poiId ?? event.geometry?.id
      )
      const poi = validPois.find((item) => Number(item.id) === poiId)
      if (poi) {
        onSelectPoi(poi)
      }
    }
    markerLayer.on("click", handleMarkerClick)
    markerLayerRef.current = markerLayer

    return () => {
      markerLayer.off?.("click", handleMarkerClick)
      markerLayer.setMap?.(null)
    }
  }, [mapKey, mapReady, onSelectPoi, validPois])

  useEffect(() => {
    if (!selectedPoi || !window.TMap || !mapRef.current) {
      return
    }

    const position = poiPosition(selectedPoi)
    mapRef.current.setCenter(new window.TMap.LatLng(position.lat, position.lng))
    mapRef.current.setZoom(17)
  }, [selectedPoi])

  useEffect(() => {
    const map = mapRef.current

    return () => {
      map?.destroy?.()
      mapRef.current = null
      markerLayerRef.current = null
    }
  }, [])

  if (!mapKey) {
    return (
      <div className="grid h-140 place-items-center border bg-muted/30 text-center">
        <div className="flex flex-col gap-2">
          <b>腾讯地图 Key 未配置</b>
          <span className="text-sm text-muted-foreground">
            请确认后端 /admin/map/config 或 .env 中的地图 Key。
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className="relative overflow-hidden border">
      <div ref={containerRef} className="h-140 w-full bg-muted/30" />
      <div className="absolute bottom-3 left-3 flex flex-wrap gap-3 border bg-background/95 px-3 py-2 text-xs shadow-sm">
        {/*<span className="inline-flex items-center gap-1.5">*/}
        {/*  <i className="size-2.5 rounded-full bg-primary" />*/}
        {/*  上架 POI*/}
        {/*</span>*/}
        {/*<span className="inline-flex items-center gap-1.5">*/}
        {/*  <i className="size-2.5 rounded-full bg-muted-foreground" />*/}
        {/*  下架 POI*/}
        {/*</span>*/}
        {/*<span className="text-muted-foreground">Marker 数字表示收藏数</span>*/}
      </div>
    </div>
  )
}
