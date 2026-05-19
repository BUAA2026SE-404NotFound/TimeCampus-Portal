import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { MapPinned, RefreshCcw, Search } from "lucide-react"
import { toast } from "sonner"

import {
  getAdminMapConfig,
  getAdminMapOverview,
  reverseGeocode,
  searchMapPois,
  type AdminMapComment,
  type AdminMapFavorite,
  type AdminMapMedia,
  type AdminMapOverview,
  type AdminMapPoi,
  type MapPoiSearchResult,
  type MapReverseGeocodeResult,
  type MapToolPoi,
} from "@/api/admin"
import { StatusBadge } from "@/components/admin/shared"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { AdminSnapshot } from "@/api/admin"

type TMapNamespace = {
  Map: new (container: HTMLElement, options: Record<string, unknown>) => TencentMap
  LatLng: new (lat: number, lng: number) => unknown
  MultiMarker: new (options: Record<string, unknown>) => TencentMarkerLayer
  MarkerStyle: new (options: Record<string, unknown>) => unknown
  Point: new (x: number, y: number) => unknown
}

type TencentMap = {
  setCenter: (center: unknown) => void
  setZoom: (zoom: number) => void
  destroy?: () => void
}

type TencentMarkerLayer = {
  setMap?: (map: TencentMap | null) => void
  on: (event: string, handler: (event: TencentMarkerClickEvent) => void) => void
}

type TencentMarkerClickEvent = {
  geometry?: {
    id?: string
    properties?: {
      poiId?: number | string
    }
  }
}

declare global {
  interface Window {
    TMap?: TMapNamespace
    __timeCampusTencentMapPromise?: Promise<TMapNamespace>
  }
}

const BUAA_CENTER = { lat: 39.981292, lng: 116.348026 }

function loadTencentMap(key: string) {
  if (window.TMap) {
    return Promise.resolve(window.TMap)
  }

  if (window.__timeCampusTencentMapPromise) {
    return window.__timeCampusTencentMapPromise
  }

  window.__timeCampusTencentMapPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script")
    script.src = `https://map.qq.com/api/gljs?v=1.exp&key=${encodeURIComponent(key)}`
    script.async = true
    script.onload = () => {
      if (window.TMap) {
        resolve(window.TMap)
        return
      }

      reject(new Error("腾讯地图脚本加载完成但 TMap 不可用"))
    }
    script.onerror = () => reject(new Error("腾讯地图脚本加载失败"))
    document.head.appendChild(script)
  })

  return window.__timeCampusTencentMapPromise
}

function markerSvg(poi: AdminMapPoi) {
  const active = poi.status === 1
  const fill = active ? "#171717" : "#7b8794"
  const stroke = active ? "#000000" : "#5d6672"
  const count = String(poi.favoriteCount || 0)
  const safeCount = count.length > 2 ? "99+" : count
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="38" height="46" viewBox="0 0 38 46">
      <path fill="${fill}" stroke="${stroke}" stroke-width="2" d="M19 44C14.2 36.6 5 28.2 5 18.5 5 10.5 11.3 4 19 4s14 6.5 14 14.5C33 28.2 23.8 36.6 19 44Z"/>
      <circle cx="19" cy="18.5" r="10.5" fill="#fff"/>
      <text x="19" y="23" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" font-weight="700" fill="${fill}">${safeCount}</text>
    </svg>`

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`
}

function poiPosition(poi: AdminMapPoi) {
  return { lat: Number(poi.latitude), lng: Number(poi.longitude) }
}

function isValidPoi(poi: AdminMapPoi) {
  return Number.isFinite(Number(poi.latitude)) && Number.isFinite(Number(poi.longitude))
}

function hasReadableText(value?: string | null) {
  const text = repairMojibake(value)?.trim()
  if (!text) {
    return false
  }

  const compact = text.replace(/\s/g, "")
  if (/^[?？�]+$/.test(compact)) {
    return false
  }

  const brokenCount = [...compact].filter((char) => char === "?" || char === "�")
    .length
  if (brokenCount / compact.length > 0.35) {
    return false
  }

  if (/[ÃÂ]/.test(text)) {
    return false
  }

  return !(/[åäæ]/.test(text) && !/[\u4e00-\u9fff]/.test(text));


}

