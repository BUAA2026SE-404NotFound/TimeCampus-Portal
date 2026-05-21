import { Power, Trash2 } from "lucide-react"

import { EmptyTableRow, StatusBadge } from "@/components/admin/shared"
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
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { Poi } from "@/mocks/admin"

export function PoiTable({
  pois,
  onDelete,
  onToggleStatus,
  deletingId,
  updatingId,
}: {
  pois: Poi[]
  onDelete: (id: string) => void
  onToggleStatus: (poi: Poi) => void
  deletingId?: string | null
  updatingId?: string | null
}) {
  return (
    <Card className="rounded-none shadow-none">
      <CardContent className="max-h-[calc(100svh-24rem)] overflow-y-auto p-0">
        <Table className="table-fixed">
          <TableHeader className="sticky top-0 z-10 bg-card">
            <TableRow>
              <TableHead className="w-36">POI ID</TableHead>
              <TableHead className="w-48">名称</TableHead>
              <TableHead>简介</TableHead>
              <TableHead className="w-48">坐标</TableHead>
              <TableHead className="w-24">状态</TableHead>
              <TableHead className="w-36 text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pois.length ? (
              pois.map((poi) => (
                <TableRow key={poi.id}>
                  <TableCell className="truncate text-muted-foreground">
                    {poi.id}
                  </TableCell>
                  <TableCell className="whitespace-normal">
                    <span className="line-clamp-2 font-medium">{poi.name}</span>
                  </TableCell>
                  <TableCell className="whitespace-normal">
                    <span className="line-clamp-2">{poi.region}</span>
                  </TableCell>
                  <TableCell>
                    {poi.latitude.toFixed(5)}, {poi.longitude.toFixed(5)}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={poi.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-none"
                        onClick={() => onToggleStatus(poi)}
                        disabled={updatingId === poi.id}
                        title={poi.status === "ACTIVE" ? "下架 POI" : "上架 POI"}
                      >
                        <Power />
                        <span className="sr-only">
                          {poi.status === "ACTIVE" ? "下架 POI" : "上架 POI"}
                        </span>
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="rounded-none"
                            disabled={deletingId === poi.id}
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
                              将调用 DELETE /api/v1/admin/pois/{poi.id}。
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="rounded-none font-mono">
                              取消
                            </AlertDialogCancel>
                            <AlertDialogAction
                              className="rounded-none font-mono"
                              onClick={() => onDelete(poi.id)}
                              disabled={deletingId === poi.id}
                            >
                              删除
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
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
  )
}
