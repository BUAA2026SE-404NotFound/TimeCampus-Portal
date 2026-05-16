import * as React from "react"
import {
  BookOpenCheck,
  Check,
  Clock3,
  FileUp,
  Gauge,
  History,
  Landmark,
  LogOut,
  Map,
  MapPinned,
  MessageSquareWarning,
  MoreHorizontal,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  Upload,
  X,
} from "lucide-react"
import { toast } from "sonner"

import {
  getAdminSnapshot,
  getStoredAdminProfile,
  loginAdmin,
  logoutAdmin,
  type AdminSnapshot,
} from "@/api/admin"
import { ThemeToggle } from "@/components/theme-toggle"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import type {
  AdminProfile,
  CommentItem,
  Poi,
  PublishStatus,
  ReviewStatus,
  UgcItem,
} from "@/mocks/admin"

type PageId =
  | "dashboard"
  | "pois"
  | "imports"
  | "ugc"
  | "comments"
  | "map-tools"
  | "ops-map"
  | "logs"

type NavigationItem = {
  id: PageId
  label: string
  description: string
  icon: typeof Gauge
  badge?: number
}

const navigationGroups: Array<{
  label: string
  items: NavigationItem[]
}> = [
  {
    label: "运营",
    items: [
      {
        id: "dashboard",
        label: "Dashboard",
        description: "运营首页",
        icon: Gauge,
      },
      {
        id: "ops-map",
        label: "运营地图",
        description: "校区热度",
        icon: Map,
      },
      {
        id: "logs",
        label: "审计日志",
        description: "操作留痕",
        icon: History,
      },
    ],
  },
  {
    label: "内容",
    items: [
      {
        id: "pois",
        label: "POI 管理",
        description: "点位维护",
        icon: Landmark,
      },
      {
        id: "imports",
        label: "官方内容导入",
        description: "批量入库",
        icon: FileUp,
      },
      {
        id: "ugc",
        label: "UGC 审核",
        description: "投稿处理",
        icon: BookOpenCheck,
        badge: 19,
      },
      {
        id: "comments",
        label: "评论审核",
        description: "评论处理",
        icon: MessageSquareWarning,
        badge: 31,
      },
    ],
  },
  {
    label: "工具",
    items: [
      {
        id: "map-tools",
        label: "地图工具",
        description: "地理编码",
        icon: MapPinned,
      },
    ],
  },
]

const pageTitles: Record<PageId, { title: string; description: string }> = {
  dashboard: {
    title: "运营首页",
    description: "Alpha 阶段核心指标、审核队列与近期操作概览。",
  },
  pois: {
    title: "POI 管理",
    description: "维护校园兴趣点、坐标、状态和内容覆盖。",
  },
  imports: {
    title: "官方内容批量导入",
    description: "导入官方历史影像与内容，默认通过审核并可见。",
  },
  ugc: {
    title: "UGC 审核",
    description: "处理用户投稿，驳回时必须填写明确原因。",
  },
  comments: {
    title: "评论审核",
    description: "审核用户评论，保留审核状态与操作痕迹。",
  },
  "map-tools": {
    title: "地图工具",
    description: "通过后端封装接口完成逆地理编码与 POI 搜索。",
  },
  "ops-map": {
    title: "运营地图",
    description: "查看校区内容覆盖、互动热度和异常区域。",
  },
  logs: {
    title: "审计日志",
    description: "查询后台关键操作记录，便于回溯与排查。",
  },
}

const statusText: Record<ReviewStatus | PublishStatus | Poi["status"], string> =
  {
    ACTIVE: "启用",
    INACTIVE: "停用",
    PENDING: "待审核",
    APPROVED: "已通过",
    REJECTED: "已驳回",
    VISIBLE: "可见",
    HIDDEN: "隐藏",
  }

function AdminLogo() {
  return (
    <div className="grid size-10 place-items-center border bg-background">
      <img
        className="max-h-7 max-w-7 object-contain"
        src="/project-logo.png"
        alt="时光航迹 Logo"
      />
    </div>
  )
}

