import { ChevronLeft, ChevronRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const defaultPageSizes = [6, 10, 15, 20]

export function PaginationControls({
  page,
  pageSize,
  total,
  pageSizes = defaultPageSizes,
  onPageChange,
  onPageSizeChange,
}: {
  page: number
  pageSize: number
  total: number
  pageSizes?: number[]
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const currentPage = Math.min(page, totalPages)

  return (
    <div className="flex flex-col gap-2 border-t pt-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>
          第 {currentPage} / {totalPages} 页，共 {total} 条
        </span>
        <Select
          value={String(pageSize)}
          onValueChange={(value) => onPageSizeChange(Number(value))}
        >
          <SelectTrigger className="h-8 w-24 rounded-none">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="rounded-none">
            {pageSizes.map((size) => (
              <SelectItem key={size} value={String(size)}>
                {size} 条
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="rounded-none"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        >
          <ChevronLeft data-icon="inline-start" />
          上一页
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="rounded-none"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        >
          下一页
          <ChevronRight data-icon="inline-end" />
        </Button>
      </div>
    </div>
  )
}
