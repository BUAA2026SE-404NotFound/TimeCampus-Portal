import { ContactForm } from "@/components/contact-form"

export function App() {
  return (
    <main className="bg-muted/40 text-foreground min-h-svh p-6">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <header className="space-y-2">
          <p className="text-muted-foreground text-sm font-medium">TimeCampus 管理端</p>
          <h1 className="text-3xl font-semibold tracking-tight">联系表单</h1>
        </header>
        <ContactForm />
      </div>
    </main>
  )
}

export default App
