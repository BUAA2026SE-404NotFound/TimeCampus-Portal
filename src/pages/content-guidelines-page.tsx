import { ArrowLeft, FileWarning } from "lucide-react"

import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"
import { Button } from "@/components/ui/button"

export function ContentGuidelinesPage({ onBack }: { onBack: () => void }) {
  return (
    <div className="flex min-h-svh flex-col bg-background text-foreground">
      <SiteHeader showNav={false} />
      <main className="flex-1 px-4 py-6 sm:px-6">
        <article className="mx-auto grid w-full max-w-3xl gap-4 border bg-card p-5 font-mono sm:p-6">
          <p className="text-sm font-semibold text-muted-foreground uppercase">
            Content Rules
          </p>
          <h1 className="flex items-center gap-2 text-3xl font-semibold">
            <FileWarning data-icon="inline-start" />
            用户内容规范
          </h1>
          <p className="leading-7 text-muted-foreground">
            请仅上传你有权使用的本人或已获授权人物照片。禁止上传违法、暴力、色情、侵权、冒充他人、侵犯隐私或任何可能危害他人权益的图片内容。违反规范的请求将被拒绝，相关 IP 可能被限制继续使用本功能。
          </p>
          <Button className="w-fit rounded-none font-mono" onClick={onBack}>
            <ArrowLeft data-icon="inline-start" />
            返回
          </Button>
        </article>
      </main>
      <SiteFooter />
    </div>
  )
}
