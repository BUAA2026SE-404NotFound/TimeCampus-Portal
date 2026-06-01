import { useRef } from "react"
import { gsap } from "gsap"
import { useGSAP } from "@gsap/react"

import { AdminConsoleCard } from "@/components/admin-console-card"
import { CampusMapEntryCard } from "@/components/campus-map-entry-card"
import { CampusHero } from "@/components/campus-hero"
import { CampusImageOrbit } from "@/components/campus-image-orbit"
import { ContactUsCard } from "@/components/contact-us-card"
import { MiniProgramCard } from "@/components/mini-program-card"
import { ProjectInfoCard } from "@/components/project-info-card"
import { PortalStatsCharts } from "@/components/portal-stats-charts"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"

gsap.registerPlugin(useGSAP)

export function PortalPage({
  onProjectDetail,
  onMiniProgramDetail,
  onCampusMap,
  onEnterAdmin,
  onRegisterAdmin,
}: {
  onProjectDetail: () => void
  onMiniProgramDetail: () => void
  onCampusMap: () => void
  onEnterAdmin: () => void
  onRegisterAdmin: () => void
}) {
  const pageRef = useRef<HTMLDivElement | null>(null)

  useGSAP(
    () => {
      const mm = gsap.matchMedia()

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const timeline = gsap.timeline({
          defaults: { duration: 0.7, ease: "power2.out" },
        })

        timeline
          .from("[data-site-header]", { autoAlpha: 0, y: -14 })
          .from(
            "[data-portal-card]",
            {
              autoAlpha: 0,
              y: 22,
              scale: 0.985,
              stagger: 0.08,
            },
            "-=0.3"
          )
          .from(
            "[data-portal-visual]",
            {
              autoAlpha: 0,
              y: 16,
              scale: 0.99,
            },
            "-=0.35"
          )
          .from(
            "[data-portal-bottom]",
            {
              autoAlpha: 0,
              y: 24,
              scale: 0.985,
              stagger: 0.08,
            },
            "-=0.25"
          )

        gsap.to("[data-portal-card] > *, [data-portal-bottom] > *", {
          y: (index) => (index % 2 === 0 ? -4 : 4),
          duration: 3.2,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
          stagger: 0.18,
        })

        const hoverTargets =
          gsap.utils.toArray<HTMLElement>("[data-hover-lift]")
        const enterHandlers = hoverTargets.map((target) => {
          const onEnter = () =>
            gsap.to(target, {
              y: -6,
              scale: 1.01,
              duration: 0.22,
              ease: "power2.out",
            })
          const onLeave = () =>
            gsap.to(target, {
              y: 0,
              scale: 1,
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

        return () => {
          enterHandlers.forEach((cleanup) => cleanup())
        }
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
      <div data-site-header>
        <SiteHeader />
      </div>
      <main className="flex-1 px-4 py-6 sm:px-6">
        <div className="mx-auto grid w-full max-w-6xl gap-4">
          <div data-portal-visual>
            <CampusHero onExplore={onProjectDetail} />
          </div>
          <section className="grid gap-4 lg:grid-cols-3">
            <div
              data-hover-lift
              data-portal-card
              className="h-full will-change-transform"
            >
              <ProjectInfoCard onDetail={onProjectDetail} />
            </div>
            <div
              data-hover-lift
              data-portal-card
              className="h-full will-change-transform"
            >
              <MiniProgramCard onDetail={onMiniProgramDetail} />
            </div>
            <div
              data-hover-lift
              data-portal-card
              className="h-full will-change-transform"
            >
              <CampusMapEntryCard onOpen={onCampusMap} />
            </div>
          </section>
          <div data-portal-visual>
            <PortalStatsCharts />
          </div>
          <div id="campus-frames" data-portal-visual className="scroll-mt-4">
            <CampusImageOrbit />
          </div>
          <section className="grid gap-4 border-t pt-4 lg:grid-cols-[0.95fr_1.05fr]">
            <div
              data-hover-lift
              data-portal-bottom
              className="h-full will-change-transform"
            >
              <AdminConsoleCard
                onEnter={onEnterAdmin}
                onRegister={onRegisterAdmin}
              />
            </div>
            <div
              data-hover-lift
              data-portal-bottom
              className="h-full will-change-transform"
            >
              <ContactUsCard />
            </div>
          </section>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
