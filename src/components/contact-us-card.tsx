import { useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
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
  topic: "一般问题",
  message: "",
}

export function ContactUsCard() {
  const [form, setForm] = useState<ContactFormState>(initialFormState)
  const [formOpen, setFormOpen] = useState(false)
  const [successOpen, setSuccessOpen] = useState(false)

  function updateField(field: keyof ContactFormState, value: string) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormOpen(false)
    setSuccessOpen(true)
    setForm(initialFormState)
  }

  return (
    <>
      <Card
        id="contact-us"
        className="h-full scroll-mt-6 rounded-none bg-card font-mono shadow-none"
      >
        <CardHeader>
          <p className="text-sm font-semibold text-muted-foreground uppercase">
            Contact Us
          </p>
          <CardTitle className="text-2xl leading-tight">联系我们</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 space-y-3 leading-7 text-muted-foreground">
          <p>
            管理员联系方式：
            <a className="underline" href="mailto:kurna2026@outlook.com">
              kurna2026@outlook.com
            </a>
          </p>
          <p>在线提交目前仅测试开发使用</p>
        </CardContent>
        <CardFooter className="border-t bg-muted/30">
          <Button
            type="button"
            className="w-full rounded-none bg-[#171717] font-mono text-white hover:bg-[#2a2a2a] dark:bg-white dark:text-black dark:hover:bg-white/85"
            onClick={() => setFormOpen(true)}
          >
            提交反馈
          </Button>
        </CardFooter>
      </Card>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-h-[90svh] overflow-y-auto rounded-none font-mono sm:max-w-xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <DialogHeader className="text-left">
              <DialogTitle>反馈提交</DialogTitle>
              <DialogDescription>
                请填写以下表单，我们会尽快处理您的问题。
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <label className="text-sm font-medium" htmlFor="name">
                    称呼
                  </label>
                  <input
                    id="name"
                    required
                    value={form.name}
                    onChange={(event) =>
                      updateField("name", event.target.value)
                    }
                    className="h-10 rounded-none border px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    placeholder="Your name"
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
                    onChange={(event) =>
                      updateField("email", event.target.value)
                    }
                    className="h-10 rounded-none border px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    placeholder="your-email@example.com"
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium" htmlFor="topic">
                  分类
                </label>
                <select
                  id="topic"
                  value={form.topic}
                  onChange={(event) => updateField("topic", event.target.value)}
                  className="h-10 rounded-none border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option>内容分享</option>
                  <option>审核相关</option>
                  <option>地图反馈</option>
                  <option>其他问题</option>
                </select>
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium" htmlFor="message">
                  具体内容
                </label>
                <textarea
                  id="message"
                  required
                  rows={5}
                  value={form.message}
                  onChange={(event) =>
                    updateField("message", event.target.value)
                  }
                  className="min-h-32 resize-y rounded-none border px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  placeholder="请描述您的问题"
                />
              </div>
            </div>
            <DialogFooter className="gap-2 sm:gap-3">
              <Button
                type="button"
                variant="outline"
                className="rounded-none font-mono"
                onClick={() => setFormOpen(false)}
              >
                取消
              </Button>
              <Button
                type="submit"
                className="rounded-none bg-[#171717] font-mono text-white hover:bg-[#2a2a2a] dark:bg-white dark:text-black dark:hover:bg-white/85"
              >
                提交
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={successOpen} onOpenChange={setSuccessOpen}>
        <DialogContent className="rounded-none font-mono">
          <DialogHeader>
            <DialogTitle>已提交</DialogTitle>
            <DialogDescription>
              感谢您的反馈，我们会尽快处理您的问题。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setSuccessOpen(false)}>知道了</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
