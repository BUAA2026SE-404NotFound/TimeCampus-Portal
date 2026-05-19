import { useState } from "react"
import { ShieldCheck } from "lucide-react"
import { toast } from "sonner"

import { loginAdmin } from "@/api/admin"
import { ThemeToggle } from "@/components/theme-toggle"
import { AdminFooter } from "@/components/admin/shared"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import type { AdminProfile } from "@/mocks/admin"

export function LoginScreen({
  onLogin,
  onBack,
}: {
  onLogin: (profile: AdminProfile) => void
  onBack?: () => void
}) {
  const [adminName, setAdminName] = useState("admin")
  const [password, setPassword] = useState("123456")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)

    try {
      const result = await loginAdmin({ adminName, password })
      toast.success("已进入管理端")
      onLogin(result.profile)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "登录失败")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-svh flex-col bg-[#f2f2f2] font-mono dark:bg-[#262626]">
      <header className="bg-[#171717] text-white dark:bg-[#1f1f1f]">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-4 px-4 sm:px-6">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-white/60 uppercase">
              TimeCampus Admin
            </p>
            <p className="truncate text-xl font-semibold">时光航迹管理端</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            {onBack && (
              <Button
                type="button"
                variant="ghost"
                className="rounded-none font-mono text-white hover:bg-white/10 hover:text-white"
                onClick={onBack}
              >
                返回门户
              </Button>
            )}
            <ThemeToggle />
          </div>
        </div>
      </header>
      <main className="grid flex-1 place-items-center px-4 py-8">
        <Card className="w-full max-w-md rounded-none bg-card shadow-none">
          <CardHeader>
            <CardTitle className="text-2xl">管理员登录</CardTitle>
            <CardDescription>
              接入 POST /api/v1/admin/login，登录成功后保存 Bearer token。
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="admin-name">账号</FieldLabel>
                  <Input
                    id="admin-name"
                    value={adminName}
                    onChange={(event) => setAdminName(event.target.value)}
                    className="rounded-none"
                    autoComplete="username"
                    required
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="admin-password">密码</FieldLabel>
                  <Input
                    id="admin-password"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="rounded-none"
                    autoComplete="current-password"
                    required
                  />
                  <FieldDescription>
                    本地 token key：TimeCampus-Admin-Token。
                  </FieldDescription>
                </Field>
              </FieldGroup>
            </CardContent>
            <CardFooter className="border-t bg-muted/30">
              <Button
                type="submit"
                className="w-full rounded-none font-mono"
                disabled={loading}
              >
                <ShieldCheck data-icon="inline-start" />
                {loading ? "登录中" : "登录"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </main>
      <AdminFooter />
    </div>
  )
}
