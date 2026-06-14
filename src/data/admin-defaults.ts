import {
  BookOpenCheck,
  FileClock,
  Landmark,
  MessageSquareWarning,
} from "lucide-react"

import type { DashboardMetric, TrendPoint } from "@/types/admin"

export const dashboardMetrics: DashboardMetric[] = [
  {
    label: "POI 总数",
    value: "?",
    detail: "活跃 POI ? 个",
    trend: "+0 本周",
    icon: Landmark,
  },
  {
    label: "图片内容",
    value: "?",
    detail: "可见内容 ? 条",
    trend: "+0 本周",
    icon: BookOpenCheck,
  },
  {
    label: "待审核 UGC",
    value: "?",
    detail: "图片投稿 ? 条",
    trend: "+0 本周",
    icon: FileClock,
  },
  {
    label: "评论待处理",
    value: "?",
    detail: "待审核评论 ? 条",
    trend: "?",
    icon: MessageSquareWarning,
  },
]

export const trendData: TrendPoint[] = []
