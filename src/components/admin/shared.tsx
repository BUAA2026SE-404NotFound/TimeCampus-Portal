import type { ReactNode } from "react"

import { Badge } from "@/components/ui/badge"
import { TableCell, TableRow } from "@/components/ui/table"
import projectLogo from "@/assets/project-logo.jpg"
import type { Poi, PublishStatus, ReviewStatus } from "@/types/admin"

const statusText: Record<ReviewStatus | PublishStatus | Poi["status"], string> =
  {
    ACTIVE: "已启用",
    INACTIVE: "已停用",
    PENDING: "待审核",
    APPROVED: "已通过",
    REJECTED: "已驳回",
    VISIBLE: "可见",
    HIDDEN: "隐藏",
  }

export function AdminLogo() {
  return (
    <div className="grid size-10 place-items-center border bg-background">
      <img
        className="max-h-7 max-w-7 object-contain"
        src={projectLogo}
        alt="时光航迹 Logo"
        loading="eager"
        decoding="async"
      />
    </div>
  )
}

export function StatusBadge({
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

export function EmptyTableRow({
  colSpan,
  label,
}: {
  colSpan: number
  label: string
}) {
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

export function AdminFooter() {
  return (
    <footer className="border-t border-sidebar-border bg-sidebar px-4 py-4 font-mono text-sm text-sidebar-foreground sm:px-6">
      <div className="ml-auto flex w-full flex-col items-end gap-2 text-right sm:flex-row sm:items-center sm:justify-end sm:gap-6">
        <p>© 2026 北航敏捷开发软件工程</p>
        <div className="flex flex-wrap justify-end gap-x-4 gap-y-2 text-sidebar-foreground/75">
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

export function ReviewTableCard({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: ReactNode
}) {
  return (
    <div className="rounded-none border bg-card shadow-none">
      <div className="grid gap-1.5 p-6">
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <div>{children}</div>
    </div>
  )
}
