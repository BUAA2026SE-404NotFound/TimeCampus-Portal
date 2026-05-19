import { useState } from "react"
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
import { Textarea } from "@/components/ui/textarea"
import type { CommentItem, UgcItem } from "@/mocks/admin"

function ReviewActions({
  onApprove,
  onReject,
}: {
  onApprove: () => Promise<void>
  onReject: (reason: string) => Promise<void>
}) {
  const [reason, setReason] = useState("")
  const [pending, setPending] = useState<"approve" | "reject" | null>(null)

  async function handleApprove() {
    if (pending) return
    setPending("approve")
    try {
      await onApprove()
    } finally {
      setPending(null)
    }
  }

  async function handleReject() {
    const trimmedReason = reason.trim()
    if (!trimmedReason) {
      toast.error("请填写驳回理由")
      return
    }
    if (pending) return
    setPending("reject")
    try {
      await onReject(trimmedReason)
      setReason("")
    } finally {
      setPending(null)
    }
  }

  return (
    <div className="ml-auto grid max-w-72 gap-2">
      <Textarea
        value={reason}
        onChange={(event) => setReason(event.target.value)}
        placeholder="驳回理由"
        className="min-h-16 rounded-none text-xs"
        disabled={Boolean(pending)}
      />
      <div className="flex justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          className="rounded-none"
          onClick={handleReject}
          disabled={Boolean(pending)}
        >
          <X data-icon="inline-start" />
          {pending === "reject" ? "驳回中" : "驳回"}
        </Button>
        <Button
          size="sm"
          className="rounded-none"
          onClick={handleApprove}
          disabled={Boolean(pending)}
        >
          <Check data-icon="inline-start" />
          {pending === "approve" ? "通过中" : "通过"}
        </Button>
      </div>
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
  async function updateStatus(
    id: string,
    next: "approved" | "rejected",
    reason?: string
  ) {
    try {
      if (next === "approved") {
        await approveUgc(id)
      } else {
        await rejectUgc(id, reason ?? "")
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
      <Table className="table-fixed">
        <TableHeader>
          <TableRow>
            <TableHead className="w-44">POI / 年份</TableHead>
            <TableHead className="w-32">投稿人</TableHead>
            <TableHead>描述</TableHead>
            <TableHead className="w-24">状态</TableHead>
            <TableHead className="w-80 text-right">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.length ? (
            items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="whitespace-normal">
                  <div className="line-clamp-2 font-medium">{item.poiName}</div>
                  <div className="text-xs text-muted-foreground">
                    {item.year}
                  </div>
                </TableCell>
                <TableCell className="whitespace-normal">
                  <span className="line-clamp-2">{item.uploader}</span>
                </TableCell>
                <TableCell className="whitespace-normal">
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
                    onReject={(reason) =>
                      updateStatus(item.id, "rejected", reason)
                    }
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
  async function updateStatus(
    id: string,
    next: "approved" | "rejected",
    reason?: string
  ) {
    try {
      if (next === "approved") {
        await approveComment(id)
      } else {
        await rejectComment(id, reason ?? "")
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
      <Table className="table-fixed">
        <TableHeader>
          <TableRow>
            <TableHead className="w-44">POI</TableHead>
            <TableHead className="w-32">用户</TableHead>
            <TableHead>评论</TableHead>
            <TableHead className="w-24">状态</TableHead>
            <TableHead className="w-80 text-right">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.length ? (
            items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="whitespace-normal">
                  <span className="line-clamp-2 font-medium">
                    {item.poiName}
                  </span>
                </TableCell>
                <TableCell className="whitespace-normal">
                  <span className="line-clamp-2">{item.userName}</span>
                </TableCell>
                <TableCell className="whitespace-normal">
                  <p className="line-clamp-3">{item.comment}</p>
                </TableCell>
                <TableCell>
                  <StatusBadge status={item.reviewStatus} />
                </TableCell>
                <TableCell>
                  <ReviewActions
                    onApprove={() => updateStatus(item.id, "approved")}
                    onReject={(reason) =>
                      updateStatus(item.id, "rejected", reason)
                    }
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
