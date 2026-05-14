import { AdminAccessCard } from "@/components/admin-access-card"
import { ContactFormCard } from "@/components/contact-form-card"
import { MiniProgramCard } from "@/components/mini-program-card"
import { ProductIdentityCard } from "@/components/product-identity-card"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"

export function App() {
  return (
    <main className="min-h-svh bg-[#f2f2f2] px-4 py-6 text-foreground sm:px-6">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <SiteHeader />

        <section className="grid gap-4 landscape:grid-cols-2">
          <ProductIdentityCard />
          <AdminAccessCard />
          <MiniProgramCard />
          <ContactFormCard />
        </section>

        <SiteFooter />
      </div>
    </main>
  )
}

export default App
