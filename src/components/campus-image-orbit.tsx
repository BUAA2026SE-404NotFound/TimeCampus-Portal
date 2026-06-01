import { useRef, useState } from "react"
import { gsap } from "gsap"
import { useGSAP } from "@gsap/react"

import {
  ImagePreviewDialog,
  type ImagePreviewState,
} from "@/components/image-preview-dialog"
import { ProgressiveImage } from "@/components/progressive-image"
import { featuredCampusFrames } from "@/data/campus-history"

gsap.registerPlugin(useGSAP)

const galleryImages = featuredCampusFrames.filter((image) => image.src)
const vintageImages = galleryImages.filter((image) => {
  const year = Number(image.year)
  return !Number.isFinite(year) || year < 2000
})
const modernImages = galleryImages.filter((image) => Number(image.year) >= 2000)
const primaryVintage = (
  vintageImages.length ? vintageImages : galleryImages
).slice(0, 18)
const compactVintage = (
  vintageImages.length ? vintageImages : galleryImages
).slice(0, 28)
const modernColor = (
  modernImages.length ? modernImages : galleryImages.slice(-18)
).slice(0, 18)

export function CampusImageOrbit() {
  const containerRef = useRef<HTMLElement | null>(null)
  const [preview, setPreview] = useState<ImagePreviewState | null>(null)

  function openPreview(image: (typeof galleryImages)[number]) {
    setPreview({
      src: image.src,
      alt: image.caption,
      caption: `${image.zone} / ${image.year} / ${image.building} / ${image.caption}`,
    })
  }

  useGSAP(
    () => {
      const section = containerRef.current
      if (!section) return

      const intro = gsap.from("[data-gallery-heading] > *", {
        y: 18,
        duration: 0.75,
        ease: "power2.out",
        stagger: 0.08,
      })

      const loops = gsap.utils
        .toArray<HTMLElement>("[data-loop-track]")
        .map((track) => {
          const segment = track.querySelector<HTMLElement>(
            "[data-loop-segment]"
          )
          if (!segment) {
            return null
          }

          const isRight = track.dataset.direction === "right"
          const speed = Number(track.dataset.speed || 36)
          const width = segment.getBoundingClientRect().width
          const setX = gsap.quickSetter(track, "x", "px") as (
            value: number
          ) => void
          const row = track.closest<HTMLElement>("[data-loop-row]")
          const loop = {
            direction: isRight ? 1 : -1,
            paused: false,
            segment,
            setX,
            speed,
            track,
            x: isRight ? -width : 0,
            positioned: width > 0,
          }
          const pause = () => {
            loop.paused = true
          }
          const resume = () => {
            loop.paused = false
          }
          row?.addEventListener("pointerenter", pause)
          row?.addEventListener("pointerleave", resume)
          setX(loop.x)

          return { loop, row, pause, resume }
        })
        .filter((loop): loop is NonNullable<typeof loop> => Boolean(loop))

      const normalizeX = (x: number, width: number) => {
        if (!Number.isFinite(width) || width <= 0) {
          return 0
        }

        return -(((-x % width) + width) % width || 0)
      }
      const tick = (_time: number, deltaTime = 16.67) => {
        const deltaSeconds = Math.min(deltaTime / 1000, 0.08)

        loops.forEach(({ loop }) => {
          const width = loop.segment.getBoundingClientRect().width
          if (width <= 0) {
            loop.setX(0)
            loop.positioned = false
            return
          }

          if (!loop.positioned) {
            loop.x = loop.direction === 1 ? -width : 0
            loop.positioned = true
          }

          if (!loop.paused) {
            loop.x += loop.direction * loop.speed * deltaSeconds
          }

          loop.x = normalizeX(loop.x, width)
          loop.setX(loop.x)
        })
      }
      gsap.ticker.add(tick)

      const imagePulse = gsap.to(".campus-film-card img", {
        scale: 1.045,
        duration: 3.2,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        stagger: {
          each: 0.18,
          from: "random",
        },
      })

      return () => {
        intro.kill()
        gsap.ticker.remove(tick)
        loops.forEach(({ loop, row, pause, resume }) => {
          row?.removeEventListener("pointerenter", pause)
          row?.removeEventListener("pointerleave", resume)
          gsap.set(loop.track, { clearProps: "transform" })
        })
        imagePulse.kill()
        gsap.set(".campus-film-card img", { clearProps: "transform" })
      }
    },
    { scope: containerRef }
  )

  return (
    <>
      <section
        ref={containerRef}
        aria-label="校园影像横向胶片画廊"
        className="relative overflow-hidden border bg-sidebar font-mono text-sidebar-foreground"
      >
        <div className="grid gap-6 p-4 sm:p-6">
          <header data-gallery-heading className="grid gap-3">
            <p className="text-xs font-semibold tracking-[0.18em] text-sidebar-foreground/60 uppercase">
              Horizontal Film Gallery
            </p>
            <h2 className="max-w-4xl text-3xl leading-tight font-semibold sm:text-4xl">
              沿着校史馆原始分类横向翻看片段
            </h2>
            <p className="max-w-3xl text-sm leading-7 text-sidebar-foreground/72">
              两条历史胶片轨道与一条现代彩色影像轨道使用 GSAP timeline
              持续横向循环；点击任意小图可放大预览。
            </p>
          </header>

          <div
            data-loop-row
            className="overflow-hidden border-y border-sidebar-foreground/20 py-3"
          >
            <div
              data-loop-track
              data-speed="34"
              className="campus-film-ticker flex w-max will-change-transform"
            >
              {[0, 1, 2].map((segmentIndex) => (
                <div
                  data-loop-segment={segmentIndex === 0 ? "" : undefined}
                  className="flex shrink-0 gap-3 pr-3"
                  key={`ticker-segment-${segmentIndex}`}
                >
                  {compactVintage.map((image, index) => (
                    <button
                      type="button"
                      className="film-perf-frame w-36 shrink-0 bg-slate-950 p-2 pt-5 pb-5 text-left text-[10px] transition duration-200 hover:-translate-y-1 hover:border-sidebar-foreground/55"
                      key={`${image.file}-ticker-${segmentIndex}-${index}`}
                      onClick={() => openPreview(image)}
                    >
                      <span className="film-frame-content grid gap-2">
                        <ProgressiveImage
                          src={image.src}
                          alt={image.caption}
                          className="aspect-[4/3] bg-sidebar"
                        />
                        <span className="truncate text-sidebar-foreground/70">
                          {image.year} / {image.zone}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </div>

          <div data-loop-row className="min-w-0 overflow-hidden py-2">
            <div
              data-loop-track
              data-speed="36"
              className="campus-film-track flex w-max will-change-transform"
            >
              {[0, 1, 2].map((segmentIndex) => (
                <div
                  data-loop-segment={segmentIndex === 0 ? "" : undefined}
                  className="flex shrink-0 gap-4 pr-4"
                  key={`primary-segment-${segmentIndex}`}
                >
                  {primaryVintage.map((image, index) => (
                    <figure
                      className="campus-film-card film-perf-frame w-[78vw] max-w-[520px] shrink-0 bg-slate-950 p-3 pt-7 pb-7 shadow-2xl shadow-black/25 transition duration-200 hover:-translate-y-1 hover:border-sidebar-foreground/55 sm:w-[420px]"
                      key={`${image.file}-${segmentIndex}-${index}`}
                    >
                      <button
                        type="button"
                        className="film-frame-content grid w-full gap-3 text-left"
                        onClick={() => openPreview(image)}
                      >
                        <ProgressiveImage
                          src={image.src}
                          alt={image.caption}
                          className="aspect-[4/3] bg-sidebar"
                        />
                        <figcaption className="grid min-w-0 gap-1 text-sidebar-foreground">
                          <span className="truncate text-sm font-semibold">
                            {image.building}
                          </span>
                          <span className="truncate text-xs text-sidebar-foreground/66">
                            {image.zone} · {image.year} · {image.caption}
                          </span>
                        </figcaption>
                      </button>
                    </figure>
                  ))}
                </div>
              ))}
            </div>
          </div>

          <div
            data-loop-row
            className="overflow-hidden border-t border-sidebar-foreground/20 pt-4"
          >
            <div className="mb-3 flex items-center justify-between gap-3 text-xs text-sidebar-foreground/66">
              <span className="font-semibold tracking-[0.16em] uppercase">
                Modern Color Row
              </span>
              <span>现代彩色影像</span>
            </div>
            <div
              data-loop-track
              data-direction="right"
              data-speed="32"
              className="flex w-max will-change-transform"
            >
              {[0, 1, 2].map((segmentIndex) => (
                <div
                  data-loop-segment={segmentIndex === 0 ? "" : undefined}
                  className="flex shrink-0 gap-3 pr-3"
                  key={`modern-segment-${segmentIndex}`}
                >
                  {modernColor.map((image, index) => (
                    <button
                      type="button"
                      className="grid w-52 shrink-0 gap-2 border bg-background p-2 text-left text-foreground shadow-sm transition duration-200 hover:-translate-y-1 hover:border-sidebar-foreground/60"
                      key={`${image.file}-modern-${segmentIndex}-${index}`}
                      onClick={() => openPreview(image)}
                    >
                      <ProgressiveImage
                        src={image.src}
                        alt={image.caption}
                        className="aspect-[4/3]"
                      />
                      <span className="truncate text-xs">
                        {image.year} / {image.building}
                      </span>
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </div>
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
