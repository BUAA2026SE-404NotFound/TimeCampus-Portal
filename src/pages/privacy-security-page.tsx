import { ArrowLeft, ShieldCheck } from "lucide-react"

import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"
import { Button } from "@/components/ui/button"

export function PrivacySecurityPage({ onBack }: { onBack: () => void }) {
  return (
    <div className="flex min-h-svh flex-col bg-background text-foreground">
      <SiteHeader showNav={false} />
      <main className="flex-1 px-4 py-6 sm:px-6">
        <article className="mx-auto grid w-full max-w-3xl gap-4 border bg-card p-5 font-mono sm:p-6">
          <p className="text-sm font-semibold text-muted-foreground uppercase">
            Privacy & Safety
          </p>
          <h1 className="flex items-center gap-2 text-3xl font-semibold">
            <ShieldCheck data-icon="inline-start" />
            隐私与安全
          </h1>
          <p className="leading-7 text-muted-foreground">
            时光合影工作室仅在生成过程中临时使用你上传的图片，不会主动保存、公开展示或传播用户上传内容与个人隐私。生成请求会经过人机验证与频率限制，以减少滥用和异常访问。若发现违法、侵权或恶意使用，我们会限制相关 IP 继续访问，并按需要保留必要的安全处置记录。
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
