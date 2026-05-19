import { Check, X } from "lucide-react"
import { toast } from "sonner"

import {
  approveComment,
  approveUgc,
  rejectComment,
  rejectUgc,
} from "@/api/admin"
import {
  EmptyTableRow,
  ReviewTableCard,
  StatusBadge,
} from "@/components/admin/shared"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { CommentItem, UgcItem } from "@/mocks/admin"

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

export function UgcReviewPage({
  items,
  onChanged,
}: {
  items: UgcItem[]
  onChanged: () => void
}) {
  async function updateStatus(id: string, next: "approved" | "rejected") {
    try {
      if (next === "approved") {
        await approveUgc(id)
      } else {
        await rejectUgc(id, "管理端审核驳回")
      }
      toast.success(next === "approved" ? "投稿已通过" : "投稿已驳回")
      onChanged()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "审核操作失败")
    }
  }

  return (
    <ReviewTableCard
      title="投稿队列"
      description="接入 /api/v1/admin/ugc 与审核接口。"
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
                    <p className="mt-1 truncate text-xs text-muted-foreground">
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
                    onApprove={() => updateStatus(item.id, "approved")}
                    onReject={() => updateStatus(item.id, "rejected")}
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

export function CommentReviewPage({
  items,
  onChanged,
}: {
  items: CommentItem[]
  onChanged: () => void
}) {
  async function updateStatus(id: string, next: "approved" | "rejected") {
    try {
      if (next === "approved") {
        await approveComment(id)
      } else {
        await rejectComment(id, "管理端审核驳回")
      }
      toast.success(next === "approved" ? "评论已通过" : "评论已驳回")
      onChanged()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "审核操作失败")
    }
  }

  return (
    <ReviewTableCard
      title="评论队列"
      description="接入 /api/v1/admin/comments。"
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
          {items.length ? (
            items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.poiName}</TableCell>
                <TableCell>{item.userName}</TableCell>
                <TableCell className="max-w-md">{item.comment}</TableCell>
                <TableCell>
                  <StatusBadge status={item.reviewStatus} />
                </TableCell>
                <TableCell>
                  <ReviewActions
                    onApprove={() => updateStatus(item.id, "approved")}
                    onReject={() => updateStatus(item.id, "rejected")}
                  />
                </TableCell>
              </TableRow>
            ))
          ) : (
            <EmptyTableRow colSpan={5} label="暂无待审核评论" />
          )}
        </TableBody>
      </Table>
    </ReviewTableCard>
  )
}
