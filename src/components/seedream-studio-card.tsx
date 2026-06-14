import { ArrowRight, Images, Sparkles, UserRound } from "lucide-react"

import previewImage from "@/assets/campus-history/教学科研办公/JK101主楼/JK101主楼_1987_001.jpg"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { mergeClassName } from "@/lib/utils"

type SeedreamStudioCardProps = {
  className?: string
  onOpen?: () => void
}

export function SeedreamStudioCard({
  className,
  onOpen,
}: SeedreamStudioCardProps) {
  return (
    <Card
      id="seedream-studio"
      className={mergeClassName(
        "grid h-full scroll-mt-6 gap-0 overflow-hidden rounded-none bg-card py-0 font-mono shadow-none lg:grid-cols-[1.05fr_0.95fr]",
        className
      )}
    >
      <div className="grid content-between gap-5 p-5 sm:p-6 lg:min-h-[260px]">
        <div className="grid gap-3">
          <p className="text-sm font-semibold text-muted-foreground uppercase">
            Seedream Studio
          </p>
          <h2 className="flex items-center gap-2 text-3xl font-semibold">
            <Sparkles data-icon="inline-start" />
            时光合影工作室
          </h2>
          <p className="max-w-2xl leading-7 text-muted-foreground">
            上传一张人物照片，进入固定历史模板里的老照片场景。
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex min-h-20 items-center gap-3 border bg-muted/30 px-4">
            <UserRound className="size-5 text-primary" />
            <span className="text-sm text-muted-foreground">上传人物照片</span>
          </div>
          <div className="flex min-h-20 items-center gap-3 border bg-muted/30 px-4">
            <Images className="size-5 text-primary" />
            <span className="text-sm text-muted-foreground">选择历史模板</span>
          </div>
        </div>

        <Button className="w-full rounded-none font-mono sm:w-fit" onClick={onOpen}>
          打开工作室
          <ArrowRight data-icon="inline-end" />
        </Button>
      </div>

      <div className="relative min-h-[240px] border-t bg-muted/30 lg:border-t-0 lg:border-l">
        <img
          src={previewImage}
          alt="主楼前的历史集体照"
          className="absolute inset-0 size-full object-cover grayscale"
          loading="lazy"
          decoding="async"
        />
        <div className="absolute inset-0 bg-linear-to-r from-background/10 via-transparent to-background/25" />
        <div className="absolute right-4 bottom-4 left-4 border bg-card/90 px-4 py-3">
          <p className="text-sm font-semibold">主楼合影 · 1987</p>
          <p className="mt-1 text-xs text-muted-foreground">
            临时模板，后续可替换为正式背景
          </p>
        </div>
      </div>
    </Card>
  )
}
