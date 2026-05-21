import {
  type CSSProperties,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import { ImageOff, ImageUp, Link, Search } from "lucide-react"
import { toast } from "sonner"

import { importOfficialContent, uploadOfficialContent } from "@/api/admin"
import { PaginationControls } from "@/components/admin/pagination-controls"
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import type { AdminSnapshot } from "@/api/admin"
import type { MediaRecord, Poi } from "@/mocks/admin"

type UploadMode = "file" | "url"
type StatusFilter = "all" | "APPROVED" | "PENDING" | "REJECTED"

function parsePoiNumericId(id: string) {
  const direct = Number(id)
  if (Number.isFinite(direct) && direct > 0) return direct

  const matched = id.match(/\d+/)
  return matched ? Number(matched[0]) : 0
}

function mediaSource(item: MediaRecord) {
  return item.previewUrl || item.imagePath
}

function mediaTimeValue(item: MediaRecord) {
  const value = Date.parse(item.createdAt)
  return Number.isFinite(value) ? value : 0
}

function poiMediaCount(poiId: string, media: MediaRecord[]) {
  return media.filter((item) => item.poiId === poiId).length
}

function MediaThumb({ item }: { item: MediaRecord }) {
  const src = mediaSource(item)

  if (!src) {
    return (
      <div className="grid size-24 shrink-0 place-items-center border bg-muted text-muted-foreground">
        <ImageOff className="size-5" />
      </div>
    )
  }

  return (
    <div className="size-24 shrink-0 overflow-hidden border bg-muted">
      <img
        src={src}
        alt={item.description || item.poiName}
        className="size-full object-cover"
        loading="lazy"
      />
    </div>
  )
}

function DetailImage({ item }: { item: MediaRecord }) {
  const src = mediaSource(item)

  return (
    <div className="grid h-48 w-full place-items-center overflow-hidden border bg-muted">
      {src ? (
        <img
          src={src}
          alt={item.description || item.poiName}
          className="size-full object-contain"
        />
      ) : (
        <ImageOff className="size-8 text-muted-foreground" />
      )}
    </div>
  )
}

function PoiPicker({
  pois,
  media,
  selectedPoiId,
  onSelectedPoiIdChange,
}: {
  pois: Poi[]
  media: MediaRecord[]
  selectedPoiId: string
  onSelectedPoiIdChange: (id: string) => void
}) {
  const [keyword, setKeyword] = useState("")
  const filteredPois = pois
    .filter((poi) => {
      const normalizedKeyword = keyword.trim().toLowerCase()
      if (!normalizedKeyword) return true

      return [poi.id, poi.name, poi.region]
        .join(" ")
        .toLowerCase()
        .includes(normalizedKeyword)
    })
    .slice(0, 30)

  const selectedPoi = pois.find((poi) => poi.id === selectedPoiId)

  return (
    <Field>
      <FieldLabel htmlFor="poi-search">POI</FieldLabel>
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          id="poi-search"
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
          className="rounded-none pl-9"
          placeholder="按 POI 名称、ID、简介搜索"
        />
      </div>
      <Select value={selectedPoiId} onValueChange={onSelectedPoiIdChange}>
        <SelectTrigger className="w-full rounded-none">
          <SelectValue placeholder="选择 POI">
            {selectedPoi
              ? `${selectedPoi.id} · ${selectedPoi.name}`
              : "选择 POI"}
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="rounded-none">
          {filteredPois.map((poi) => (
            <SelectItem key={poi.id} value={poi.id} className="rounded-none">
              {poi.id} · {poi.name} ·{" "}
              {poi.status === "ACTIVE" ? "上架" : "下架"} ·{" "}
              {poiMediaCount(poi.id, media)} 条媒体
            </SelectItem>
          ))}
          {!filteredPois.length ? (
            <SelectItem value="__empty" disabled className="rounded-none">
              没有匹配的 POI
            </SelectItem>
          ) : null}
        </SelectContent>
      </Select>
      {selectedPoi ? (
        <div className="grid gap-2 border bg-muted/20 p-3 text-sm">
          <div className="flex items-center justify-between gap-2">
            <span className="min-w-0 truncate font-medium">
              {selectedPoi.name}
            </span>
            <StatusBadge status={selectedPoi.status} />
          </div>
          <p className="line-clamp-2 text-muted-foreground">
            {selectedPoi.region}
          </p>
          <p className="text-xs text-muted-foreground">
            当前媒体数量：{poiMediaCount(selectedPoi.id, media)}
          </p>
        </div>
      ) : null}
    </Field>
  )
}

export function ImportsPage({
  snapshot,
  onChanged,
}: {
  snapshot: AdminSnapshot
  onChanged: () => void
}) {
  const [mode, setMode] = useState<UploadMode>("file")
  const [poiId, setPoiId] = useState("")
  const [imagePath, setImagePath] = useState("")
  const [year, setYear] = useState("2000")
  const [description, setDescription] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState("")
  const [selectedRecordId, setSelectedRecordId] = useState("")
  const [recordKeyword, setRecordKeyword] = useState("")
  const [recordStatus, setRecordStatus] = useState<StatusFilter>("all")
  const [recordPoiId, setRecordPoiId] = useState("all")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(6)
  const [leftColumnHeight, setLeftColumnHeight] = useState<number | null>(null)
  const previewUrlRef = useRef("")
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const leftColumnRef = useRef<HTMLDivElement | null>(null)

  const officialMedia = useMemo(
    () =>
      snapshot.media
        .filter((item) => item.type.toLowerCase() === "official")
        .sort((a, b) => mediaTimeValue(b) - mediaTimeValue(a)),
    [snapshot.media]
  )

  const filteredMedia = useMemo(() => {
    const keyword = recordKeyword.trim().toLowerCase()

    return officialMedia.filter((item) => {
      const matchesStatus =
        recordStatus === "all" || item.reviewStatus === recordStatus
      const matchesPoi = recordPoiId === "all" || item.poiId === recordPoiId
      const searchable = [
        item.id,
        item.poiId,
        item.poiName,
        item.year,
        item.description,
        item.imagePath,
        item.previewUrl,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()

      return (
        matchesStatus &&
        matchesPoi &&
        (!keyword || searchable.includes(keyword))
      )
    })
  }, [officialMedia, recordKeyword, recordPoiId, recordStatus])

  const totalPages = Math.max(1, Math.ceil(filteredMedia.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const pagedMedia = filteredMedia.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  )
  const selectedRecord =
    filteredMedia.find((item) => item.id === selectedRecordId) ??
    filteredMedia[0] ??
    officialMedia[0]

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current)
      }
    }
  }, [])

  useEffect(() => {
    const element = leftColumnRef.current
    if (!element) return

    let frameId = 0
    const syncHeight = () => {
      cancelAnimationFrame(frameId)
      frameId = requestAnimationFrame(() => {
        setLeftColumnHeight(Math.ceil(element.getBoundingClientRect().height))
      })
    }

    syncHeight()
    const observer = new ResizeObserver(syncHeight)
    observer.observe(element)
    window.addEventListener("resize", syncHeight)

    return () => {
      cancelAnimationFrame(frameId)
      observer.disconnect()
      window.removeEventListener("resize", syncHeight)
    }
  }, [])

  function readFormBase() {
    const numericPoiId = parsePoiNumericId(poiId)
    const numericYear = Number(year)

    if (!numericPoiId) {
      toast.error("请选择有效的 POI")
      return null
    }
    const currentYear = new Date().getFullYear()
    if (
      !Number.isInteger(numericYear) ||
      numericYear < 1953 ||
      numericYear > currentYear
    ) {
      toast.error(`年份范围应为 1953 到 ${currentYear}`)
      return null
    }

    return {
      poiId: numericPoiId,
      year: numericYear,
      description: description.trim(),
    }
  }

  function clearFilePreview() {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current)
      previewUrlRef.current = ""
    }
    setPreviewUrl("")
    setUploadFile(null)
  }

  function handleFileChange(file: File | null) {
    clearFilePreview()

    if (!file) return
    if (!["image/jpeg", "image/png"].includes(file.type)) {
      toast.error("仅支持 JPG、JPEG、PNG 图片")
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("图片大小不能超过 10MB")
      return
    }
    const objectUrl = URL.createObjectURL(file)
    previewUrlRef.current = objectUrl
    setPreviewUrl(objectUrl)
    setUploadFile(file)
  }

  async function handleUrlImport() {
    if (submitting) return

    const base = readFormBase()
    if (!base) return
    if (!imagePath.trim()) {
      toast.error("请填写图片 URL 或已存在图片路径")
      return
    }

    setSubmitting(true)
    try {
      const result = await importOfficialContent({
        items: [
          {
            poiId: base.poiId,
            imagePath: imagePath.trim(),
            year: base.year,
            description: base.description,
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

  async function handleFileUpload() {
    if (submitting) return

    const base = readFormBase()
    if (!base) return
    if (!uploadFile) {
      toast.error("请选择要上传的图片")
      return
    }

    setSubmitting(true)
    try {
      await uploadOfficialContent({
        file: uploadFile,
        poiId: base.poiId,
        year: base.year,
        description: base.description,
      })
      toast.success("官方图片已上传")
      clearFilePreview()
      setDescription("")
      onChanged()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "上传失败")
    } finally {
      setSubmitting(false)
    }
  }
  return (
    <div
      className="grid items-start gap-4 xl:grid-cols-[360px_minmax(520px,1fr)_360px]"
      style={
        {
          "--upload-left-height": leftColumnHeight
            ? `${leftColumnHeight}px`
            : undefined,
        } as CSSProperties
      }
    >
      <Card
        ref={leftColumnRef}
        className="flex min-w-0 flex-col rounded-none shadow-none"
      >
        <CardHeader>
          <CardTitle>官方内容上传</CardTitle>
          <CardDescription>
            选择 POI 后上传本地图片，或导入已有图片 URL。
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-1">
          <FieldGroup>
            <PoiPicker
              pois={snapshot.pois}
              media={snapshot.media}
              selectedPoiId={poiId}
              onSelectedPoiIdChange={(value) => {
                if (value !== "__empty") setPoiId(value)
              }}
            />
            <div className="grid gap-4 sm:grid-cols-2">
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
                <FieldLabel>上传方式</FieldLabel>
                <Select
                  value={mode}
                  onValueChange={(value) => setMode(value as UploadMode)}
                >
                  <SelectTrigger className="w-full rounded-none">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-none">
                    <SelectItem value="file" className="rounded-none">
                      上传文件
                    </SelectItem>
                    <SelectItem value="url" className="rounded-none">
                      图片 URL
                    </SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>
            <Field>
              <FieldLabel htmlFor="import-note">影像说明</FieldLabel>
              <Textarea
                id="import-note"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                className="min-h-24 rounded-none"
              />
            </Field>

            {mode === "file" ? (
              <>
                <Input
                  ref={fileInputRef}
                  id="import-file"
                  type="file"
                  accept="image/jpeg,image/png"
                  onChange={(event) =>
                    handleFileChange(event.target.files?.[0] ?? null)
                  }
                  className="hidden"
                  disabled={submitting}
                />
                <Field>
                  <FieldLabel htmlFor="import-file">选择图片</FieldLabel>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full rounded-none"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={submitting}
                  >
                    点击上传
                  </Button>
                </Field>
                <div className="grid h-48 place-items-center overflow-hidden border bg-muted/20">
                  {uploadFile ? (
                    <img
                      src={previewUrl}
                      alt={uploadFile.name}
                      className="size-full object-contain"
                    />
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      请选择 JPG 或 PNG 图片
                    </span>
                  )}
                </div>
                {uploadFile ? (
                  <p className="truncate text-xs text-muted-foreground">
                    {uploadFile.name} ·{" "}
                    {(uploadFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                ) : null}
              </>
            ) : (
              <Field>
                <FieldLabel htmlFor="import-image">图片 URL / 路径</FieldLabel>
                <Input
                  id="import-image"
                  value={imagePath}
                  onChange={(event) => setImagePath(event.target.value)}
                  className="rounded-none"
                  placeholder="https://example.com/images/poi-1.jpg"
                />
              </Field>
            )}
          </FieldGroup>
        </CardContent>
        <CardFooter className="border-t bg-muted/30">
          {mode === "file" ? (
            <Button
              className="w-full rounded-none font-mono"
              onClick={handleFileUpload}
              disabled={submitting}
            >
              <ImageUp data-icon="inline-start" />
              {submitting ? "上传中" : "上传图片"}
            </Button>
          ) : (
            <Button
              variant="outline"
              className="w-full rounded-none font-mono"
              onClick={handleUrlImport}
              disabled={submitting}
            >
              <Link data-icon="inline-start" />
              {submitting ? "导入中" : "导入 URL"}
            </Button>
          )}
        </CardFooter>
      </Card>

      <Card className="flex min-w-0 flex-col rounded-none shadow-none xl:h-(--upload-left-height) xl:max-h-(--upload-left-height) xl:overflow-hidden">
        <CardHeader>
          <CardTitle>上传记录</CardTitle>
          <CardDescription>
            按上传时间倒序展示，点击记录查看右侧详情。
          </CardDescription>
        </CardHeader>
        <CardContent className="flex min-h-0 flex-1 flex-col gap-3">
          <div className="grid gap-2 2xl:grid-cols-[1fr_140px_160px]">
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={recordKeyword}
                onChange={(event) => {
                  setRecordKeyword(event.target.value)
                  setPage(1)
                }}
                className="rounded-none pl-9"
                placeholder="搜索媒体 ID、POI、年份、说明、路径"
              />
            </div>
            <Select
              value={recordStatus}
              onValueChange={(value) => {
                setRecordStatus(value as StatusFilter)
                setPage(1)
              }}
            >
              <SelectTrigger className="w-full rounded-none">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-none">
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="APPROVED">已通过</SelectItem>
                <SelectItem value="PENDING">待审核</SelectItem>
                <SelectItem value="REJECTED">已驳回</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={recordPoiId}
              onValueChange={(value) => {
                setRecordPoiId(value)
                setPage(1)
              }}
            >
              <SelectTrigger className="w-full rounded-none">
                <SelectValue placeholder="全部 POI" />
              </SelectTrigger>
              <SelectContent className="rounded-none">
                <SelectItem value="all">全部 POI</SelectItem>
                {snapshot.pois.map((poi) => (
                  <SelectItem key={poi.id} value={poi.id}>
                    {poi.id} · {poi.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto pr-2">
            <div className="grid gap-2">
              {pagedMedia.length ? (
                pagedMedia.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedRecordId(item.id)}
                    className="grid gap-3 border bg-background p-3 text-left transition-colors hover:bg-muted/40 data-[active=true]:border-foreground data-[active=true]:bg-muted/40"
                    data-active={selectedRecord?.id === item.id}
                  >
                    <div className="grid gap-3 sm:grid-cols-[96px_1fr]">
                      <MediaThumb item={item} />
                      <div className="min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate font-medium">
                              {item.poiName}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              媒体 {item.id} · POI {item.poiId}
                            </p>
                          </div>
                          <StatusBadge status={item.reviewStatus} />
                        </div>
                        <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                          {item.description}
                        </p>
                        <p className="mt-2 text-xs text-muted-foreground">
                          {item.year} · {item.createdAt}
                        </p>
                      </div>
                    </div>
                  </button>
                ))
              ) : (
                <div className="grid min-h-48 place-items-center border bg-background text-muted-foreground">
                  暂无匹配的上传记录
                </div>
              )}
            </div>
          </div>

          <PaginationControls
            page={currentPage}
            pageSize={pageSize}
            total={filteredMedia.length}
            onPageChange={setPage}
            onPageSizeChange={(value) => {
              setPageSize(value)
              setPage(1)
            }}
          />
        </CardContent>
      </Card>

      <Card className="flex min-w-0 flex-col rounded-none shadow-none xl:h-(--upload-left-height) xl:max-h-(--upload-left-height) xl:overflow-hidden">
        <CardHeader>
          <CardTitle>上传详情</CardTitle>
        </CardHeader>
        <CardContent className="min-h-0 flex-1 overflow-y-auto pr-2">
          {selectedRecord ? (
            <div className="grid gap-4">
              <DetailImage item={selectedRecord} />
              <div className="grid gap-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">媒体 ID</p>
                  <p className="font-medium break-all">{selectedRecord.id}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">POI</p>
                  <p className="font-medium break-all">
                    {selectedRecord.poiId} · {selectedRecord.poiName}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">状态</p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    <StatusBadge status={selectedRecord.reviewStatus} />
                    <StatusBadge status={selectedRecord.publishStatus} />
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">年份</p>
                  <p>{selectedRecord.year}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">说明</p>
                  <p className="wrap-break-word whitespace-pre-wrap">
                    {selectedRecord.description}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">路径</p>
                  <p className="text-xs break-all">
                    {selectedRecord.imagePath ||
                      selectedRecord.previewUrl ||
                      "无媒体路径"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">时间</p>
                  <p className="text-xs">创建：{selectedRecord.createdAt}</p>
                  <p className="text-xs">更新：{selectedRecord.updatedAt}</p>
                  {selectedRecord.reviewTime ? (
                    <p className="text-xs">审核：{selectedRecord.reviewTime}</p>
                  ) : null}
                </div>
              </div>
            </div>
          ) : (
            <div className="grid min-h-80 place-items-center border bg-muted/20 text-sm text-muted-foreground">
              选择一条上传记录
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
