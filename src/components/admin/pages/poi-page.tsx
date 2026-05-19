import { useState } from "react"
import { Plus, Search, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { createPoi, deletePoi } from "@/api/admin"
import { EmptyTableRow, StatusBadge } from "@/components/admin/shared"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { Poi } from "@/mocks/admin"

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
  const [form, setForm] = useState({
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

  async function handleCreate() {
    try {
      await createPoi({
        name: form.name,
        latitude: Number(form.latitude),
        longitude: Number(form.longitude),
        description: form.description,
        status: 1,
      })
      toast.success("POI 已创建")
      setFormOpen(false)
      onChanged()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "创建 POI 失败")
    }
  }

  async function handleDelete(id: string) {
    try {
      await deletePoi(id)
      toast.success("POI 已删除")
      onChanged()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "删除 POI 失败")
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
            <Dialog open={formOpen} onOpenChange={setFormOpen}>
              <DialogTrigger asChild>
                <Button className="rounded-none font-mono">
                  <Plus data-icon="inline-start" />
                  新增 POI
                </Button>
              </DialogTrigger>
              <DialogContent className="rounded-none font-mono sm:max-w-xl">
                <DialogHeader>
                  <DialogTitle>新增 POI</DialogTitle>
                  <DialogDescription>
                    提交到 POST /api/v1/admin/pois。
                  </DialogDescription>
                </DialogHeader>
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="poi-name">名称</FieldLabel>
                    <Input
                      id="poi-name"
                      value={form.name}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          name: event.target.value,
                        }))
                      }
                      className="rounded-none"
                    />
                  </Field>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field>
                      <FieldLabel htmlFor="poi-lat">纬度</FieldLabel>
                      <Input
                        id="poi-lat"
                        value={form.latitude}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            latitude: event.target.value,
                          }))
                        }
                        className="rounded-none"
                      />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="poi-lng">经度</FieldLabel>
                      <Input
                        id="poi-lng"
                        value={form.longitude}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            longitude: event.target.value,
                          }))
                        }
                        className="rounded-none"
                      />
                    </Field>
                  </div>
                  <Field>
                    <FieldLabel htmlFor="poi-description">简介</FieldLabel>
                    <Input
                      id="poi-description"
                      value={form.description}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          description: event.target.value,
                        }))
                      }
                      className="rounded-none"
                    />
                  </Field>
                </FieldGroup>
                <DialogFooter>
                  <Button
                    className="rounded-none font-mono"
                    onClick={handleCreate}
                  >
                    保存
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardAction>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-[1fr_180px]">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              className="rounded-none pl-9"
              placeholder="搜索 POI 或简介"
            />
          </div>
          <Select
            value={status}
            onValueChange={(value) => setStatus(value as typeof status)}
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

      <Card className="rounded-none shadow-none">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>POI ID</TableHead>
                <TableHead>名称</TableHead>
                <TableHead>简介</TableHead>
                <TableHead>坐标</TableHead>
                <TableHead>状态</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPois.length ? (
                filteredPois.map((poi) => (
                  <TableRow key={poi.id}>
                    <TableCell className="text-muted-foreground">
                      {poi.id}
                    </TableCell>
                    <TableCell className="font-medium">{poi.name}</TableCell>
                    <TableCell className="max-w-72 truncate">
                      {poi.region}
                    </TableCell>
                    <TableCell>
                      {poi.latitude.toFixed(5)}, {poi.longitude.toFixed(5)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={poi.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="rounded-none"
                          >
                            <Trash2 />
                            <span className="sr-only">删除 POI</span>
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="rounded-none font-mono">
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              删除 {poi.name}？
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              将调用 DELETE /api/v1/admin/pois/{poi.id}。
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="rounded-none font-mono">
                              取消
                            </AlertDialogCancel>
                            <AlertDialogAction
                              className="rounded-none font-mono"
                              onClick={() => handleDelete(poi.id)}
                            >
                              删除
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <EmptyTableRow colSpan={6} label="没有匹配的 POI" />
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
