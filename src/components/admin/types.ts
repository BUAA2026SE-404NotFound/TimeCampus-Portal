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
        label: "Dashboard",
        description: "运营首页",
        icon: Gauge,
      },
      { id: "ops-map", label: "运营地图", description: "校区热度", icon: Map },
      { id: "logs", label: "审计日志", description: "操作留痕", icon: History },
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
      },
      {
        id: "comments",
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
