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
        <CardContent className="grid gap-3">
          {snapshot.imports.length ? (
            snapshot.imports.map((item) => (
              <article key={item.id} className="border bg-background p-4">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <h3 className="line-clamp-2 font-semibold">
                      {item.fileName}
                    </h3>
                    <p className="text-xs text-muted-foreground">{item.type}</p>
                  </div>
                  <time className="shrink-0 text-sm text-muted-foreground">
                    {item.createdAt}
                  </time>
                </div>
                <dl className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                  <div className="grid gap-1">
                    <dt className="text-xs text-muted-foreground">
                      成功 / 总数
                    </dt>
                    <dd className="font-semibold">
                      {item.success} / {item.total}
                    </dd>
                  </div>
                  <div className="grid gap-1">
                    <dt className="text-xs text-muted-foreground">审核状态</dt>
                    <dd>
                      <StatusBadge status={item.reviewStatus} />
                    </dd>
                  </div>
                  <div className="grid gap-1">
                    <dt className="text-xs text-muted-foreground">发布状态</dt>
                    <dd>
                      <StatusBadge status={item.publishStatus} />
                    </dd>
                  </div>
                  <div className="grid gap-1">
                    <dt className="text-xs text-muted-foreground">操作人</dt>
                    <dd className="line-clamp-2">{item.operator}</dd>
                  </div>
                  <div className="grid gap-1">
                    <dt className="text-xs text-muted-foreground">导入时间</dt>
                    <dd className="break-all">{item.createdAt}</dd>
                  </div>
                </dl>
              </article>
            ))
          ) : (
            <div className="border bg-background p-8 text-center text-muted-foreground">
              暂无导入记录
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