function displayText(value: string | null | undefined, fallback: string) {
  const repaired = repairMojibake(value)

  return hasReadableText(repaired) ? repaired!.trim() : fallback
}

function repairMojibake(value?: string | null) {
  if (!value) {
    return value
  }

  if (!/[ÃÂåäæèéç]/.test(value)) {
    return value
  }

  try {
    const bytes = Uint8Array.from([...value].map((char) => char.charCodeAt(0)))
    const decoded = new TextDecoder("utf-8", { fatal: true }).decode(bytes)

    return /[\u4e00-\u9fff]/.test(decoded) ? decoded : value
  } catch {
    return value
  }
}

function poiName(poi: AdminMapPoi) {
  return displayText(poi.name, `POI #${poi.id}`)
}

function poiDescription(poi: AdminMapPoi) {
  return displayText(poi.description, "暂无可读简介")
}

function userName(item: AdminMapFavorite | AdminMapComment) {
  return displayText(item.nickname, item.userId ? `用户 #${item.userId}` : "匿名用户")
}

function targetName(item: AdminMapFavorite | AdminMapComment) {
  const type = item.targetType || "target"
  const id = item.targetId ?? item.relatedPoiId ?? "-"

  return displayText(item.targetName, `${type} #${id}`)
}

function commentContent(comment: AdminMapComment) {
  return displayText(comment.content, "评论内容不可读")
}

function mediaDescription(media: AdminMapMedia) {
  return displayText(media.description, "暂无可读说明")
}

function TencentOperationMap({
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
      ]),
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
    markerLayer.on("click", (event) => {
      const poiId = Number(event.geometry?.properties?.poiId ?? event.geometry?.id)
      const poi = validPois.find((item) => Number(item.id) === poiId)
      if (poi) {
        onSelectPoi(poi)
      }
    })
    markerLayerRef.current = markerLayer
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
    return () => {
      markerLayerRef.current?.setMap?.(null)
      mapRef.current?.destroy?.()
      markerLayerRef.current = null
      mapRef.current = null
    }
  }, [])

  if (!mapKey) {
    return (
      <div className="grid h-[560px] place-items-center border bg-muted/30 text-center">
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
      <div ref={containerRef} className="h-[560px] w-full bg-muted/30" />
      <div className="absolute bottom-3 left-3 flex flex-wrap gap-3 border bg-background/95 px-3 py-2 text-xs shadow-sm">
        <span className="inline-flex items-center gap-1.5">
          <i className="size-2.5 rounded-full bg-primary" />
          上架 POI
        </span>
        <span className="inline-flex items-center gap-1.5">
          <i className="size-2.5 rounded-full bg-muted-foreground" />
          下架 POI
        </span>
        <span className="text-muted-foreground">Marker 数字表示收藏数</span>
      </div>
    </div>
  )
}

