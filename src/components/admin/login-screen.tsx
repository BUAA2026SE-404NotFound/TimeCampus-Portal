import React, { useState } from "react"
import { ShieldCheck } from "lucide-react"
import { toast } from "sonner"

import { loginAdmin } from "@/api/admin"
import { CapVerification } from "@/components/cap-verification"
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
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import type { AdminProfile } from "@/mocks/admin"

export function LoginScreen({
  onLogin,
  onBack,
  onRegister,
}: {
  onLogin: (profile: AdminProfile) => void
  onBack?: () => void
  onRegister?: () => void
}) {
  const [adminName, setAdminName] = useState("admin")
  const [password, setPassword] = useState("123456")
  const [capToken, setCapToken] = useState("")
  const [capResetSignal, setCapResetSignal] = useState(0)
  const [loading, setLoading] = useState(false)
  const capEndpoint = import.meta.env.VITE_CAP_API_ENDPOINT || ""
  const skipCap = import.meta.env.VITE_SKIP_CAPTCHA === "true"

  async function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    if (loading) return

    if (capEndpoint && !capToken && !skipCap) {
      toast.error("请先完成人机验证")
      return
    }

    setLoading(true)

    try {
      const result = await loginAdmin({
        adminName,
        password,
        capToken: capEndpoint ? capToken : undefined,
      })
      toast.success("已进入管理端")
      onLogin(result.profile)
    } catch (error) {
      setCapToken("")
      setCapResetSignal((current) => current + 1)
      toast.error(error instanceof Error ? error.message : "登录失败")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-svh flex-col bg-background font-mono">
      <header className="bg-sidebar text-sidebar-foreground">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-4 px-4 sm:px-6">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-sidebar-foreground/65 uppercase">
              TimeCampus Admin
            </p>
            <p className="truncate text-xl font-semibold">时光航迹管理端</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            {onBack && (
              <Button
                type="button"
                variant="ghost"
                className="rounded-none font-mono text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                onClick={onBack}
              >
                返回主页
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
              管理员内部账户登录，如需账户请联系开发团队
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
                </Field>
                <CapVerification
                  endpoint={capEndpoint}
                  value={capToken}
                  onValueChange={setCapToken}
                  resetSignal={capResetSignal}
                  skip={skipCap}
                />
              </FieldGroup>
            </CardContent>
            <CardFooter className="border-t bg-muted/30">
              <div className="grid w-full gap-2 sm:grid-cols-2">
                <Button
                  type="submit"
                  className="rounded-none font-mono"
                  disabled={
                    loading || Boolean(capEndpoint && !capToken && !skipCap)
                  }
                >
                  <ShieldCheck data-icon="inline-start" />
                  {loading ? "登录中" : "登录"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-none font-mono"
                  onClick={onRegister}
                >
                  注册账号
                </Button>
              </div>
            </CardFooter>
          </form>
        </Card>
      </main>
      <AdminFooter />
    </div>
  )
}
