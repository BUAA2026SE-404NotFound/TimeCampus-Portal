import { useEffect, useMemo, useState } from "react"
import { RefreshCw, ShieldCheck } from "lucide-react"
import { toast } from "sonner"

import {
  getAdminAccounts,
  updateAdminRole,
  updateAdminStatus,
} from "@/api/admin"
import { EmptyTableRow } from "@/components/admin/shared"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
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
import type { AdminAccount, AdminPermission } from "@/mocks/admin"

const roleSummaryOptions: Array<{
  value: AdminPermission
  label: string
  description: string
}> = [
  { value: "super", label: "Super", description: "全局权限与账户管理" },
  { value: "admin", label: "Admin", description: "内容写入、审核与运营操作" },
  { value: "read", label: "Read", description: "只读查看后台数据" },
  { value: "none", label: "None", description: "仅允许登录，无后台权限" },
]

const assignableRoleOptions = roleSummaryOptions.filter(
  (option) => option.value !== "super"
)

const roleText: Record<AdminPermission, string> = {
  super: "Super",
  admin: "Admin",
  read: "Read",
  none: "None",
}

function roleBadgeVariant(role: AdminPermission) {
  if (role === "super") return "default"
  if (role === "admin") return "secondary"
  return "outline"
}

export function AccountsPage() {
  const [accounts, setAccounts] = useState<AdminAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [pendingRoleChange, setPendingRoleChange] = useState<{
    account: AdminAccount
    role: AdminPermission
  } | null>(null)

  const counts = useMemo(
    () =>
      roleSummaryOptions.map((option) => ({
        ...option,
        count: accounts.filter((account) => account.role === option.value)
          .length,
      })),
    [accounts]
  )

  async function loadAccounts() {
    setLoading(true)
    try {
      setAccounts(await getAdminAccounts())
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "加载管理员列表失败")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadAccounts()
  }, [])

  function requestRoleChange(account: AdminAccount, role: AdminPermission) {
    if (account.role === role) return
    setPendingRoleChange({ account, role })
  }

  async function confirmRoleChange() {
    if (!pendingRoleChange) return
    const { account, role } = pendingRoleChange
    setPendingRoleChange(null)
    setUpdatingId(account.id)
    try {
      const updated = await updateAdminRole(account.id, role)
      setAccounts((current) =>
        current.map((item) => (item.id === updated.id ? updated : item))
      )
      toast.success(`已将 ${account.adminName} 调整为 ${roleText[role]}`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "调整权限失败")
    } finally {
      setUpdatingId(null)
    }
  }

  async function handleStatusToggle(account: AdminAccount) {
    const nextStatus = account.status === "ENABLED" ? "DISABLED" : "ENABLED"
    setUpdatingId(account.id)
    try {
      const updated = await updateAdminStatus(account.id, nextStatus)
      setAccounts((current) =>
        current.map((item) => (item.id === updated.id ? updated : item))
      )
      toast.success(
        `${account.adminName} 已${nextStatus === "ENABLED" ? "启用" : "禁用"}`
      )
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "更新状态失败")
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 md:grid-cols-4">
        {counts.map((item) => (
          <Card key={item.value} className="rounded-none shadow-none">
            <CardHeader className="gap-2">
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="text-base">{item.label}</CardTitle>
                <Badge
                  variant={roleBadgeVariant(item.value)}
                  className="rounded-none"
                >
                  {item.count}
                </Badge>
              </div>
              <CardDescription>{item.description}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>

      <Card className="rounded-none shadow-none">
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="grid gap-1.5">
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck data-icon="inline-start" />
              管理员管理
            </CardTitle>
            <CardDescription>
              通过 /api/v1/admin/accounts 管理账号；super
              不在此页直接授权或调整。
            </CardDescription>
          </div>
          <Button
            type="button"
            variant="outline"
            className="w-fit rounded-none font-mono"
            onClick={() => void loadAccounts()}
            disabled={loading}
          >
            <RefreshCw data-icon="inline-start" />
            刷新
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>账号</TableHead>
                <TableHead>权限</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>创建时间</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accounts.length === 0 && (
                <EmptyTableRow
                  colSpan={5}
                  label={loading ? "正在加载管理员列表" : "暂无管理员账号"}
                />
              )}
              {accounts.map((account) => {
                const disabled = updatingId === account.id

                return (
                  <TableRow key={account.id}>
                    <TableCell className="font-medium">
                      {account.adminName}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={account.role}
                        onValueChange={(value) =>
                          requestRoleChange(account, value as AdminPermission)
                        }
                        disabled={disabled || account.role === "super"}
                      >
                        <SelectTrigger className="w-32 rounded-none">
                          <SelectValue>{roleText[account.role]}</SelectValue>
                        </SelectTrigger>
                        <SelectContent className="rounded-none font-mono">
                          <SelectGroup>
                            {assignableRoleOptions.map((option) => (
                              <SelectItem
                                key={option.value}
                                value={option.value}
                                className="rounded-none"
                              >
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          account.status === "ENABLED" ? "default" : "outline"
                        }
                        className="rounded-none"
                      >
                        {account.status === "ENABLED" ? "已启用" : "已禁用"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {account.createTime}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        type="button"
                        variant="outline"
                        className="rounded-none font-mono"
                        onClick={() => void handleStatusToggle(account)}
                        disabled={disabled || account.role === "super"}
                      >
                        {account.status === "ENABLED" ? "禁用" : "启用"}
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <AlertDialog
        open={Boolean(pendingRoleChange)}
        onOpenChange={(open) => {
          if (!open) setPendingRoleChange(null)
        }}
      >
        <AlertDialogContent className="rounded-none font-mono">
          <AlertDialogHeader>
            <AlertDialogTitle>确认调整管理员权限</AlertDialogTitle>
            <AlertDialogDescription>
              将 {pendingRoleChange?.account.adminName} 从{" "}
              {pendingRoleChange
                ? roleText[pendingRoleChange.account.role]
                : ""}{" "}
              调整为 {pendingRoleChange ? roleText[pendingRoleChange.role] : ""}
              。 该操作会立即调用后端权限接口。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-none font-mono">
              取消
            </AlertDialogCancel>
            <AlertDialogAction
              className="rounded-none font-mono"
              onClick={() => void confirmRoleChange()}
            >
              确认调整
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