export function MapToolsPage() {
  const [lat, setLat] = useState("39.981292")
  const [lng, setLng] = useState("116.348026")
  const [keyword, setKeyword] = useState("北京航空航天大学新主楼")
  const [region, setRegion] = useState("北京市海淀区")
  const [reverseResult, setReverseResult] =
    useState<MapReverseGeocodeResult | null>(null)
  const [searchResult, setSearchResult] = useState<MapPoiSearchResult | null>(
    null,
  )
  const [reverseLoading, setReverseLoading] = useState(false)
  const [searchLoading, setSearchLoading] = useState(false)

  async function handleReverseGeocode() {
    const latitude = Number(lat)
    const longitude = Number(lng)

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      toast.error("请输入有效的经纬度")
      return
    }

    setReverseLoading(true)
    try {
      setReverseResult(await reverseGeocode(latitude, longitude))
      toast.success("逆地理编码完成")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "逆地理编码失败")
    } finally {
      setReverseLoading(false)
    }
  }

  async function handlePoiSearch() {
    if (!keyword.trim()) {
      toast.error("请输入搜索关键字")
      return
    }

    setSearchLoading(true)
    try {
      setSearchResult(await searchMapPois(keyword.trim(), region.trim()))
      toast.success("POI 搜索完成")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "POI 搜索失败")
    } finally {
      setSearchLoading(false)
    }
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[380px_1fr]">
      <Card className="rounded-none shadow-none">
        <CardHeader>
          <CardTitle>逆地理编码</CardTitle>
          <CardDescription>
            地图工具接口后端封装，SecretKey 不进入前端。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="reverse-lat">纬度</FieldLabel>
                <Input
                  id="reverse-lat"
                  value={lat}
                  onChange={(event) => setLat(event.target.value)}
                  className="rounded-none"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="reverse-lng">经度</FieldLabel>
                <Input
                  id="reverse-lng"
                  value={lng}
                  onChange={(event) => setLng(event.target.value)}
                  className="rounded-none"
                />
              </Field>
            </div>
            <Button
              className="rounded-none font-mono"
              disabled={reverseLoading}
              onClick={handleReverseGeocode}
            >
              <MapPinned data-icon="inline-start" />
              {reverseLoading ? "查询中" : "查询地址"}
            </Button>
          </FieldGroup>
        </CardContent>
        <Separator />
        <CardHeader>
          <CardTitle>POI 搜索</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Input
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            className="rounded-none"
            placeholder="keyword"
          />
          <Input
            value={region}
            onChange={(event) => setRegion(event.target.value)}
            className="rounded-none"
            placeholder="region"
          />
          <Button
            variant="outline"
            className="rounded-none font-mono"
            disabled={searchLoading}
            onClick={handlePoiSearch}
          >
            <Search data-icon="inline-start" />
            {searchLoading ? "搜索中" : "搜索"}
          </Button>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-4">
        <ReverseGeocodeResult result={reverseResult} />
        <PoiSearchResult result={searchResult} keyword={keyword} />
      </div>
    </div>
  )
}

function ReverseGeocodeResult({
  result,
}: {
  result: MapReverseGeocodeResult | null
}) {
  const address =
    displayText(result?.result?.formatted_addresses?.recommend, "") ||
    displayText(result?.result?.address, "暂无查询结果")
  const component = result?.result?.address_component
  const nearbyPois = result?.result?.pois?.slice(0, 6) ?? []

  return (
    <Card className="rounded-none shadow-none">
      <CardHeader>
        <CardTitle>逆地理编码结果</CardTitle>
        <CardDescription>
          {result
            ? `${result.coordinateSystem || "GCJ02"} · ${result.result?.poi_count ?? 0} 个附近 POI`
            : "输入坐标后调用 /api/v1/map/reverse-geocode"}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="border bg-muted/20 p-4">
          <p className="text-lg font-medium">{address}</p>
          <p className="mt-2 text-sm text-muted-foreground">
            {[
              displayText(component?.province, ""),
              displayText(component?.city, ""),
              displayText(component?.district, ""),
              displayText(component?.street, ""),
            ]
              .filter(Boolean)
              .join(" / ") || "暂无行政区信息"}
          </p>
        </div>
        <ResultPoiGrid items={nearbyPois} empty="暂无附近 POI" />
      </CardContent>
    </Card>
  )
}

function PoiSearchResult({
  result,
  keyword,
}: {
  result: MapPoiSearchResult | null
  keyword: string
}) {
  return (
    <Card className="rounded-none shadow-none">
      <CardHeader>
        <CardTitle>POI 搜索结果</CardTitle>
        <CardDescription>
          {result
            ? `${displayText(result.region?.title, "指定区域")} · 共 ${result.count ?? result.data?.length ?? 0} 条，展示前 ${result.data?.slice(0, 12).length ?? 0} 条`
            : `当前关键字：${keyword || "未输入"}`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResultPoiGrid items={result?.data?.slice(0, 12) ?? []} empty="暂无搜索结果" />
      </CardContent>
    </Card>
  )
}

function ResultPoiGrid({
  items,
  empty,
}: {
  items: MapToolPoi[]
  empty: string
}) {
  if (!items.length) {
    return <p className="py-10 text-center text-sm text-muted-foreground">{empty}</p>
  }

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {items.map((item, index) => (
        <div key={item.id || index} className="border bg-background p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate font-medium">
                {displayText(item.title, `腾讯 POI #${item.id || index + 1}`)}
              </p>
              <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                {displayText(item.address, "暂无地址")}
              </p>
            </div>
            <Badge variant="outline" className="shrink-0 rounded-none">
              {displayText(item.ad_info?.district, "未知区县")}
            </Badge>
          </div>
          <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
            <span>{displayText(item.category, "未分类")}</span>
            {item._distance !== undefined && <span>{item._distance}m</span>}
            {item.tel && <span>{item.tel}</span>}
          </div>
          {item.location && (
            <p className="mt-3 text-xs text-muted-foreground">
              {item.location.lat.toFixed(6)}, {item.location.lng.toFixed(6)}
            </p>
          )}
        </div>
      ))}
    </div>
  )
}

