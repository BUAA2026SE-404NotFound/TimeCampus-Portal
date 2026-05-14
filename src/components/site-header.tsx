export function SiteHeader() {
  return (
    <header className="grid gap-4 border bg-white p-5 font-mono sm:grid-cols-[1fr_auto] sm:items-end">
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="grid size-14 place-items-center border bg-muted/30 p-2">
            <img
              className="size-full object-contain"
              src="/logo.png"
              alt="时光航迹 Logo"
            />
          </div>
          <div>
            <p className="text-sm font-semibold text-muted-foreground uppercase">
              TimeCampus
            </p>
            <h1 className="text-3xl font-semibold tracking-tight">时光航迹</h1>
          </div>
        </div>
        <p className="max-w-2xl leading-7 text-muted-foreground">
          面向校园历史 POI、官方内容、用户投稿和地图运营的管理入口。
        </p>
      </div>
      <a
        className="self-end justify-self-end bg-[#171717] px-3 py-2 text-xs font-semibold text-white hover:bg-[#2a2a2a]"
        href="#admin-access"
      >
        管理端入口
      </a>
    </header>
  )
}
