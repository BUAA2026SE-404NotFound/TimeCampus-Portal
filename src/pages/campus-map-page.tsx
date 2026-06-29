import { useRef } from "react"
import { ArrowLeft } from "lucide-react"
import { gsap } from "gsap"
import { useGSAP } from "@gsap/react"

import { PortalCampusMap } from "@/components/portal-campus-map"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"
import { Button } from "@/components/ui/button"

gsap.registerPlugin(useGSAP)

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
            "[data-map-surface]",
            {
              autoAlpha: 0,
              y: 24,
              scale: 0.99,
            },
            "-=0.25"
          )

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
                Campus Map Agent
              </p>
              <h1 className="text-3xl leading-tight font-semibold sm:text-4xl">
                校园智能导览
              </h1>
              <p className="max-w-3xl leading-7 text-muted-foreground">
                查询校园景点与历史影像，选择当前位置或景点作为起点，并在卫星地图上规划多点步行路线。
              </p>
            </div>
            <Button className="w-fit rounded-none font-mono" onClick={onBack}>
              <ArrowLeft data-icon="inline-start" />
              返回主页
            </Button>
          </header>

          <section data-map-surface>
            <PortalCampusMap />
          </section>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
