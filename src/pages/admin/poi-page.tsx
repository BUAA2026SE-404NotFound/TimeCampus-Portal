import { useState } from "react"
import { Search } from "lucide-react"
import { toast } from "sonner"

import { createPoi, deletePoi, updatePoi } from "@/api/admin"
import { PaginationControls } from "@/components/admin/pagination-controls"
import {
  Card,
  CardAction,
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
import {
  PoiCreateDialog,
  type PoiFormState,
} from "@/features/admin/poi/poi-create-dialog"
import { PoiTable } from "@/features/admin/poi/poi-table"
import type { Poi } from "@/types/admin"

export function PoiPage({
  pois,
  onChanged,
}: {
  pois: Poi[]
  onChanged: () => void
}) {
  const [keyword, setKeyword] = useState("")
  const [status, setStatus] = useState<"ALL" | Poi["status"]>("ALL")
  const [formOpen, setFormOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [form, setForm] = useState<PoiFormState>({
    name: "",
    latitude: "",
    longitude: "",
    description: "",
  })

  const filteredPois = pois.filter((poi) => {
    const matchesKeyword = `${poi.name}${poi.region}`
      .toLowerCase()
      .includes(keyword.toLowerCase())
    const matchesStatus = status === "ALL" || poi.status === status

    return matchesKeyword && matchesStatus
  })
  const totalPages = Math.max(1, Math.ceil(filteredPois.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const pagedPois = filteredPois.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  )

  async function handleCreate() {
    if (creating) return

    const latitude = Number(form.latitude)
    const longitude = Number(form.longitude)
    if (!form.name.trim()) {
      toast.error("请输入 POI 名称")
      return
    }
    if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
      toast.error("纬度范围应为 -90 到 90")
      return
    }
    if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
      toast.error("经度范围应为 -180 到 180")
      return
    }

    setCreating(true)
    try {
      await createPoi({
        name: form.name.trim(),
        latitude,
        longitude,
        description: form.description.trim(),
        status: 1,
      })
      toast.success("POI 已创建")
      setFormOpen(false)
      setForm({ name: "", latitude: "", longitude: "", description: "" })
      onChanged()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "创建 POI 失败")
    } finally {
      setCreating(false)
    }
  }

  async function handleDelete(id: string) {
    if (deletingId) return
    setDeletingId(id)
    try {
      await deletePoi(id)
      toast.success("POI 已删除")
      onChanged()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "删除 POI 失败")
    } finally {
      setDeletingId(null)
    }
  }

  async function handleToggleStatus(poi: Poi) {
    if (updatingId) return
    const nextStatus = poi.status === "ACTIVE" ? 0 : 1
    setUpdatingId(poi.id)
    try {
      await updatePoi(poi.id, {
        name: poi.name,
        latitude: poi.latitude,
        longitude: poi.longitude,
        description: poi.region,
        status: nextStatus,
      })
      toast.success(nextStatus === 1 ? "POI 已上架" : "POI 已下架")
      onChanged()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "更新 POI 状态失败")
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Card className="rounded-none shadow-none">
        <CardHeader>
          <CardTitle>筛选与操作</CardTitle>
          <CardDescription>
            POI 列表接入 GET /api/v1/admin/pois。
          </CardDescription>
          <CardAction>
            <PoiCreateDialog
              open={formOpen}
              form={form}
              onOpenChange={setFormOpen}
              onFormChange={setForm}
              onSubmit={handleCreate}
              submitting={creating}
            />
          </CardAction>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-[1fr_180px]">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={keyword}
              onChange={(event) => {
                setKeyword(event.target.value)
                setPage(1)
              }}
              className="rounded-none pl-9"
              placeholder="搜索 POI 或简介"
            />
          </div>
          <Select
            value={status}
            onValueChange={(value) => {
              setStatus(value as typeof status)
              setPage(1)
            }}
          >
            <SelectTrigger className="w-full rounded-none">
              <SelectValue placeholder="状态" />
            </SelectTrigger>
            <SelectContent className="rounded-none">
              <SelectGroup>
                <SelectItem value="ALL">全部状态</SelectItem>
                <SelectItem value="ACTIVE">启用</SelectItem>
                <SelectItem value="INACTIVE">停用</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <PoiTable
        pois={pagedPois}
        onDelete={handleDelete}
        onToggleStatus={handleToggleStatus}
        deletingId={deletingId}
        updatingId={updatingId}
      />
      <PaginationControls
        page={currentPage}
        pageSize={pageSize}
        total={filteredPois.length}
        onPageChange={setPage}
        onPageSizeChange={(value) => {
          setPageSize(value)
          setPage(1)
        }}
      />
    </div>
  )
}
