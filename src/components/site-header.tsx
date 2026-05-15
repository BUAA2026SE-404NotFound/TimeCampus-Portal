import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

const navItems = [
  { label: "项目信息", href: "#project-info" },
  { label: "用户端", href: "#mini-program" },
  { label: "管理端", href: "#admin-console" },
  { label: "联系我们", href: "#contact-us" },
]

export function SiteHeader() {
  return (
    <header className="bg-[#171717] font-mono text-white dark:bg-[#1f1f1f]">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-4 px-4 sm:px-6">
        <a className="shrink-0" href="#project-info">
          <p className="text-[11px] font-semibold leading-none text-white/60 uppercase">
            TimeCampus
          </p>
          <span className="text-xl font-semibold leading-tight">时光航迹</span>
        </a>
        <nav
          className="hidden items-center gap-5 text-sm md:flex"
          aria-label="主导航"
        >
          {navItems.map((item) => (
            <a
              key={item.href}
              className="text-white/70 hover:text-white"
              href={item.href}
            >
              {item.label}
            </a>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                className="rounded-none px-2 font-mono text-white hover:bg-white/10 hover:text-white md:hidden"
              >
                <span className="mr-2 grid gap-1" aria-hidden="true">
                  <span className="block h-0.5 w-5 bg-current" />
                  <span className="block h-0.5 w-5 bg-current" />
                </span>
                Menu
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="rounded-none">
              <SheetHeader>
                <SheetTitle>目录</SheetTitle>
              </SheetHeader>
              <nav className="mt-8 grid gap-3 text-sm" aria-label="移动端导航">
                {navItems.map((item) => (
                  <SheetClose asChild key={item.href}>
                    <a
                      className="border px-3 py-3 hover:bg-muted"
                      href={item.href}
                    >
                      {item.label}
                    </a>
                  </SheetClose>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
