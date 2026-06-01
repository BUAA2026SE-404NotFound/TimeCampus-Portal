import { useState } from "react"

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  ImagePreviewDialog,
  type ImagePreviewState,
} from "@/components/image-preview-dialog"
import { ProgressiveImage } from "@/components/progressive-image"
import miniProgramImage from "@/assets/mini-program.jpg"
import { mergeClassName } from "@/lib/utils"

type MiniProgramCardProps = {
  className?: string
  onDetail?: () => void
}

export function MiniProgramCard({ className, onDetail }: MiniProgramCardProps) {
  const [preview, setPreview] = useState<ImagePreviewState | null>(null)

  return (
    <>
      <Card
        id="mini-program"
        className={mergeClassName(
          "h-full scroll-mt-6 rounded-none bg-card font-mono shadow-none",
          className
        )}
      >
        <CardHeader>
          <p className="text-sm font-semibold text-muted-foreground uppercase">
            WeChat Mini Program
          </p>
          <CardTitle className="text-2xl">微信小程序介绍</CardTitle>
        </CardHeader>
        <CardContent className="grid flex-1 gap-4 sm:grid-cols-[1fr_160px]">
          <div className="space-y-3 leading-7 text-muted-foreground">
            <p>
              小程序基于腾讯地图面向用户展示校园地图与兴趣点、校园历史影像、冷知识等内容
            </p>
          </div>
          <ProgressiveImage
            src={miniProgramImage}
            alt="小程序码"
            className="size-40 border bg-muted/30 p-6"
            imageClassName="object-contain"
            onClick={() =>
              setPreview({
                src: miniProgramImage,
                alt: "小程序码",
                caption: "微信小程序码",
              })
            }
          />
        </CardContent>
        <CardFooter className="border-t bg-muted/30">
          <Button className="w-full rounded-none font-mono" onClick={onDetail}>
            查看详情
          </Button>
        </CardFooter>
      </Card>
      <ImagePreviewDialog
        image={preview}
        onOpenChange={(open) => {
          if (!open) setPreview(null)
        }}
      />
    </>
  )
}
