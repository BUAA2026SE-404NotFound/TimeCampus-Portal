import {
  BookOpenCheck,
  FileUp,
  Gauge,
  History,
  Landmark,
  Map,
  MapPinned,
  MessageSquareWarning,
} from "lucide-react"

export type PageId =
  | "dashboard"
  | "pois"
  | "imports"
  | "ugc"
  | "comments"
  | "map-tools"
  | "ops-map"
  | "logs"

export type NavigationItem = {
  id: PageId
  path: string
  label: string
  description: string
  icon: typeof Gauge
  badge?: number
}

export const navigationGroups: Array<{
  label: string
  items: NavigationItem[]
}> = [
  {
    label: "运营",
    items: [
      {
        id: "dashboard",
        path: "/admin/dashboard",
        label: "Dashboard",
        description: "运营首页",
        icon: Gauge,
      },
      {
        id: "ops-map",
        path: "/admin/ops-map",
        label: "运营地图",
        description: "校区热度",
        icon: Map,
      },
      {
        id: "logs",
        path: "/admin/logs",
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
        path: "/admin/pois",
        label: "POI 管理",
        description: "点位维护",
        icon: Landmark,
      },
      {
        id: "imports",
        path: "/admin/imports",
        label: "内容上传",
        description: "上传入库",
        icon: FileUp,
      },
      {
        id: "ugc",
        path: "/admin/ugc",
        label: "UGC 审核",
        description: "投稿处理",
        icon: BookOpenCheck,
      },
      {
        id: "comments",
        path: "/admin/comments",
        label: "评论审核",
        description: "评论处理",
        icon: MessageSquareWarning,
      },
    ],
  },
  {
    label: "工具",
    items: [
      {
        id: "map-tools",
        path: "/admin/map-tools",
        label: "地图工具",
        description: "地理编码",
        icon: MapPinned,
      },
    ],
  },
]

export const pageTitles: Record<
  PageId,
  { title: string; description: string }
> = {
  dashboard: {
    title: "运营首页",
    description: "展示运营数据概览，内容覆盖与审核状态。",
  },
  pois: {
    title: "POI 管理",
    description: "维护校园兴趣点、坐标、状态和内容覆盖。",
  },
  imports: {
    title: "内容上传",
    description: "上传本地图片或导入已有 URL，并查看上传记录。",
  },
  ugc: {
    title: "UGC 审核",
    description: "处理用户投稿，驳回时必须填写明确原因。",
  },
  comments: {
    title: "评论审核（已废弃）",
    description:
      "审核用户评论，保留审核状态与操作痕迹。（因为微信小程序服务策略，现已废弃评论功能）",
  },
  "map-tools": {
    title: "地图工具",
    description: "通过后端封装接口提供逆地理编码与 POI 搜索。",
  },
  "ops-map": {
    title: "运营地图",
    description: "查看校区内容覆盖、互动热度和 POI",
  },
  logs: {
    title: "审计日志",
    description: "查询后台操作记录，便于回溯与排查。",
  },
}

export const adminPagePaths = Object.fromEntries(
  navigationGroups.flatMap((group) =>
    group.items.map((item) => [item.id, item.path])
  )
) as Record<PageId, string>

export function getAdminPagePath(page: PageId) {
  return adminPagePaths[page]
}

export function getPageFromPath(pathname: string): PageId {
  const normalized = pathname.replace(/\/+$/, "") || "/"

  if (normalized === "/admin") {
    return "dashboard"
  }

  const match = Object.entries(adminPagePaths).find(
    ([, path]) => path === normalized
  )

  return (match?.[0] as PageId | undefined) ?? "dashboard"
}
