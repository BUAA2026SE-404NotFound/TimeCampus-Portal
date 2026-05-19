import { useState } from "react"
import { Upload } from "lucide-react"
import { toast } from "sonner"

import { importOfficialContent } from "@/api/admin"
import { StatusBadge } from "@/components/admin/shared"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import type { AdminSnapshot } from "@/api/admin"

export function ImportsPage({
  snapshot,
  onChanged,
}: {
  snapshot: AdminSnapshot
  onChanged: () => void
}) {
  const [poiId, setPoiId] = useState("")
  const [imagePath, setImagePath] = useState("")
  const [year, setYear] = useState("2000")
  const [description, setDescription] = useState("")
  const [submitting, setSubmitting] = useState(false)

  async function handleImport() {
    if (submitting) return

    const numericPoiId = Number(poiId)
    const numericYear = Number(year)
    if (!numericPoiId || !imagePath.trim() || !numericYear) {
      toast.error("请填写 POI ID、图片路径和年份")
      return
    }

    setSubmitting(true)
    try {
      const result = await importOfficialContent({
        items: [
          {
            poiId: numericPoiId,
            imagePath: imagePath.trim(),
            year: numericYear,
            description: description.trim(),
            reviewStatus: "approved",
          },
        ],
      })
      toast.success(`导入完成：${result.successCount}/${result.total}`)
      setImagePath("")
      setDescription("")
      onChanged()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "导入失败")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[360px_1fr]">
      <Card className="rounded-none shadow-none">
        <CardHeader>
          <CardTitle>官方内容导入</CardTitle>
          <CardDescription>
            接入 POST /api/v1/admin/contents/batch-import。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="import-poi">POI ID</FieldLabel>
              <Input
                id="import-poi"
                value={poiId}
                onChange={(event) => setPoiId(event.target.value)}
                className="rounded-none"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="import-image">图片路径</FieldLabel>
              <Input
                id="import-image"
                value={imagePath}
                onChange={(event) => setImagePath(event.target.value)}
                className="rounded-none"
                placeholder="https://example.com/images/poi-1.jpg"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="import-year">年份</FieldLabel>
              <Input
                id="import-year"
                value={year}
                onChange={(event) => setYear(event.target.value)}
                className="rounded-none"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="import-note">导入说明</FieldLabel>
              <Textarea
                id="import-note"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                className="min-h-28 rounded-none"
              />
            </Field>
          </FieldGroup>
        </CardContent>
        <CardFooter className="border-t bg-muted/30">
          <Button
            className="w-full rounded-none font-mono"
            onClick={handleImport}
            disabled={submitting}
          >
            <Upload data-icon="inline-start" />
            {submitting ? "导入中" : "开始导入"}
          </Button>
        </CardFooter>
      </Card>

      <Card className="rounded-none shadow-none">
        <CardHeader>
          <CardTitle>导入记录</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table className="table-fixed">
            <TableHeader>
              <TableRow>
                <TableHead>来源 / 类型</TableHead>
                <TableHead className="w-28">成功 / 总数</TableHead>
                <TableHead className="w-24">审核</TableHead>
                <TableHead className="w-24">发布</TableHead>
                <TableHead className="w-36">操作人</TableHead>
                <TableHead className="w-44">导入时间</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {snapshot.imports.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="whitespace-normal">
                    <p className="line-clamp-2 font-medium">{item.fileName}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {item.type}
                    </p>
                  </TableCell>
                  <TableCell>
                    {item.success} / {item.total}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={item.reviewStatus} />
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={item.publishStatus} />
                  </TableCell>
                  <TableCell className="whitespace-normal">
                    <span className="line-clamp-2">{item.operator}</span>
                  </TableCell>
                  <TableCell>{item.createdAt}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