export function OpsMapPage({ snapshot }: { snapshot: AdminSnapshot }) {
  const [loadedOverview, setLoadedOverview] = useState<AdminMapOverview | null>(
    null,
  )
  const [mapKey, setMapKey] = useState("")
  const [loading, setLoading] = useState(false)
  const [selectedPoiId, setSelectedPoiId] = useState<number | null>(
    snapshot.mapOverview.pois.find(isValidPoi)?.id ?? null,
  )
  const [query, setQuery] = useState({
    keyword: "",
    status: "all",
    commentStatus: "all",
    limit: "50",
  })

  const overview = loadedOverview ?? snapshot.mapOverview
  const validPois = useMemo(() => overview.pois.filter(isValidPoi), [overview.pois])
  const selectedPoi = useMemo(
    () =>
      validPois.find((poi) => poi.id === selectedPoiId) ?? validPois[0] ?? null,
    [selectedPoiId, validPois],
  )
  const handleSelectPoi = useCallback((poi: AdminMapPoi) => {
    setSelectedPoiId(poi.id)
  }, [])

  useEffect(() => {
    getAdminMapConfig()
      .then((config) => setMapKey(config.tencentMapKey))
      .catch(() => setMapKey(import.meta.env.TENCENT_MAP_KEY || ""))
  }, [])

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getAdminMapOverview({
        keyword: query.keyword || undefined,
        status: query.status === "all" ? undefined : Number(query.status),
        commentStatus:
          query.commentStatus === "all" ? undefined : query.commentStatus,
        limit: Number(query.limit) || 50,
      })
      setLoadedOverview(data)
      setSelectedPoiId(data.pois.filter(isValidPoi)[0]?.id ?? null)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "运营地图加载失败")
    } finally {
      setLoading(false)
    }
  }, [query.commentStatus, query.keyword, query.limit, query.status])

  useEffect(() => {
    let active = true

    queueMicrotask(() => {
      if (!active) {
        return
      }

      setLoading(true)
      getAdminMapOverview({ limit: 50 })
        .then((data) => {
          if (!active) {
            return
          }

          setLoadedOverview(data)
          setSelectedPoiId(data.pois.filter(isValidPoi)[0]?.id ?? null)
        })
        .catch((error) => {
          if (active) {
            toast.error(error instanceof Error ? error.message : "运营地图加载失败")
          }
        })
        .finally(() => {
          if (active) {
            setLoading(false)
          }
        })
    })

    return () => {
      active = false
    }
  }, [])

  return (
    <div className="flex flex-col gap-4">
      <Card className="rounded-none shadow-none">
        <CardHeader>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle>运营地图</CardTitle>
              <CardDescription>
                腾讯地图底图 + POI 运营数据联动浏览，点击 marker 查看分栏详情。
              </CardDescription>
            </div>
            <Button
              className="rounded-none font-mono"
              onClick={loadData}
              disabled={loading}
            >
              <RefreshCcw data-icon="inline-start" />
              {loading ? "刷新中" : "刷新"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid gap-3 md:grid-cols-[1fr_160px_170px_120px_auto]">
            <Input
              value={query.keyword}
              onChange={(event) =>
                setQuery((current) => ({
                  ...current,
                  keyword: event.target.value,
                }))
              }
              className="rounded-none"
              placeholder="POI 名称"
            />
            <Select
              value={query.status}
              onValueChange={(value) =>
                setQuery((current) => ({ ...current, status: value }))
              }
            >
              <SelectTrigger className="w-full rounded-none">
                <SelectValue placeholder="POI 状态" />
              </SelectTrigger>
              <SelectContent className="rounded-none">
                <SelectGroup>
                  <SelectItem value="all">全部状态</SelectItem>
                  <SelectItem value="1">上架</SelectItem>
                  <SelectItem value="0">下架</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
            <Select
              value={query.commentStatus}
              onValueChange={(value) =>
                setQuery((current) => ({ ...current, commentStatus: value }))
              }
            >
              <SelectTrigger className="w-full rounded-none">
                <SelectValue placeholder="评论状态" />
              </SelectTrigger>
              <SelectContent className="rounded-none">
                <SelectGroup>
                  <SelectItem value="all">全部评论</SelectItem>
                  <SelectItem value="pending">待审核</SelectItem>
                  <SelectItem value="approved">已通过</SelectItem>
                  <SelectItem value="rejected">已驳回</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
            <Input
              value={query.limit}
              onChange={(event) =>
                setQuery((current) => ({ ...current, limit: event.target.value }))
              }
              className="rounded-none"
              inputMode="numeric"
            />
            <Button
              variant="outline"
              className="rounded-none font-mono"
              onClick={loadData}
            >
              <Search data-icon="inline-start" />
              查询
            </Button>
          </div>

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(380px,0.8fr)]">
            <TencentOperationMap
              mapKey={mapKey}
              pois={validPois}
              selectedPoi={selectedPoi}
              onSelectPoi={handleSelectPoi}
            />
            <PoiDetailPanel selectedPoi={selectedPoi} />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        <RecentFavoritesTable overview={overview} />
        <RecentCommentsTable overview={overview} />
      </div>
    </div>
  )
}

