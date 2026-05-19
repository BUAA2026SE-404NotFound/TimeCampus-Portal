import { useState } from "react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
  const filteredLogs =
    type === "ALL"
      ? snapshot.logs
      : snapshot.logs.filter((log) => log.type === type)

  return (
    <Card className="rounded-none shadow-none">
      <CardHeader>
        <CardTitle>审计日志</CardTitle>
        <CardDescription>
          接入 GET /api/v1/admin/logs?limit=20。
        </CardDescription>
        <CardAction>
          <Select value={type} onValueChange={setType}>
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
