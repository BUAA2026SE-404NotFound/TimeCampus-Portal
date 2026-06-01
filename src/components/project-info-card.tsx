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
import projectLogo from "@/assets/project-logo.jpg"
import { mergeClassName } from "@/lib/utils"

type ProductIdentityCardProps = {
  className?: string
  onDetail?: () => void
}

export function ProjectInfoCard({
  className,
  onDetail,
}: ProductIdentityCardProps) {
  const [preview, setPreview] = useState<ImagePreviewState | null>(null)

  return (
    <>
      <Card
        id="project-info"
        className={mergeClassName(
          "h-full scroll-mt-6 rounded-none bg-card font-mono shadow-none",
          className
        )}
      >
        <CardHeader>
          <p className="text-sm font-semibold text-muted-foreground uppercase">
            Product Info
          </p>
          <CardTitle className="text-2xl">项目信息</CardTitle>
        </CardHeader>
        <CardContent className="grid flex-1 gap-4 sm:grid-cols-[160px_1fr]">
          <ProgressiveImage
            src={projectLogo}
            alt="时光航迹 Logo"
            className="size-40 border bg-muted/30 p-6"
            imageClassName="object-contain"
            onClick={() =>
              setPreview({
                src: projectLogo,
                alt: "时光航迹 Logo",
                caption: "时光航迹 Logo",
              })
            }
          />
          <div className="space-y-3 leading-7 text-muted-foreground">
            <p>
              时光航迹是一款基于微信小程序与腾讯地图的时光胶囊地图应用，用户可以通过微信小程序“时光航迹”访问服务
            </p>
          </div>
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