function PoiDetailPanel({ selectedPoi }: { selectedPoi: AdminMapPoi | null }) {
  if (!selectedPoi) {
    return (
      <Card className="min-h-[560px] rounded-none shadow-none">
        <CardContent className="grid min-h-[520px] place-items-center text-muted-foreground">
          选择一个 POI 查看详情
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="min-h-[560px] rounded-none shadow-none">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="truncate">{poiName(selectedPoi)}</CardTitle>
            <CardDescription className="mt-2">
              {poiDescription(selectedPoi)}
            </CardDescription>
          </div>
          <StatusBadge status={selectedPoi.status === 1 ? "ACTIVE" : "INACTIVE"} />
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" className="flex flex-col gap-4">
          <TabsList className="grid w-full grid-cols-4 rounded-none">
            <TabsTrigger value="overview" className="rounded-none">
              概况
            </TabsTrigger>
            <TabsTrigger value="media" className="rounded-none">
              影像
            </TabsTrigger>
            <TabsTrigger value="favorites" className="rounded-none">
              收藏
            </TabsTrigger>
            <TabsTrigger value="comments" className="rounded-none">
              评论
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-0">
            <OverviewPanel selectedPoi={selectedPoi} />
          </TabsContent>
          <TabsContent value="media" className="mt-0">
            <PanelIntro
              title="影像"
              description={`${selectedPoi.mediaList?.length ?? 0} 条关联影像`}
            />
            <MediaList items={selectedPoi.mediaList} />
          </TabsContent>
          <TabsContent value="favorites" className="mt-0">
            <PanelIntro
              title="收藏用户"
              description={`${selectedPoi.favorites?.length ?? 0} 条最近收藏记录`}
            />
            <FavoriteList items={selectedPoi.favorites} />
          </TabsContent>
          <TabsContent value="comments" className="mt-0">
            <PanelIntro
              title="评论"
              description={`${selectedPoi.comments?.length ?? 0} 条评论记录`}
            />
            <CommentList items={selectedPoi.comments} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

function OverviewPanel({ selectedPoi }: { selectedPoi: AdminMapPoi }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-2">
        {[
          ["收藏", selectedPoi.favoriteCount || 0],
          ["评论", selectedPoi.commentCount || 0],
          ["待审评论", selectedPoi.pendingCommentCount || 0],
          ["影像", selectedPoi.mediaCount || 0],
          ["UGC", selectedPoi.ugcCount || 0],
        ].map(([label, value]) => (
          <div key={label} className="border bg-muted/20 p-3">
            <b className="block text-2xl">{value}</b>
            <span className="mt-1 block text-sm text-muted-foreground">
              {label}
            </span>
          </div>
        ))}
      </div>
      <dl className="grid grid-cols-[64px_1fr] gap-x-3 gap-y-2 text-sm">
        <dt className="text-muted-foreground">POI ID</dt>
        <dd>{selectedPoi.id}</dd>
        <dt className="text-muted-foreground">纬度</dt>
        <dd>{Number(selectedPoi.latitude).toFixed(8)}</dd>
        <dt className="text-muted-foreground">经度</dt>
        <dd>{Number(selectedPoi.longitude).toFixed(8)}</dd>
      </dl>
    </div>
  )
}

function PanelIntro({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div className="mb-3">
      <h3 className="font-medium">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </div>
  )
}

function MediaList({ items }: { items?: AdminMapMedia[] }) {
  if (!items?.length) {
    return <p className="py-8 text-center text-sm text-muted-foreground">暂无影像</p>
  }

  return (
    <div className="grid max-h-96 gap-2 overflow-auto">
      {items.map((media) => (
        <div
          key={media.id}
          className="grid grid-cols-[96px_1fr] items-center gap-3 border p-2"
        >
          {media.previewUrl || media.imagePath ? (
            <img
              className="h-16 w-24 object-cover"
              src={media.previewUrl || media.imagePath}
              alt={mediaDescription(media)}
            />
          ) : (
            <div className="h-16 w-24 bg-muted" />
          )}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <b>{media.year || "-"}</b>
              <Badge variant="outline" className="rounded-none">
                {media.type || "-"}
              </Badge>
            </div>
            <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
              {mediaDescription(media)}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}

function FavoriteList({ items }: { items?: AdminMapFavorite[] }) {
  if (!items?.length) {
    return <p className="py-8 text-center text-sm text-muted-foreground">暂无收藏</p>
  }

  return (
    <div className="grid max-h-96 gap-2 overflow-auto">
      {items.map((favorite) => (
        <div key={favorite.id} className="border bg-muted/20 p-3">
          <b className="block truncate">{userName(favorite)}</b>
          <span className="mt-1 block truncate text-sm text-muted-foreground">
            {targetName(favorite)}
          </span>
          <span className="mt-2 block text-xs text-muted-foreground">
            {favorite.createTime || "-"}
          </span>
        </div>
      ))}
    </div>
  )
}

function CommentList({ items }: { items?: AdminMapComment[] }) {
  if (!items?.length) {
    return <p className="py-8 text-center text-sm text-muted-foreground">暂无评论</p>
  }

  return (
    <div className="grid max-h-96 gap-2 overflow-auto">
      {items.map((comment) => (
        <div key={comment.id} className="border bg-muted/20 p-3">
          <div className="flex items-start justify-between gap-2">
            <b className="min-w-0 truncate">{userName(comment)}</b>
            <Badge variant="outline" className="rounded-none">
              {comment.reviewStatus || "-"}
            </Badge>
          </div>
          <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">
            {commentContent(comment)}
          </p>
          <span className="mt-2 block text-xs text-muted-foreground">
            {comment.createTime || "-"}
          </span>
        </div>
      ))}
    </div>
  )
}

function RecentFavoritesTable({ overview }: { overview: AdminMapOverview }) {
  return (
    <Card className="rounded-none shadow-none">
      <CardHeader>
        <CardTitle>最近收藏</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>用户</TableHead>
              <TableHead>目标</TableHead>
              <TableHead>时间</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {overview.recentFavorites.map((favorite) => (
              <TableRow key={favorite.id}>
                <TableCell>{favorite.id}</TableCell>
                <TableCell>{userName(favorite)}</TableCell>
                <TableCell>{targetName(favorite)}</TableCell>
                <TableCell>{favorite.createTime || "-"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

function RecentCommentsTable({ overview }: { overview: AdminMapOverview }) {
  return (
    <Card className="rounded-none shadow-none">
      <CardHeader>
        <CardTitle>最近评论</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>用户</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>内容</TableHead>
              <TableHead>时间</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {overview.recentComments.map((comment) => (
              <TableRow key={comment.id}>
                <TableCell>{comment.id}</TableCell>
                <TableCell>{userName(comment)}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="rounded-none">
                    {comment.reviewStatus || "-"}
                  </Badge>
                </TableCell>
                <TableCell className="max-w-72 truncate">
                  {commentContent(comment)}
                </TableCell>
                <TableCell>{comment.createTime || "-"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
