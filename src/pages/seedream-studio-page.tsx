import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react"
import {
  ArrowLeft,
  Check,
  Download,
  ImageIcon,
  Loader2,
  RefreshCcw,
  Sparkles,
  Upload,
  UserRound,
} from "lucide-react"

import {
  generateSeedreamImage,
  getSeedreamBackgrounds,
  type SeedreamBackground,
  type SeedreamGenerationResult,
} from "@/api/seedream"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"
import { Button } from "@/components/ui/button"
import {
  getSeedreamTemplateAssetUrl,
  SEEDREAM_TEMPLATE_ASSETS,
} from "@/data/seedream-background-templates"
import { mergeClassName } from "@/lib/utils"

const LOCAL_SEEDREAM_BACKGROUNDS: SeedreamBackground[] =
  SEEDREAM_TEMPLATE_ASSETS.map(({ imageUrl: previewUrl, ...template }) => ({
    ...template,
    previewUrl,
  }))

function resolvePreviewUrl(url: string) {
  if (/^https?:\/\//i.test(url)) {
    return url
  }

  const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || "").replace(
    /\/$/,
    ""
  )
  if (!apiBaseUrl) {
    return url
  }

  const origin = apiBaseUrl.replace(/\/api\/v1\/?$/, "")
  return `${origin}${url.startsWith("/") ? "" : "/"}${url}`
}

function getBackgroundPreviewSrc(background: SeedreamBackground) {
  return (
    getSeedreamTemplateAssetUrl(background.id) ??
    resolvePreviewUrl(background.previewUrl)
  )
}

