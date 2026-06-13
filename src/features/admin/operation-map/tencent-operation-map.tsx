import { CampusPoiMap } from "@/components/campus-poi-map"
import type { AdminMapPoi } from "@/api/admin"

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
  return (
    <CampusPoiMap
      mapKey={mapKey}
      pois={pois}
      selectedPoiId={selectedPoi?.id ?? null}
      onPoiSelect={onSelectPoi}
      mapShellClassName="relative h-140 w-full overflow-hidden border bg-muted/30"
      mapUnavailableText="腾讯地图 Key 未配置，请确认后端 /admin/map/config 或 .env 中的地图 Key。"
      emptyText="当前筛选暂无可展示的 POI，请调整左侧搜索条件或切换地图模式。"
      nearestTitle="附近运营点位"
    />
  )
}
