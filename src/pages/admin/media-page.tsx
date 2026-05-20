import { useMemo, useState } from "react"
import { ImageOff, Search } from "lucide-react"

import { StatusBadge } from "@/components/admin/shared"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
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
import type { MediaRecord, ReviewStatus } from "@/mocks/admin"

const typeOptions = [
  { value: "all", label: "全部类型" },
  { value: "official", label: "官方内容" },
  { value: "ugc", label: "UGC" },
]

const statusOptions = [
  { value: "all", label: "全部状态" },
  { value: "approved", label: "已通过" },
  { value: "pending", label: "待审核" },
  { value: "rejected", label: "已驳回" },
]

const typeLabel: Record<string, string> = {
  OFFICIAL: "官方内容",
  UGC: "UGC",
}

function formatStatus(status: ReviewStatus) {
  return status.toLowerCase()
}

function MediaPreview({ item }: { item: MediaRecord }) {
  const src = item.previewUrl || item.imagePath

  if (!src) {
    return (
      <div className="grid aspect-[4/3] w-24 place-items-center border bg-muted text-muted-foreground">
        <ImageOff className="size-5" />
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={item.description || item.poiName}
      className="aspect-[4/3] w-24 border bg-muted object-cover"
      loading="lazy"
    />
  )
}

export function MediaPage({ items }: { items: MediaRecord[] }) {
  const [keyword, setKeyword] = useState("")
  const [type, setType] = useState("all")
  const [status, setStatus] = useState("all")

  const filteredItems = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase()

    return items.filter((item) => {
      const matchesType = type === "all" || item.type.toLowerCase() === type
      const matchesStatus =
        status === "all" || formatStatus(item.reviewStatus) === status
      const searchable = [
        item.id,
        item.poiId,
        item.poiName,
        item.type,
        item.year,
        item.description,
        item.imagePath,
        item.previewUrl,
        item.uploader,
        item.reviewer,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()

      return (
        matchesType &&
        matchesStatus &&
        (!normalizedKeyword || searchable.includes(normalizedKeyword))
      )
    })
  }, [items, keyword, status, type])

  return (
    <Card className="rounded-none shadow-none">
      <CardHeader className="gap-4 lg:grid-cols-[1fr_auto]">
        <div className="grid gap-1.5">
          <CardTitle>全部媒体记录</CardTitle>
          <p className="text-sm text-muted-foreground">
            接入 GET /api/v1/admin/media，展示官方内容与 UGC 影像。
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="搜索 ID、POI、描述、路径"
              className="w-full rounded-none pl-9 sm:w-72"
            />
          </div>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger className="w-full rounded-none sm:w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {typeOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-full rounded-none sm:w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="px-0">
        <Table className="table-fixed">
          <TableHeader>
            <TableRow>
              <TableHead className="w-32 pl-6">预览</TableHead>
              <TableHead className="w-52">POI / ID</TableHead>
              <TableHead className="w-36">类型 / 年份</TableHead>
              <TableHead>描述 / 路径</TableHead>
              <TableHead className="w-32">状态</TableHead>
              <TableHead className="w-40">上传 / 审核</TableHead>
              <TableHead className="w-44 pr-6">时间</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredItems.length ? (
              filteredItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="pl-6">
                    <MediaPreview item={item} />
                  </TableCell>
                  <TableCell className="whitespace-normal">
                    <div className="line-clamp-2 font-medium">
                      {item.poiName}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      媒体 {item.id} · POI {item.poiId}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">
                      {typeLabel[item.type] || item.type}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {item.year}
                    </div>
                  </TableCell>
                  <TableCell className="whitespace-normal">
                    <p className="line-clamp-2">{item.description}</p>
                    {item.rejectReason ? (
                      <p className="mt-1 line-clamp-1 text-xs text-destructive">
                        驳回原因：{item.rejectReason}
                      </p>
                    ) : null}
                    <p className="mt-1 truncate text-xs text-muted-foreground">
                      {item.imagePath || item.previewUrl || "无媒体路径"}
                    </p>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col items-start gap-1">
                      <StatusBadge status={item.reviewStatus} />
                      <StatusBadge status={item.publishStatus} />
                    </div>
                  </TableCell>
                  <TableCell className="whitespace-normal">
                    <div className="line-clamp-1">
                      {item.uploader || "官方导入"}
                    </div>
                    <div className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                      {item.reviewer || "未审核"}
                    </div>
                  </TableCell>
                  <TableCell className="pr-6 text-xs text-muted-foreground">
                    <div>创建：{item.createdAt}</div>
                    <div className="mt-1">更新：{item.updatedAt}</div>
                    {item.reviewTime ? (
                      <div className="mt-1">审核：{item.reviewTime}</div>
                    ) : null}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="h-28 text-center text-muted-foreground"
                >
                  暂无匹配的媒体记录
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