export function SeedreamStudioPage({ onBack }: { onBack: () => void }) {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [backgrounds, setBackgrounds] = useState<SeedreamBackground[]>([])
  const [selectedBackgroundId, setSelectedBackgroundId] = useState("")
  const [personFile, setPersonFile] = useState<File | null>(null)
  const [personPreviewUrl, setPersonPreviewUrl] = useState("")
  const [result, setResult] = useState<SeedreamGenerationResult | null>(null)
  const [loadingBackgrounds, setLoadingBackgrounds] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    let cancelled = false

    getSeedreamBackgrounds()
      .then((items) => {
        if (cancelled) return
        setBackgrounds(items)
        setSelectedBackgroundId((current) => current || items[0]?.id || "")
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setBackgrounds(LOCAL_SEEDREAM_BACKGROUNDS)
        setSelectedBackgroundId(
          (current) => current || LOCAL_SEEDREAM_BACKGROUNDS[0]?.id || ""
        )
        const message = err instanceof Error ? err.message : "背景模板加载失败"
        setError(`历史模板接口暂时不可用，已加载本地模板：${message}`)
      })
      .finally(() => {
        if (!cancelled) setLoadingBackgrounds(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    return () => {
      if (personPreviewUrl) {
        URL.revokeObjectURL(personPreviewUrl)
      }
    }
  }, [personPreviewUrl])

  const selectedBackground = useMemo(
    () =>
      backgrounds.find((background) => background.id === selectedBackgroundId),
    [backgrounds, selectedBackgroundId]
  )

  const canGenerate = Boolean(personFile && selectedBackgroundId && !generating)

  async function handleGenerate() {
    if (!personFile || !selectedBackgroundId) return

    setGenerating(true)
    setError("")
    setResult(null)

    try {
      setResult(await generateSeedreamImage(personFile, selectedBackgroundId))
    } catch (err) {
      setError(err instanceof Error ? err.message : "生成失败")
    } finally {
      setGenerating(false)
    }
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null
    setPersonFile(file)
    setPersonPreviewUrl(file ? URL.createObjectURL(file) : "")
    setResult(null)
    setError("")
  }

  function resetPersonImage() {
    setPersonFile(null)
    setPersonPreviewUrl("")
    setResult(null)
    setError("")
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <div className="flex min-h-svh flex-col bg-background text-foreground">
      <SiteHeader showNav={false} />
      <main className="flex-1 px-4 py-6 sm:px-6">
        <div className="mx-auto grid w-full max-w-6xl gap-4 font-mono">
          <header className="grid gap-4 border bg-card p-5 sm:p-6 lg:grid-cols-[1fr_auto] lg:items-end">
            <div className="grid gap-2">
              <p className="text-sm font-semibold text-muted-foreground uppercase">
                Seedream Studio
              </p>
              <h1 className="text-3xl font-semibold">时光合影工作室</h1>
              <p className="max-w-3xl leading-7 text-muted-foreground">
                上传人物照片，选择一张历史影像模板，生成一张老照片风格的校园合影。
              </p>
            </div>
            <Button className="w-fit rounded-none font-mono" onClick={onBack}>
              <ArrowLeft data-icon="inline-start" />
              返回主页
            </Button>
          </header>

          <section className="grid gap-4 lg:grid-cols-[0.86fr_1.14fr]">
            <div className="grid gap-4">
              <section className="grid gap-4 border bg-card p-4 sm:p-5">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="flex items-center gap-2 text-xl font-semibold">
                    <UserRound data-icon="inline-start" />
                    人物照片
                  </h2>
                  {personFile ? (
                    <span className="truncate text-xs text-muted-foreground">
                      {personFile.name}
                    </span>
                  ) : null}
                </div>
                <div className="grid aspect-[4/3] place-items-center overflow-hidden border bg-muted/35">
                  {personPreviewUrl ? (
                    <img
                      src={personPreviewUrl}
                      alt="已上传的人物照片"
                      className="size-full object-contain"
                    />
                  ) : (
                    <div className="grid gap-3 text-center text-muted-foreground">
                      <Upload className="mx-auto size-8" />
                      <span className="text-sm">JPEG / PNG / WebP</span>
                    </div>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileChange}
                />
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-none font-mono"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload data-icon="inline-start" />
                  选择人物照片
                </Button>
              </section>

              <section className="grid gap-4 border bg-card p-4 sm:p-5">
                <h2 className="flex items-center gap-2 text-xl font-semibold">
                  <ImageIcon data-icon="inline-start" />
                  历史模板
                </h2>
                {loadingBackgrounds ? (
                  <div className="grid min-h-40 place-items-center border bg-muted/30 text-sm text-muted-foreground">
                    正在加载...
                  </div>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {backgrounds.map((background) => {
                      const selected = background.id === selectedBackgroundId

                      return (
                        <button
                          key={background.id}
                          type="button"
                          aria-pressed={selected}
                          className={mergeClassName(
                            "grid overflow-hidden border bg-background text-left transition hover:border-primary",
                            selected && "border-primary ring-2 ring-ring/30"
                          )}
                          onClick={() => {
                            setSelectedBackgroundId(background.id)
                            setResult(null)
                            setError("")
                          }}
                        >
                          <span className="relative block aspect-[4/3] bg-muted">
                            <img
                              src={getBackgroundPreviewSrc(background)}
                              alt={background.title}
                              className="size-full object-cover"
                              loading="lazy"
                              decoding="async"
                            />
                            {selected ? (
                              <span className="absolute top-2 right-2 grid size-7 place-items-center bg-primary text-primary-foreground">
                                <Check className="size-4" />
                              </span>
                            ) : null}
                          </span>
                          <span className="grid gap-1 p-3">
                            <span className="font-semibold">
                              {background.title}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {background.year} · {background.description}
                            </span>
                          </span>
                        </button>
                      )
                    })}
                  </div>
                )}
              </section>
            </div>

            <section className="grid min-h-[520px] grid-rows-[auto_minmax(0,1fr)_auto] gap-4 border bg-card p-4 sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="flex items-center gap-2 text-xl font-semibold">
                  <Sparkles data-icon="inline-start" />
                  生成结果
                </h2>
                {selectedBackground ? (
                  <span className="text-sm text-muted-foreground">
                    {selectedBackground.title}
                  </span>
                ) : null}
              </div>

              <div className="grid min-h-0 place-items-center overflow-hidden border bg-muted/25">
                {result ? (
                  <img
                    src={result.imageUrl}
                    alt="Seedream 生成的历史影像人物置入图"
                    className="max-h-full max-w-full object-contain"
                  />
                ) : selectedBackground ? (
                  <div className="relative size-full">
                    <img
                      src={getBackgroundPreviewSrc(selectedBackground)}
                      alt={selectedBackground.title}
                      className="size-full object-cover opacity-45 grayscale"
                      loading="lazy"
                      decoding="async"
                    />
                    <div className="absolute inset-0 grid place-items-center bg-background/25">
                      <div className="grid gap-2 border bg-card/90 px-4 py-3 text-center text-sm text-muted-foreground">
                        {generating ? (
                          <>
                            <Loader2 className="mx-auto size-5 animate-spin text-primary" />
                            <span>生成中...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="mx-auto size-5 text-primary" />
                            <span>等待生成</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">
                    请选择历史模板
                  </div>
                )}
              </div>

              <div className="grid gap-3">
                {error ? (
                  <div className="border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {error}
                  </div>
                ) : null}
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    className="rounded-none font-mono"
                    disabled={!canGenerate}
                    onClick={handleGenerate}
                  >
                    {generating ? (
                      <Loader2 data-icon="inline-start" className="animate-spin" />
                    ) : (
                      <Sparkles data-icon="inline-start" />
                    )}
                    生成历史合影
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-none font-mono"
                    disabled={!personFile && !result}
                    onClick={resetPersonImage}
                  >
                    <RefreshCcw data-icon="inline-start" />
                    重置
                  </Button>
                  {result ? (
                    <Button
                      asChild
                      variant="outline"
                      className="rounded-none font-mono"
                    >
                      <a
                        href={result.imageUrl}
                        download
                        target="_blank"
                        rel="noreferrer"
                      >
                        <Download data-icon="inline-start" />
                        下载结果
                      </a>
                    </Button>
                  ) : null}
                </div>
              </div>
            </section>
          </section>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
