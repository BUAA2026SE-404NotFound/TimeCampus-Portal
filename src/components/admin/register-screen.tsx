import React, { useState } from "react"
import { LogIn, ShieldCheck, UserPlus } from "lucide-react"
import { toast } from "sonner"

import { registerAdmin } from "@/api/admin"
import { AdminFooter } from "@/components/admin/shared"
import { CapVerification } from "@/components/cap-verification"
import { ThemeToggle } from "@/components/theme-toggle"
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

type RegisterScreenProps = {
  onBack?: () => void
  onLogin?: () => void
}

export function RegisterScreen({ onBack, onLogin }: RegisterScreenProps) {
  const [adminName, setAdminName] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [capToken, setCapToken] = useState("")
  const [capResetSignal, setCapResetSignal] = useState(0)
  const [loading, setLoading] = useState(false)
  const capEndpoint = import.meta.env.VITE_CAP_API_ENDPOINT || ""
  const skipCap = import.meta.env.VITE_SKIP_CAPTCHA === "true"

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (loading) return

    if (password !== confirmPassword) {
      toast.error("两次输入的密码不一致")
      return
    }

    if (capEndpoint && !capToken && !skipCap) {
      toast.error("请先完成人机验证")
      return
    }

    setLoading(true)

    try {
      await registerAdmin({
        adminName: adminName.trim(),
        password,
        capToken: capEndpoint ? capToken : "skip-local-captcha",
      })
      toast.success("注册成功，默认权限为 none，请等待超级管理员分配权限")
      onLogin?.()
    } catch (error) {
      setCapToken("")
      setCapResetSignal((current) => current + 1)
      toast.error(error instanceof Error ? error.message : "注册失败")
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
            <p className="truncate text-xl font-semibold">管理员账号申请</p>
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
            <CardTitle className="flex items-center gap-2 text-2xl">
              <UserPlus data-icon="inline-start" />
              管理员注册
            </CardTitle>
            <CardDescription>
              调用 POST /api/v1/admin/register 创建账户；新账户默认 none 权限。
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="register-name">管理员账号</FieldLabel>
                  <Input
                    id="register-name"
                    value={adminName}
                    onChange={(event) => setAdminName(event.target.value)}
                    className="rounded-none"
                    autoComplete="username"
                    required
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="register-password">密码</FieldLabel>
                  <Input
                    id="register-password"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="rounded-none"
                    autoComplete="new-password"
                    required
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="register-confirm-password">
                    确认密码
                  </FieldLabel>
                  <Input
                    id="register-confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    className="rounded-none"
                    autoComplete="new-password"
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
            <CardFooter className="grid gap-2 border-t bg-muted/30 sm:grid-cols-2">
              <Button
                type="submit"
                className="rounded-none font-mono"
                disabled={
                  loading || Boolean(capEndpoint && !capToken && !skipCap)
                }
              >
                <ShieldCheck data-icon="inline-start" />
                {loading ? "注册中" : "注册"}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="rounded-none font-mono"
                onClick={onLogin}
              >
                <LogIn data-icon="inline-start" />
                已有账号登录
              </Button>
            </CardFooter>
          </form>
          <div className="border-t px-6 py-4 text-sm text-muted-foreground">
            注册后可登录，但需要超级管理员在“管理员管理”中授予 read、admin 或
            super 权限。
          </div>
        </Card>
      </main>
      <AdminFooter />
    </div>
  )
}
