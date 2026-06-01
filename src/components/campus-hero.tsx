import { useEffect, useRef, useState } from "react"
import { gsap } from "gsap"
import { useGSAP } from "@gsap/react"

import { Button } from "@/components/ui/button"
import {
  ImagePreviewDialog,
  type ImagePreviewState,
} from "@/components/image-preview-dialog"
import { ProgressiveImage } from "@/components/progressive-image"
import { heroCampusFrames } from "@/data/campus-history"

gsap.registerPlugin(useGSAP)

export function CampusHero({ onExplore }: { onExplore: () => void }) {
  const containerRef = useRef<HTMLElement | null>(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const [preview, setPreview] = useState<ImagePreviewState | null>(null)
  const frames = heroCampusFrames.filter((frame) => frame.src)
  const activeFrame = frames[activeIndex] ?? frames[0]

  useEffect(() => {
    if (frames.length < 2) return

    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % frames.length)
    }, 4200)

    return () => window.clearInterval(timer)
  }, [frames.length])

  useGSAP(
    () => {
      const mm = gsap.matchMedia()

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const timeline = gsap.timeline({
          defaults: { duration: 0.75, ease: "power2.out" },
        })

        timeline
          .from(".hero-kicker", { autoAlpha: 0, y: 12 })
          .from(".hero-title", { autoAlpha: 0, y: 20 }, "-=0.45")
          .from(".hero-copy", { autoAlpha: 0, y: 16 }, "-=0.35")
          .from(".hero-actions", { autoAlpha: 0, y: 12 }, "-=0.35")
          .from(".hero-panel", { autoAlpha: 0, y: 22, scale: 0.985 }, "-=0.5")

        gsap.to(".hero-blueprint-line", {
          xPercent: 8,
          duration: 4,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
          stagger: 0.2,
        })
      })

      return () => mm.revert()
    },
    { scope: containerRef }
  )

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.fromTo(
          ".hero-active-image",
          { scale: 1.035, y: 12 },
          { scale: 1, y: 0, duration: 0.75, ease: "power2.out" }
        )
      })

      return () => mm.revert()
    },
    { dependencies: [activeIndex], scope: containerRef, revertOnUpdate: true }
  )

  return (
    <>
      <section
        ref={containerRef}
        className="relative overflow-hidden border bg-sidebar font-mono text-sidebar-foreground"
      >
        <div className="pointer-events-none absolute inset-0 opacity-30">
          <span className="hero-blueprint-line absolute top-10 left-[-8%] h-px w-1/2 bg-sidebar-foreground/40" />
          <span className="hero-blueprint-line absolute top-36 right-[-12%] h-px w-2/3 bg-sidebar-foreground/30" />
          <span className="hero-blueprint-line absolute bottom-14 left-[-14%] h-px w-3/5 bg-sidebar-foreground/30" />
        </div>
        <div className="relative grid gap-6 p-5 sm:p-7 lg:grid-cols-[1fr_440px] lg:items-center">
          <div className="grid gap-5">
            <div>
              <p className="hero-kicker text-xs font-semibold tracking-[0.18em] text-sidebar-foreground/65 uppercase">
                TimeCampus Archive
              </p>
              <h1 className="hero-title mt-3 max-w-3xl text-4xl leading-tight font-semibold sm:text-5xl">
                把北航建筑记忆做成可以切换年代的地图入口
              </h1>
            </div>
            <p className="hero-copy max-w-2xl text-sm leading-7 text-sidebar-foreground/78 sm:text-base">
              图片来自校史馆原始目录，保持完整构图并压缩为前端资产。
              从八楼到十六馆、主楼、科技园与公共配套，用北航蓝建立更有时间感的主页。
            </p>
            <div className="hero-actions flex flex-wrap gap-3">
              <Button
                type="button"
                className="rounded-none bg-sidebar-foreground font-mono text-sidebar hover:bg-sidebar-foreground/90"
                onClick={onExplore}
              >
                查看校园档案
              </Button>
              <Button
                type="button"
                variant="outline"
                className="rounded-none border-sidebar-foreground/35 bg-transparent font-mono text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                onClick={() => {
                  document
                    .querySelector("#campus-frames")
                    ?.scrollIntoView({ behavior: "smooth", block: "start" })
                }}
              >
                浏览横向胶片
              </Button>
            </div>
          </div>

          {activeFrame ? (
            <div className="hero-panel border border-sidebar-foreground/25 bg-sidebar-accent/30 p-3">
              <ProgressiveImage
                src={activeFrame.src}
                alt={activeFrame.caption}
                className="hero-active-image aspect-[4/3] border border-sidebar-foreground/20 bg-sidebar"
                loading="eager"
                onClick={() =>
                  setPreview({
                    src: activeFrame.src,
                    alt: activeFrame.caption,
                    caption: `${activeFrame.year} / ${activeFrame.caption}`,
                  })
                }
              />
              <div className="mt-3 flex items-start justify-between gap-3 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-semibold">
                    {activeFrame.caption}
                  </p>
                  <p className="text-sidebar-foreground/65">
                    {activeFrame.year}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1 pt-1">
                  {frames.map((frame, index) => (
                    <button
                      key={`${frame.file}-${index}`}
                      type="button"
                      className="size-2 border border-sidebar-foreground/60 data-[active=true]:bg-sidebar-foreground"
                      data-active={index === activeIndex}
                      aria-label={`切换到 ${frame.caption}`}
                      onClick={() => setActiveIndex(index)}
                    />
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </section>
      <ImagePreviewDialog
        image={preview}
        onOpenChange={(open) => {
          if (!open) setPreview(null)
        }}
      />
    </>
  )
}
