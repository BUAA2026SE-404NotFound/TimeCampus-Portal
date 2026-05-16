import { useState } from "react"

import { AdminConsole } from "@/components/admin-console"
import { AdminConsoleCard } from "@/components/admin-console-card"
import { ContactUsCard } from "@/components/contact-us-card"
import { MiniProgramCard } from "@/components/mini-program-card"
import { ProjectInfoCard } from "@/components/project-info-card"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"

export function App() {
  const [view, setView] = useState<"portal" | "admin">("portal")

  if (view === "admin") {
    return <AdminConsole onBack={() => setView("portal")} />
  }

  return (
    <div className="flex min-h-svh flex-col bg-[#f2f2f2] text-foreground dark:bg-[#262626]">
      <SiteHeader />
      <main className="flex-1 px-4 py-6 sm:px-6">
        <div className="mx-auto w-full max-w-6xl">
          <section className="grid gap-4 landscape:grid-cols-2">
            <ProjectInfoCard />
            <MiniProgramCard />
            <AdminConsoleCard onEnter={() => setView("admin")} />
            <ContactUsCard />
          </section>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}

export default App