function StatusBadge({
  status,
}: {
  status: ReviewStatus | PublishStatus | Poi["status"]
}) {
  const variant =
    status === "ACTIVE" || status === "APPROVED" || status === "VISIBLE"
      ? "default"
      : status === "PENDING"
        ? "secondary"
        : "outline"

  return (
    <Badge variant={variant} className="rounded-none">
      {statusText[status]}
    </Badge>
  )
}

function EmptyTableRow({ colSpan, label }: { colSpan: number; label: string }) {
  return (
    <TableRow>
      <TableCell
        colSpan={colSpan}
        className="h-24 text-center text-muted-foreground"
      >
        {label}
      </TableCell>
    </TableRow>
  )
}

function LoginScreen({
  onLogin,
  onBack,
}: {
  onLogin: (profile: AdminProfile) => void
  onBack?: () => void
}) {
  const [email, setEmail] = React.useState("admin@timecampus.local")
  const [password, setPassword] = React.useState("timecampus")
  const [loading, setLoading] = React.useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)

    try {
      const result = await loginAdmin({ email, password })
      toast.success("已进入管理端")
      onLogin(result.profile)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "登录失败")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-svh flex-col bg-[#f2f2f2] font-mono dark:bg-[#262626]">
      <header className="bg-[#171717] text-white dark:bg-[#1f1f1f]">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-4 px-4 sm:px-6">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-white/60 uppercase">
              TimeCampus Admin
            </p>
            <p className="truncate text-xl font-semibold">时光航迹管理端</p>
          </div>
          <div className="ml-auto">
            <div className="flex items-center gap-2">
              {onBack && (
                <Button
                  type="button"
                  variant="ghost"
                  className="rounded-none font-mono text-white hover:bg-white/10 hover:text-white"
                  onClick={onBack}
                >
                  返回门户
                </Button>
              )}
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>
      <main className="grid flex-1 place-items-center px-4 py-8">
        <Card className="w-full max-w-md rounded-none bg-card shadow-none">
          <CardHeader>
            <CardTitle className="text-2xl">管理员登录</CardTitle>
            <CardDescription>
              开发环境使用 mock 登录，后续接入 POST /api/admin/login。
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="admin-email">邮箱</FieldLabel>
                  <Input
                    id="admin-email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="rounded-none"
                    autoComplete="username"
                    required
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="admin-password">密码</FieldLabel>
                  <Input
                    id="admin-password"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="rounded-none"
                    autoComplete="current-password"
                    required
                  />
                  <FieldDescription>
                    本地 token key：TimeCampus-Admin-Token。
                  </FieldDescription>
                </Field>
              </FieldGroup>
            </CardContent>
            <CardFooter className="border-t bg-muted/30">
              <Button
                type="submit"
                className="w-full rounded-none font-mono"
                disabled={loading}
              >
                <ShieldCheck data-icon="inline-start" />
                {loading ? "登录中" : "登录"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </main>
      <AdminFooter />
    </div>
  )
}

