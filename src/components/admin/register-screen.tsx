import React, { useState } from "react"
import { LogIn, Mail, Send, UserPlus } from "lucide-react"
import { toast } from "sonner"

import { AdminFooter } from "@/components/admin/shared"
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
import { Textarea } from "@/components/ui/textarea"

type RegisterScreenProps = {
  onBack?: () => void
  onLogin?: () => void
}

export function RegisterScreen({ onBack, onLogin }: RegisterScreenProps) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [reason, setReason] = useState("")

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const subject = encodeURIComponent("TimeCampus 管理员账号申请")
    const body = encodeURIComponent(
      [`申请人：${name}`, `联系方式：${email}`, "", "申请说明：", reason].join(
        "\n"
      )
    )

    window.location.href = `mailto:kurna2026@outlook.com?subject=${subject}&body=${body}`
    toast.info("已打开邮件客户端，请发送申请信息")
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
              管理员账号需要人工审核。提交后由维护人员创建账户并分配权限。
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="register-name">姓名或团队</FieldLabel>
                  <Input
                    id="register-name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    className="rounded-none"
                    autoComplete="name"
                    required
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="register-email">联系方式</FieldLabel>
                  <Input
                    id="register-email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="rounded-none"
                    autoComplete="email"
                    required
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="register-reason">申请说明</FieldLabel>
                  <Textarea
                    id="register-reason"
                    value={reason}
                    onChange={(event) => setReason(event.target.value)}
                    className="min-h-28 rounded-none"
                    required
                  />
                </Field>
              </FieldGroup>
            </CardContent>
            <CardFooter className="grid gap-2 border-t bg-muted/30 sm:grid-cols-2">
              <Button type="submit" className="rounded-none font-mono">
                <Send data-icon="inline-start" />
                提交申请
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
            <Mail data-icon="inline-start" />
            也可直接联系 kurna2026@outlook.com 开通管理权限。
          </div>
        </Card>
      </main>
      <AdminFooter />
    </div>
  )
}
