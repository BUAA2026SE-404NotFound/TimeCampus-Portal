import { useRef } from "react"
import { ArrowLeft, MousePointerClick, Radar, Route } from "lucide-react"
import { gsap } from "gsap"
import { useGSAP } from "@gsap/react"

import { PortalCampusMap } from "@/components/portal-campus-map"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"
import { Button } from "@/components/ui/button"

gsap.registerPlugin(useGSAP)

const mapTimeline = [
  {
    icon: Radar,
    title: "加载卫星底图",
    description: "进入页面后再初始化腾讯地图与校园边界。",
  },
  {
    icon: Route,
    title: "按年代筛选",
    description: "拖动时间滑块，查看指定年份具有影像记录的点位。",
  },
  {
    icon: MousePointerClick,
    title: "隐藏后检索",
    description: "隐藏 POI 后点击地图，会按距离列出附近影像点位。",
  },
]

export function CampusMapPage({ onBack }: { onBack: () => void }) {
  const pageRef = useRef<HTMLDivElement | null>(null)

  useGSAP(
    () => {
      const mm = gsap.matchMedia()

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const timeline = gsap.timeline({
          defaults: { duration: 0.65, ease: "power2.out" },
        })

        timeline
          .from("[data-map-header] > *", {
            autoAlpha: 0,
            y: 18,
            stagger: 0.08,
          })
          .from(
            "[data-map-step]",
            {
              autoAlpha: 0,
              x: -18,
              stagger: 0.08,
            },
            "-=0.25"
          )
          .from(
            "[data-map-surface]",
            {
              autoAlpha: 0,
              y: 24,
              scale: 0.99,
            },
            "-=0.25"
          )

        const stepTargets = gsap.utils.toArray<HTMLElement>("[data-map-step]")
        const cleanup = stepTargets.map((target) => {
          const onEnter = () =>
            gsap.to(target, {
              x: 6,
              duration: 0.22,
              ease: "power2.out",
            })
          const onLeave = () =>
            gsap.to(target, {
              x: 0,
              duration: 0.22,
              ease: "power2.out",
            })
          target.addEventListener("pointerenter", onEnter)
          target.addEventListener("pointerleave", onLeave)
          return () => {
            target.removeEventListener("pointerenter", onEnter)
            target.removeEventListener("pointerleave", onLeave)
          }
        })

        return () => cleanup.forEach((item) => item())
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
        <div className="mx-auto grid w-full max-w-7xl gap-4">
          <header
            data-map-header
            className="grid gap-4 border bg-card p-5 font-mono sm:p-6 lg:grid-cols-[1fr_auto] lg:items-end"
          >
            <div className="grid gap-3">
              <p className="text-sm font-semibold text-muted-foreground uppercase">
                Campus Satellite Map
              </p>
              <h1 className="text-3xl leading-tight font-semibold sm:text-4xl">
                校园卫星地图与 POI 影像浏览
              </h1>
              <p className="max-w-3xl leading-7 text-muted-foreground">
                地图资源在本页按需加载，点击 POI
                后可以查看地点信息、年代标签和关联影像；也可以按年代浏览或隐藏标记后查询附近点位。
              </p>
            </div>
            <Button className="w-fit rounded-none font-mono" onClick={onBack}>
              <ArrowLeft data-icon="inline-start" />
              返回主页
            </Button>
          </header>

          <section className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
            <div className="grid gap-3 border bg-card p-4 font-mono">
              {mapTimeline.map((item, index) => {
                const Icon = item.icon

                return (
                  <div
                    key={item.title}
                    data-map-step
                    className="grid grid-cols-[auto_1fr] gap-3 border bg-muted/20 p-3 will-change-transform"
                  >
                    <div className="grid size-9 place-items-center border bg-background">
                      <Icon />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">
                        0{index + 1}
                      </p>
                      <h2 className="mt-1 font-semibold">{item.title}</h2>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">
                        {item.description}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
            <div data-map-surface>
              <PortalCampusMap />
            </div>
          </section>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
