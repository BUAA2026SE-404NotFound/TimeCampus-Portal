import { useState } from "react"
import { MapPinned, Search } from "lucide-react"
import { toast } from "sonner"

import {
  reverseGeocode,
  searchMapPois,
  type MapPoiSearchResult,
  type MapReverseGeocodeResult,
} from "@/api/admin"
import {
  PoiSearchResult,
  ReverseGeocodeResult,
} from "@/features/admin/map-tools/map-tool-results"
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

export function MapToolsPage() {
  const [lat, setLat] = useState("39.98404")
  const [lng, setLng] = useState("116.351129")
  const [keyword, setKeyword] = useState("主楼")
  const [region, setRegion] = useState("北京市")
  const [reverseResult, setReverseResult] =
    useState<MapReverseGeocodeResult | null>(null)
  const [searchResult, setSearchResult] = useState<MapPoiSearchResult | null>(
    null,
  )
  const [reverseLoading, setReverseLoading] = useState(false)
  const [searchLoading, setSearchLoading] = useState(false)

  async function handleReverseGeocode() {
    if (reverseLoading) return

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
    if (searchLoading) return

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
