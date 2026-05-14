import { useState } from "react"

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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

type ContactFormState = {
  name: string
  email: string
  topic: string
  message: string
}

const initialFormState: ContactFormState = {
  name: "",
  email: "",
  topic: "产品咨询",
  message: "",
}

export function ContactForm() {
  const [form, setForm] = useState<ContactFormState>(initialFormState)
  const [open, setOpen] = useState(false)

  function updateField(field: keyof ContactFormState, value: string) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setOpen(true)
    setForm(initialFormState)
  }

  return (
    <>
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>联系运营团队</CardTitle>
          <CardDescription>
            留下你的问题或合作需求，我们会尽快安排管理员跟进。
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium" htmlFor="name">
                姓名
              </label>
              <input
                id="name"
                required
                value={form.name}
                onChange={(event) => updateField("name", event.target.value)}
                className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring h-10 rounded-md border px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                placeholder="请输入姓名"
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium" htmlFor="email">
                邮箱
              </label>
              <input
                id="email"
                type="text"
                inputMode="email"
                pattern="[^@\s]+@[^@\s]+\.[^@\s]+"
                required
                value={form.email}
                onChange={(event) => updateField("email", event.target.value)}
                className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring h-10 rounded-md border px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                placeholder="name@example.com"
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium" htmlFor="topic">
                主题
              </label>
              <select
                id="topic"
                value={form.topic}
                onChange={(event) => updateField("topic", event.target.value)}
                className="border-input bg-background ring-offset-background focus-visible:ring-ring h-10 rounded-md border px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              >
                <option>产品咨询</option>
                <option>POI 数据协作</option>
                <option>内容审核问题</option>
                <option>地图工具支持</option>
              </select>
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium" htmlFor="message">
                内容
              </label>
              <textarea
                id="message"
                required
                rows={5}
                value={form.message}
                onChange={(event) => updateField("message", event.target.value)}
                className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring min-h-32 rounded-md border px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                placeholder="请简要描述你的需求"
              />
            </div>
          </CardContent>
          <CardFooter className="justify-end gap-3 pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => setForm(initialFormState)}
            >
              重置
            </Button>
            <Button type="submit">提交联系信息</Button>
          </CardFooter>
        </form>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>已收到联系信息</DialogTitle>
            <DialogDescription>
              表单当前使用本地交互演示，后续可以在 API adapter 中接入真实提交接口。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setOpen(false)}>知道了</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
