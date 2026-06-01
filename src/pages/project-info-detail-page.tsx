import { useRef, useState } from "react"
import { ArrowLeft, Images } from "lucide-react"
import { gsap } from "gsap"
import { useGSAP } from "@gsap/react"

import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"
import {
  ImagePreviewDialog,
  type ImagePreviewState,
} from "@/components/image-preview-dialog"
import { ProgressiveImage } from "@/components/progressive-image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  campusHistoryItems,
  campusHistoryZones,
  type CampusHistoryItem,
} from "@/data/campus-history"
import { mergeClassName } from "@/lib/utils"

gsap.registerPlugin(useGSAP)

const zones = ["全部", ...campusHistoryZones]

function BuildingArchiveCard({ item }: { item: CampusHistoryItem }) {
  const cardRef = useRef<HTMLElement | null>(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const [preview, setPreview] = useState<ImagePreviewState | null>(null)
  const activeImage = item.images[activeIndex] ?? item.images[0]

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.fromTo(
          ".building-active-image",
          { scale: 1.035, y: 8 },
          { scale: 1, y: 0, duration: 0.45, ease: "power2.out" }
        )
      })

      return () => mm.revert()
    },
    { dependencies: [activeIndex], scope: cardRef, revertOnUpdate: true }
  )

  return (
    <>
      <article
        ref={cardRef}
        className="grid h-full min-h-[560px] min-w-0 grid-rows-[224px_1fr] overflow-hidden border bg-card shadow-none"
      >
        <div className="relative h-56 overflow-hidden bg-muted">
          {activeImage ? (
            <ProgressiveImage
              src={activeImage.src}
              alt={activeImage.caption}
              className="building-active-image size-full"
              onClick={() =>
                setPreview({
                  src: activeImage.src,
                  alt: activeImage.caption,
                  caption: `${item.name} / ${activeImage.year} / ${activeImage.caption}`,
                })
              }
            />
          ) : null}
          <div className="absolute top-3 left-3 bg-sidebar px-2 py-1 font-mono text-xs text-sidebar-foreground">
            {item.code}
          </div>
        </div>
        <div className="grid min-w-0 grid-rows-[auto_auto_auto_1fr] gap-3 p-4 font-mono">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-muted-foreground uppercase">
              {item.zone}
            </p>
            <h3 className="mt-1 truncate text-lg font-semibold">{item.name}</h3>
          </div>
          <p className="max-h-[4.5rem] overflow-hidden text-sm leading-6 text-muted-foreground">
            {item.detail}
          </p>
          <div className="flex flex-wrap gap-2">
            {item.tags.map((tag) => (
              <span
                key={tag}
                className="max-w-full truncate border bg-muted/40 px-2 py-1 text-xs"
              >
                {tag}
              </span>
            ))}
          </div>
          <div className="self-end">
            {item.images.length > 1 ? (
              <div className="grid gap-2">
                <p className="text-xs text-muted-foreground">年代切换</p>
                <div className="flex max-h-24 flex-wrap gap-2 overflow-y-auto pr-1">
                  {item.images.slice(0, 10).map((image, index) => (
                    <Button
                      key={image.file}
                      type="button"
                      size="sm"
                      variant={index === activeIndex ? "default" : "outline"}
                      className="rounded-none font-mono"
                      onClick={() => setActiveIndex(index)}
                    >
                      {image.year}
                    </Button>
                  ))}
                  {item.images.length > 10 ? (
                    <span className="border bg-muted/40 px-2 py-1 text-xs text-muted-foreground">
                      +{item.images.length - 10}
                    </span>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </article>
      <ImagePreviewDialog
        image={preview}
        onOpenChange={(open) => {
          if (!open) setPreview(null)
        }}
      />
    </>
  )
}

export function ProjectInfoDetailPage({ onBack }: { onBack: () => void }) {
  const pageRef = useRef<HTMLDivElement | null>(null)

  useGSAP(
    () => {
      const mm = gsap.matchMedia()

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from("[data-details-reveal]", {
          autoAlpha: 0,
          y: 22,
          duration: 0.65,
          ease: "power2.out",
          stagger: 0.06,
        })
      })

      return () => mm.revert()
    },
    { scope: pageRef }
  )

  return (
    <div
      ref={pageRef}
      className="flex min-h-svh flex-col bg-background text-foreground"
    >
      <SiteHeader showNav={false} />
      <main className="flex-1 px-4 py-6 sm:px-6">
        <div className="mx-auto grid w-full max-w-6xl gap-5 font-mono">
          <section
            data-details-reveal
            className="overflow-hidden border bg-sidebar text-sidebar-foreground"
          >
            <div className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[1fr_360px] lg:items-end">
              <div>
                <p className="text-xs font-semibold tracking-[0.18em] text-sidebar-foreground/65 uppercase">
                  TimeCampus Archive
                </p>
                <h1 className="mt-3 max-w-3xl text-4xl leading-tight font-semibold sm:text-5xl">
                  校园建筑档案与年代影像
                </h1>
                <p className="mt-4 max-w-3xl text-sm leading-7 text-sidebar-foreground/78 sm:text-base">
                  本页按照桌面校史馆图片的原始一级目录分栏展示。图片保持原图构图，
                  只做前端资产压缩，不再进行二次裁剪。
                </p>
              </div>
              <div className="grid gap-3 border border-sidebar-foreground/25 bg-sidebar-accent/30 p-4">
                <div className="flex items-center gap-2 text-sm">
                  <Images />
                  <span>{campusHistoryItems.length} 组建筑档案</span>
                </div>
                <p className="text-sm leading-6 text-sidebar-foreground/75">
                  每张卡片保留同目录下的年代切换，适合后续接入用户端时间切换
                  API。
                </p>
                <Button
                  type="button"
                  className="rounded-none bg-sidebar-foreground font-mono text-sidebar hover:bg-sidebar-foreground/90"
                  onClick={onBack}
                >
                  <ArrowLeft data-icon="inline-start" />
                  返回主页
                </Button>
              </div>
            </div>
          </section>

          <Tabs defaultValue="全部" className="grid gap-4">
            <TabsList
              data-details-reveal
              className="flex h-auto flex-wrap justify-start rounded-none"
            >
              {zones.map((zone) => (
                <TabsTrigger key={zone} value={zone} className="rounded-none">
                  {zone}
                </TabsTrigger>
              ))}
            </TabsList>
            {zones.map((zone) => {
              const items =
                zone === "全部"
                  ? campusHistoryItems
                  : campusHistoryItems.filter((item) => item.zone === zone)

              return (
                <TabsContent key={zone} value={zone} className="mt-0">
                  <div
                    className={mergeClassName(
                      "grid min-w-0 gap-4",
                      "md:grid-cols-2"
                    )}
                  >
                    {items.map((item) => (
                      <div
                        data-details-reveal
                        key={item.id}
                        className="min-w-0"
                      >
                        <BuildingArchiveCard item={item} />
                      </div>
                    ))}
                  </div>
                </TabsContent>
              )
            })}
          </Tabs>

          <Card data-details-reveal className="rounded-none shadow-none">
            <CardHeader>
              <CardTitle>素材处理说明</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2 text-sm leading-6 text-muted-foreground">
              <p>
                校史馆图片已按原始目录复制到
                src/assets/campus-history，并转换为最长边 1800px 的压缩 JPG。
              </p>
              <p>
                这里不做裁剪和人工重分类；如果后续某张图片有人像或集体照，可以直接在对应原始分类目录中替换。
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
