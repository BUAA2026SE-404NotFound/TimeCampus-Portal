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

export function SiteHeader({ showNav = true }: { showNav?: boolean }) {
  return (
    <header className="bg-sidebar font-mono text-sidebar-foreground">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-4 px-4 sm:px-6">
        <a className="shrink-0" href={showNav ? "#project-info" : "/"}>
          <p className="text-[11px] leading-none font-semibold text-sidebar-foreground/65 uppercase">
            TimeCampus
          </p>
          <span className="text-xl leading-tight font-semibold">时光航迹</span>
        </a>
        {showNav && (
          <nav
            className="hidden items-center gap-5 text-sm md:flex"
            aria-label="主导航"
          >
            {navItems.map((item) => (
              <a
                key={item.href}
                className="text-sidebar-foreground/75 hover:text-sidebar-foreground"
                href={item.href}
              >
                {item.label}
              </a>
            ))}
          </nav>
        )}
        <div className="ml-auto flex items-center gap-2">
          {showNav && (
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  className="rounded-none px-2 font-mono text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground md:hidden"
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
                <nav
                  className="mt-8 grid gap-3 text-sm"
                  aria-label="移动端导航"
                >
                  {navItems.map((item) => (
                    <SheetClose asChild key={item.href}>
                      <a className="border p-3 hover:bg-muted" href={item.href}>
                        {item.label}
                      </a>
                    </SheetClose>
                  ))}
                </nav>
              </SheetContent>
            </Sheet>
          )}
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