function AppSidebar({
  activePage,
  onPageChange,
  profile,
  onLogout,
}: {
  activePage: PageId
  onPageChange: (page: PageId) => void
  profile: AdminProfile
  onLogout: () => void
}) {
  const { open } = useSidebar()

  return (
    <Sidebar collapsible="icon" className="font-mono">
      <SidebarHeader>
        <div
          className={cn("flex items-center gap-3", !open && "justify-center")}
        >
          <AdminLogo />
          {open && (
            <div className="min-w-0">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase">
                TimeCampus
              </p>
              <p className="truncate text-base font-semibold">管理端</p>
            </div>
          )}
        </div>
      </SidebarHeader>
      <SidebarSeparator />
      <SidebarContent>
        {navigationGroups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      type="button"
                      isActive={activePage === item.id}
                      tooltip={item.label}
                      onClick={() => onPageChange(item.id)}
                    >
                      <item.icon />
                      {open && <span className="truncate">{item.label}</span>}
                    </SidebarMenuButton>
                    {item.badge ? (
                      <SidebarMenuBadge>{item.badge}</SidebarMenuBadge>
                    ) : null}
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter>
        <div
          className={cn("flex items-center gap-3", !open && "justify-center")}
        >
          <Avatar className="size-9 rounded-none">
            <AvatarFallback className="rounded-none">TA</AvatarFallback>
          </Avatar>
          {open && (
            <div className="min-w-0 text-sm">
              <p className="truncate font-medium">{profile.name}</p>
              <p className="truncate text-xs text-muted-foreground">
                {profile.role}
              </p>
            </div>
          )}
        </div>
        {open && (
          <Button
            variant="outline"
            className="w-full rounded-none font-mono"
            onClick={onLogout}
          >
            <LogOut data-icon="inline-start" />
            退出登录
          </Button>
        )}
      </SidebarFooter>
    </Sidebar>
  )
}

function AdminHeader({
  activePage,
  snapshot,
  onBack,
}: {
  activePage: PageId
  snapshot: AdminSnapshot | null
  onBack?: () => void
}) {
  const page = pageTitles[activePage]

  return (
    <header className="sticky top-0 border-b bg-background/95 px-4 py-3 font-mono backdrop-blur sm:px-6">
      <div className="flex items-center gap-3">
        <SidebarTrigger />
        <div className="min-w-0">
          <h1 className="truncate text-xl font-semibold">{page.title}</h1>
          <p className="truncate text-sm text-muted-foreground">
            {page.description}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {onBack && (
            <Button
              type="button"
              variant="outline"
              className="hidden rounded-none font-mono sm:inline-flex"
              onClick={onBack}
            >
              返回门户
            </Button>
          )}
          <div className="hidden items-center gap-2 text-sm text-muted-foreground lg:flex">
            <Clock3 />
            2026-05-15 运营视图
          </div>
          <ThemeToggle />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="rounded-none">
                <MoreHorizontal />
                <span className="sr-only">打开更多操作</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-none font-mono">
              <DropdownMenuGroup>
                <DropdownMenuItem onSelect={() => toast.info("刷新请求已发送")}>
                  刷新数据
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => toast.info("API 适配层位于 src/api")}
                >
                  查看 API 适配层
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      {!snapshot && (
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          <Skeleton className="h-2 rounded-none" />
          <Skeleton className="h-2 rounded-none" />
          <Skeleton className="h-2 rounded-none" />
        </div>
      )}
    </header>
  )
}

function AdminFooter() {
  return (
    <footer className="border-t bg-[#171717] px-4 py-4 font-mono text-sm text-white sm:px-6 dark:bg-[#1f1f1f]">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p>© 2026 北航敏捷开发软件工程</p>
        <div className="flex flex-wrap gap-x-4 gap-y-2 text-white/70">
          <a href="mailto:kurna2026@outlook.com" className="underline">
            开发团队联系
          </a>
          <a
            href="https://beian.miit.gov.cn/"
            target="_blank"
            rel="noreferrer"
            className="underline"
          >
            京ICP备2026018715号-2
          </a>
        </div>
      </div>
    </footer>
  )
}

