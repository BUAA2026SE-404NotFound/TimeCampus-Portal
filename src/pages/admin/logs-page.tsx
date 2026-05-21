import { useState } from "react"
import { Search } from "lucide-react"

import { PaginationControls } from "@/components/admin/pagination-controls"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { AdminSnapshot } from "@/api/admin"

export function LogsPage({ snapshot }: { snapshot: AdminSnapshot }) {
  const [type, setType] = useState("ALL")
  const [keyword, setKeyword] = useState("")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const filteredLogs =
    type === "ALL" ? snapshot.logs : snapshot.logs.filter((log) => log.type === type)
  const searchedLogs = filteredLogs.filter((log) =>
    [log.id, log.type, log.action, log.target, log.operator, log.createdAt]
      .join(" ")
      .toLowerCase()
      .includes(keyword.trim().toLowerCase())
  )
  const totalPages = Math.max(1, Math.ceil(searchedLogs.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const pagedLogs = searchedLogs.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  )

  return (
    <Card className="rounded-none shadow-none">
      <CardHeader>
        <CardTitle>审计日志</CardTitle>
        <CardDescription>
          接入 GET /api/v1/admin/logs?limit=20。
        </CardDescription>
        <CardAction className="flex flex-col gap-2 sm:flex-row">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={keyword}
              onChange={(event) => {
                setKeyword(event.target.value)
                setPage(1)
              }}
              className="w-full rounded-none pl-9 sm:w-72"
              placeholder="搜索操作、对象、操作人"
            />
          </div>
          <Select
            value={type}
            onValueChange={(value) => {
              setType(value)
              setPage(1)
            }}
          >
            <SelectTrigger className="w-44 rounded-none">
              <SelectValue placeholder="日志类型" />
            </SelectTrigger>
            <SelectContent className="rounded-none">
              <SelectGroup>
                <SelectItem value="ALL">全部类型</SelectItem>
                {[...new Set(snapshot.logs.map((log) => log.type))].map(
                  (item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  )
                )}
              </SelectGroup>
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>
      <CardContent className="grid gap-3 p-0">
        <div className="max-h-[calc(100svh-22rem)] overflow-y-auto">
        <Table className="table-fixed">
          <TableHeader className="sticky top-0 z-10 bg-card">
            <TableRow>
              <TableHead className="w-40">类型</TableHead>
              <TableHead>操作</TableHead>
              <TableHead className="w-36">对象</TableHead>
              <TableHead className="w-36">操作人</TableHead>
              <TableHead className="w-44">时间</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pagedLogs.map((log) => (
              <TableRow key={log.id}>
                <TableCell>
                  <Badge variant="outline" className="rounded-none">
                    {log.type}
                  </Badge>
                </TableCell>
                <TableCell className="whitespace-normal">
                  <p className="line-clamp-3">{log.action}</p>
                </TableCell>
                <TableCell className="truncate">{log.target}</TableCell>
                <TableCell className="truncate">{log.operator}</TableCell>
                <TableCell>{log.createdAt}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        </div>
        <div className="px-6 pb-4">
          <PaginationControls
            page={currentPage}
            pageSize={pageSize}
            total={searchedLogs.length}
            onPageChange={setPage}
            onPageSizeChange={(value) => {
              setPageSize(value)
              setPage(1)
            }}
          />
        </div>
      </CardContent>
    </Card>
  )
}
