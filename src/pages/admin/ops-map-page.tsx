import { useCallback, useEffect, useMemo, useState } from "react"
import { RefreshCcw, Search } from "lucide-react"
import { toast } from "sonner"

import {
  getAdminMapConfig,
  getAdminMapOverview,
  type AdminMapOverview,
  type AdminMapPoi,
  type AdminSnapshot,
} from "@/api/admin"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { PoiDetailPanel } from "@/features/admin/operation-map/poi-detail-panel"
import {
  RecentCommentsTable,
  RecentFavoritesTable,
} from "@/features/admin/operation-map/recent-activity-tables"
import {
  TencentOperationMap,
} from "@/features/admin/operation-map/tencent-operation-map"
import { isValidPoi } from "@/features/admin/operation-map/map-poi"

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
    limit: "",
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
      .catch(() => setMapKey(import.meta.env.VITE_TENCENT_MAP_KEY || ""))
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
          <div className="grid gap-3 md:grid-cols-[1fr_160px_170px_200px_auto]">
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
              placeholder="查询数量 (默认 50)"
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