function DashboardPage({ snapshot }: { snapshot: AdminSnapshot }) {
  const maxVisits = Math.max(...snapshot.trends.map((item) => item.visits))
  const totalReview =
    snapshot.ugc.length + snapshot.comments.length + snapshot.pois.length

  return (
    <div className="flex flex-col gap-4">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {snapshot.metrics.map((metric) => (
          <Card key={metric.label} className="rounded-none shadow-none">
            <CardHeader>
              <CardDescription>{metric.label}</CardDescription>
              <CardTitle className="text-3xl">{metric.value}</CardTitle>
              <CardAction>
                <metric.icon />
              </CardAction>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              {metric.detail}
            </CardContent>
            <CardFooter className="border-t bg-muted/30 text-sm">
              {metric.trend}
            </CardFooter>
          </Card>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
        <Card className="rounded-none shadow-none">
          <CardHeader>
            <CardTitle>访问 / 投稿趋势</CardTitle>
            <CardDescription>
              保留真实图表 API 接入点，当前为 mock 数据。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex h-72 items-end gap-3 border bg-muted/20 p-4">
              {snapshot.trends.map((item) => (
                <div
                  key={item.date}
                  className="flex flex-1 flex-col items-center gap-2"
                >
                  <div className="flex h-56 w-full items-end gap-1">
                    <div
                      className="w-full bg-primary"
                      style={{ height: `${(item.visits / maxVisits) * 100}%` }}
                      title={`访问 ${item.visits}`}
                    />
                    <div
                      className="w-full bg-muted-foreground"
                      style={{ height: `${(item.submissions / 50) * 100}%` }}
                      title={`投稿 ${item.submissions}`}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {item.date}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-none shadow-none">
          <CardHeader>
            <CardTitle>审核状态分布</CardTitle>
            <CardDescription>UGC、评论与 POI 状态聚合。</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {[
              { label: "UGC 待处理", value: snapshot.ugc.length },
              { label: "评论待处理", value: snapshot.comments.length },
              { label: "POI 总量", value: snapshot.pois.length },
            ].map((item) => (
              <div key={item.label} className="flex flex-col gap-2">
                <div className="flex items-center justify-between text-sm">
                  <span>{item.label}</span>
                  <span className="text-muted-foreground">{item.value}</span>
                </div>
                <Progress
                  value={(item.value / totalReview) * 100}
                  className="h-2 rounded-none"
                />
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <Card className="rounded-none shadow-none">
          <CardHeader>
            <CardTitle>POI 热度排行</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>POI</TableHead>
                  <TableHead>校区</TableHead>
                  <TableHead className="text-right">互动热度</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...snapshot.pois]
                  .sort((a, b) => b.heat - a.heat)
                  .map((poi) => (
                    <TableRow key={poi.id}>
                      <TableCell className="font-medium">{poi.name}</TableCell>
                      <TableCell>{poi.region}</TableCell>
                      <TableCell className="text-right">{poi.heat}</TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="rounded-none shadow-none">
          <CardHeader>
            <CardTitle>最近审计日志</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {snapshot.logs.slice(0, 4).map((log) => (
              <div key={log.id} className="border p-3">
                <div className="flex items-center justify-between gap-3">
                  <Badge variant="outline" className="rounded-none">
                    {log.type}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {log.createdAt}
                  </span>
                </div>
                <p className="mt-2 text-sm">{log.action}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  )
}

function PoiPage({ initialPois }: { initialPois: Poi[] }) {
  const [items, setItems] = React.useState(initialPois)
  const [keyword, setKeyword] = React.useState("")
  const [status, setStatus] = React.useState<"ALL" | Poi["status"]>("ALL")

  const filteredPois = items.filter((poi) => {
    const matchesKeyword = `${poi.name}${poi.region}`
      .toLowerCase()
      .includes(keyword.toLowerCase())
    const matchesStatus = status === "ALL" || poi.status === status

    return matchesKeyword && matchesStatus
  })

  function deletePoi(id: string) {
    setItems((current) => current.filter((poi) => poi.id !== id))
    toast.success("POI 已删除")
  }

  return (
    <div className="flex flex-col gap-4">
      <Card className="rounded-none shadow-none">
        <CardHeader>
          <CardTitle>筛选与操作</CardTitle>
          <CardDescription>
            POI 坐标校验范围：纬度 -90..90，经度 -180..180。
          </CardDescription>
          <CardAction>
            <Dialog>
              <DialogTrigger asChild>
                <Button className="rounded-none font-mono">
                  <Plus data-icon="inline-start" />
                  新增 POI
                </Button>
              </DialogTrigger>
              <DialogContent className="rounded-none font-mono sm:max-w-xl">
                <DialogHeader>
                  <DialogTitle>新增 POI</DialogTitle>
                  <DialogDescription>
                    当前提交进入 API adapter mock 层。
                  </DialogDescription>
                </DialogHeader>
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="poi-name">名称</FieldLabel>
                    <Input
                      id="poi-name"
                      className="rounded-none"
                      placeholder="沙河主楼"
                    />
                  </Field>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field>
                      <FieldLabel htmlFor="poi-lat">纬度</FieldLabel>
                      <Input
                        id="poi-lat"
                        className="rounded-none"
                        placeholder="40.15938"
                      />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="poi-lng">经度</FieldLabel>
                      <Input
                        id="poi-lng"
                        className="rounded-none"
                        placeholder="116.28791"
                      />
                    </Field>
                  </div>
                </FieldGroup>
                <DialogFooter>
                  <Button
                    className="rounded-none font-mono"
                    onClick={() => toast.success("POI 已保存到 mock 队列")}
                  >
                    保存
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardAction>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-[1fr_180px]">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              className="rounded-none pl-9"
              placeholder="搜索 POI 或校区"
            />
          </div>
          <Select
            value={status}
            onValueChange={(value) => setStatus(value as typeof status)}
          >
            <SelectTrigger className="w-full rounded-none">
              <SelectValue placeholder="状态" />
            </SelectTrigger>
            <SelectContent className="rounded-none">
              <SelectGroup>
                <SelectItem value="ALL">全部状态</SelectItem>
                <SelectItem value="ACTIVE">启用</SelectItem>
                <SelectItem value="INACTIVE">停用</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card className="rounded-none shadow-none">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>名称</TableHead>
                <TableHead>校区</TableHead>
                <TableHead>坐标</TableHead>
                <TableHead>覆盖率</TableHead>
                <TableHead>状态</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPois.length ? (
                filteredPois.map((poi) => (
                  <TableRow key={poi.id}>
                    <TableCell className="font-medium">{poi.name}</TableCell>
                    <TableCell>{poi.region}</TableCell>
                    <TableCell>
                      {poi.latitude.toFixed(5)}, {poi.longitude.toFixed(5)}
                    </TableCell>
                    <TableCell>
                      <div className="flex min-w-28 items-center gap-2">
                        <Progress
                          value={poi.coverage}
                          className="h-2 rounded-none"
                        />
                        <span className="text-xs text-muted-foreground">
                          {poi.coverage}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={poi.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="rounded-none"
                          >
                            <Trash2 />
                            <span className="sr-only">删除 POI</span>
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="rounded-none font-mono">
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              删除 {poi.name}？
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              删除操作会影响时间切换与内容关联，真实 API 应调用
                              DELETE /api/admin/pois/{poi.id}。
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="rounded-none font-mono">
                              取消
                            </AlertDialogCancel>
                            <AlertDialogAction
                              className="rounded-none font-mono"
                              onClick={() => deletePoi(poi.id)}
                            >
                              删除
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <EmptyTableRow colSpan={6} label="没有匹配的 POI" />
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

function ImportsPage({ snapshot }: { snapshot: AdminSnapshot }) {
  return (
    <div className="grid gap-4 xl:grid-cols-[360px_1fr]">
      <Card className="rounded-none shadow-none">
        <CardHeader>
          <CardTitle>上传导入文件</CardTitle>
          <CardDescription>
            官方内容默认 type=OFFICIAL，审核通过且可见。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="official-file">文件</FieldLabel>
              <Input id="official-file" type="file" className="rounded-none" />
            </Field>
            <Field>
              <FieldLabel htmlFor="import-note">导入说明</FieldLabel>
              <Textarea
                id="import-note"
                className="min-h-28 rounded-none"
                placeholder="填写来源、批次、版权说明"
              />
            </Field>
          </FieldGroup>
        </CardContent>
        <CardFooter className="border-t bg-muted/30">
          <Button
            className="w-full rounded-none font-mono"
            onClick={() => toast.success("已创建批量导入任务")}
          >
            <Upload data-icon="inline-start" />
            开始导入
          </Button>
        </CardFooter>
      </Card>

      <Card className="rounded-none shadow-none">
        <CardHeader>
          <CardTitle>导入记录</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>文件</TableHead>
                <TableHead>成功 / 总数</TableHead>
                <TableHead>审核</TableHead>
                <TableHead>发布</TableHead>
                <TableHead>操作人</TableHead>
                <TableHead>时间</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {snapshot.imports.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.fileName}</TableCell>
                  <TableCell>
                    {item.success} / {item.total}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={item.reviewStatus} />
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={item.publishStatus} />
                  </TableCell>
                  <TableCell>{item.operator}</TableCell>
                  <TableCell>{item.createdAt}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

function ReviewActions({
  onApprove,
  onReject,
}: {
  onApprove: () => void
  onReject: () => void
}) {
  return (
    <div className="flex justify-end gap-2">
      <Button
        variant="outline"
        size="sm"
        className="rounded-none"
        onClick={onReject}
      >
        <X data-icon="inline-start" />
        驳回
      </Button>
      <Button size="sm" className="rounded-none" onClick={onApprove}>
        <Check data-icon="inline-start" />
        通过
      </Button>
    </div>
  )
}

function UgcReviewPage({ initialItems }: { initialItems: UgcItem[] }) {
  const [items, setItems] = React.useState(initialItems)

  function updateStatus(id: string, reviewStatus: ReviewStatus) {
    setItems((current) =>
      current.map((item) =>
        item.id === id
          ? {
              ...item,
              reviewStatus,
              publishStatus: reviewStatus === "APPROVED" ? "VISIBLE" : "HIDDEN",
            }
          : item
      )
    )
    toast.success(reviewStatus === "APPROVED" ? "投稿已通过" : "投稿已驳回")
  }

  return (
    <ReviewTableCard
      title="投稿队列"
      description="驳回真实请求应提交 reason 到 POST /api/admin/ugc/{id}/reject。"
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>POI / 年份</TableHead>
            <TableHead>投稿人</TableHead>
            <TableHead>描述</TableHead>
            <TableHead>状态</TableHead>
            <TableHead className="text-right">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.length ? (
            items.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  <div className="font-medium">{item.poiName}</div>
                  <div className="text-xs text-muted-foreground">
                    {item.year}
                  </div>
                </TableCell>
                <TableCell>{item.uploader}</TableCell>
                <TableCell className="max-w-md">
                  <p className="line-clamp-2">{item.description}</p>
                  {item.source ? (
                    <p className="mt-1 text-xs text-muted-foreground">
                      来源：{item.source}
                    </p>
                  ) : null}
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <StatusBadge status={item.reviewStatus} />
                    <StatusBadge status={item.publishStatus} />
                  </div>
                </TableCell>
                <TableCell>
                  <ReviewActions
                    onApprove={() => updateStatus(item.id, "APPROVED")}
                    onReject={() => updateStatus(item.id, "REJECTED")}
                  />
                </TableCell>
              </TableRow>
            ))
          ) : (
            <EmptyTableRow colSpan={5} label="暂无待审核投稿" />
          )}
        </TableBody>
      </Table>
    </ReviewTableCard>
  )
}

function CommentReviewPage({ initialItems }: { initialItems: CommentItem[] }) {
  const [items, setItems] = React.useState(initialItems)

  function updateStatus(id: string, reviewStatus: ReviewStatus) {
    setItems((current) =>
      current.map((item) =>
        item.id === id
          ? {
              ...item,
              reviewStatus,
            }
          : item
      )
    )
    toast.success(reviewStatus === "APPROVED" ? "评论已通过" : "评论已驳回")
  }

  return (
    <ReviewTableCard
      title="评论队列"
      description="后端路径变化时只需调整 src/api/comment.ts。"
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>POI</TableHead>
            <TableHead>用户</TableHead>
            <TableHead>评论</TableHead>
            <TableHead>状态</TableHead>
            <TableHead className="text-right">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="font-medium">{item.poiName}</TableCell>
              <TableCell>{item.userName}</TableCell>
              <TableCell className="max-w-md">{item.comment}</TableCell>
              <TableCell>
                <StatusBadge status={item.reviewStatus} />
              </TableCell>
              <TableCell>
                <ReviewActions
                  onApprove={() => updateStatus(item.id, "APPROVED")}
                  onReject={() => updateStatus(item.id, "REJECTED")}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </ReviewTableCard>
  )
}

function ReviewTableCard({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <Card className="rounded-none shadow-none">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="p-0">{children}</CardContent>
    </Card>
  )
}

function MapToolsPage({ snapshot }: { snapshot: AdminSnapshot }) {
  const [lat, setLat] = React.useState("40.15938")
  const [lng, setLng] = React.useState("116.28791")
  const [keyword, setKeyword] = React.useState("主楼")

  return (
    <div className="grid gap-4 xl:grid-cols-[380px_1fr]">
      <Card className="rounded-none shadow-none">
        <CardHeader>
          <CardTitle>逆地理编码</CardTitle>
          <CardDescription>
            只调用后端封装接口，不暴露地图 SecretKey。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="reverse-lat">纬度</FieldLabel>
                <Input
                  id="reverse-lat"
                  value={lat}
                  onChange={(event) => setLat(event.target.value)}
                  className="rounded-none"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="reverse-lng">经度</FieldLabel>
                <Input
                  id="reverse-lng"
                  value={lng}
                  onChange={(event) => setLng(event.target.value)}
                  className="rounded-none"
                />
              </Field>
            </div>
            <Button
              className="rounded-none font-mono"
              onClick={() =>
                toast.info("GET /api/map/reverse-geocode 已进入 mock")
              }
            >
              <MapPinned data-icon="inline-start" />
              查询地址
            </Button>
          </FieldGroup>
        </CardContent>
        <Separator />
        <CardHeader>
          <CardTitle>POI 搜索</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Input
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            className="rounded-none"
            placeholder="keyword"
          />
          <Button
            variant="outline"
            className="rounded-none font-mono"
            onClick={() => toast.info("GET /api/map/poi-search 已进入 mock")}
          >
            <Search data-icon="inline-start" />
            搜索
          </Button>
        </CardContent>
      </Card>

      <Card className="rounded-none shadow-none">
        <CardHeader>
          <CardTitle>搜索结果</CardTitle>
          <CardDescription>当前关键字：{keyword || "未输入"}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          {snapshot.mapResults.map((result) => (
            <div key={result.id} className="border p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="font-medium">{result.name}</p>
                <Badge variant="outline" className="rounded-none">
                  {result.region}
                </Badge>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">
                {result.latitude.toFixed(5)}, {result.longitude.toFixed(5)}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

function OpsMapPage({ snapshot }: { snapshot: AdminSnapshot }) {
  return (
    <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
      <Card className="rounded-none shadow-none">
        <CardHeader>
          <CardTitle>运营地图</CardTitle>
          <CardDescription>
            模拟校区热区与 POI 覆盖，后续接入真实地图 SDK 容器。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative min-h-[460px] overflow-hidden border bg-muted/30">
            <div className="absolute inset-6 border border-dashed" />
            {snapshot.pois.map((poi, index) => (
              <button
                key={poi.id}
                type="button"
                className="absolute grid size-9 place-items-center rounded-full border bg-background text-xs shadow-sm hover:bg-accent"
                style={{
                  left: `${18 + index * 17}%`,
                  top: `${22 + (index % 3) * 19}%`,
                }}
                title={poi.name}
              >
                {index + 1}
              </button>
            ))}
            <div className="absolute right-4 bottom-4 border bg-background p-3 text-xs">
              <p className="font-medium">图例</p>
              <p className="mt-1 text-muted-foreground">
                数字点位代表 POI 热区
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-none shadow-none">
        <CardHeader>
          <CardTitle>覆盖诊断</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {snapshot.pois.map((poi) => (
            <div key={poi.id} className="flex flex-col gap-2 border p-3">
              <div className="flex items-center justify-between gap-3">
                <p className="font-medium">{poi.name}</p>
                <span className="text-sm text-muted-foreground">
                  {poi.coverage}%
                </span>
              </div>
              <Progress value={poi.coverage} className="h-2 rounded-none" />
              <p className="text-xs text-muted-foreground">
                互动热度：{poi.heat}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

function LogsPage({ snapshot }: { snapshot: AdminSnapshot }) {
  const [type, setType] = React.useState("ALL")
  const filteredLogs =
    type === "ALL"
      ? snapshot.logs
      : snapshot.logs.filter((log) => log.type === type)

  return (
    <Card className="rounded-none shadow-none">
      <CardHeader>
        <CardTitle>审计日志</CardTitle>
        <CardDescription>
          建议接口：GET /api/admin/logs?type&amp;limit。
        </CardDescription>
        <CardAction>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger className="w-44 rounded-none">
              <SelectValue placeholder="日志类型" />
            </SelectTrigger>
            <SelectContent className="rounded-none">
              <SelectGroup>
                <SelectItem value="ALL">全部类型</SelectItem>
                <SelectItem value="UGC_REVIEW">UGC_REVIEW</SelectItem>
                <SelectItem value="POI_UPDATE">POI_UPDATE</SelectItem>
                <SelectItem value="CONTENT_IMPORT">CONTENT_IMPORT</SelectItem>
                <SelectItem value="COMMENT_REVIEW">COMMENT_REVIEW</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>类型</TableHead>
              <TableHead>操作</TableHead>
              <TableHead>对象</TableHead>
              <TableHead>操作人</TableHead>
              <TableHead>时间</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLogs.map((log) => (
              <TableRow key={log.id}>
                <TableCell>
                  <Badge variant="outline" className="rounded-none">
                    {log.type}
                  </Badge>
                </TableCell>
                <TableCell className="max-w-md">{log.action}</TableCell>
                <TableCell>{log.target}</TableCell>
                <TableCell>{log.operator}</TableCell>
                <TableCell>{log.createdAt}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

function MainContent({
  activePage,
  snapshot,
}: {
  activePage: PageId
  snapshot: AdminSnapshot | null
}) {
  if (!snapshot) {
    return (
      <div className="grid gap-4 p-4 sm:p-6">
        <Skeleton className="h-28 rounded-none" />
        <Skeleton className="h-80 rounded-none" />
      </div>
    )
  }

  return (
    <ScrollArea className="flex-1">
      <div className="flex flex-col gap-4 p-4 font-mono sm:p-6">
        {activePage === "dashboard" && <DashboardPage snapshot={snapshot} />}
        {activePage === "pois" && <PoiPage initialPois={snapshot.pois} />}
        {activePage === "imports" && <ImportsPage snapshot={snapshot} />}
        {activePage === "ugc" && <UgcReviewPage initialItems={snapshot.ugc} />}
        {activePage === "comments" && (
          <CommentReviewPage initialItems={snapshot.comments} />
        )}
        {activePage === "map-tools" && <MapToolsPage snapshot={snapshot} />}
        {activePage === "ops-map" && <OpsMapPage snapshot={snapshot} />}
        {activePage === "logs" && <LogsPage snapshot={snapshot} />}

        <Tabs defaultValue="api" className="rounded-none border bg-card p-4">
          <TabsList className="rounded-none">
            <TabsTrigger value="api" className="rounded-none">
              API 边界
            </TabsTrigger>
            <TabsTrigger value="notice" className="rounded-none">
              开发注意
            </TabsTrigger>
          </TabsList>
          <TabsContent value="api" className="text-muted-foreground">
            页面层不直接调用 fetch，当前数据经 src/api/admin.ts 适配到
            src/mocks/admin.ts。
          </TabsContent>
          <TabsContent value="notice" className="text-muted-foreground">
            文件上传、驳回、删除、退出登录等破坏性操作保留确认与 toast 反馈。
          </TabsContent>
        </Tabs>
      </div>
    </ScrollArea>
  )
}

export function AdminConsole({ onBack }: { onBack?: () => void }) {
  const [profile, setProfile] = React.useState<AdminProfile | null>(() =>
    getStoredAdminProfile()
  )
  const [snapshot, setSnapshot] = React.useState<AdminSnapshot | null>(null)
  const [activePage, setActivePage] = React.useState<PageId>("dashboard")

  React.useEffect(() => {
    let mounted = true

    getAdminSnapshot().then((data) => {
      if (mounted) {
        setSnapshot(data)
      }
    })

    return () => {
      mounted = false
    }
  }, [])

  async function handleLogout() {
    await logoutAdmin()
    setProfile(null)
    toast.success("已退出登录")
  }

  if (!profile) {
    return <LoginScreen onLogin={setProfile} onBack={onBack} />
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-svh w-full bg-[#f2f2f2] dark:bg-[#262626]">
        <AppSidebar
          activePage={activePage}
          onPageChange={setActivePage}
          profile={profile}
          onLogout={handleLogout}
        />
        <SidebarInset>
          <AdminHeader
            activePage={activePage}
            snapshot={snapshot}
            onBack={onBack}
          />
          <MainContent activePage={activePage} snapshot={snapshot} />
          <AdminFooter />
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
