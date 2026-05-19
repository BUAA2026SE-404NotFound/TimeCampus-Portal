import type {
  MapPoiSearchResult,
  MapReverseGeocodeResult,
  MapToolPoi,
} from "@/api/admin"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { textOr } from "@/lib/text"

export function ReverseGeocodeResult({
  result,
}: {
  result: MapReverseGeocodeResult | null
}) {
  const address =
    textOr(result?.result?.formatted_addresses?.recommend, "") ||
    textOr(result?.result?.address, "暂无查询结果")
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
              textOr(component?.province, ""),
              textOr(component?.city, ""),
              textOr(component?.district, ""),
              textOr(component?.street, ""),
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

export function PoiSearchResult({
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
            ? `${textOr(result.region?.title, "指定区域")} · 共 ${result.count ?? result.data?.length ?? 0} 条，展示前 ${result.data?.slice(0, 12).length ?? 0} 条`
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
                {textOr(item.title, `腾讯 POI #${item.id || index + 1}`)}
              </p>
              <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                {textOr(item.address, "暂无地址")}
              </p>
            </div>
            <Badge variant="outline" className="shrink-0 rounded-none">
              {textOr(item.ad_info?.district, "未知区县")}
            </Badge>
          </div>
          <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
            <span>{textOr(item.category, "未分类")}</span>
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
