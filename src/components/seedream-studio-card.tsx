import { ArrowRight, Images, Sparkles, UserRound } from "lucide-react"

import previewImage from "@/assets/campus-history/教学科研办公/JK101主楼/JK101主楼_1987_001.jpg"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
        "h-full scroll-mt-6 rounded-none bg-card font-mono shadow-none",
        className
      )}
    >
      <CardHeader>
        <p className="text-sm font-semibold text-muted-foreground uppercase">
          Seedream Studio
        </p>
        <CardTitle className="flex items-center gap-2 text-2xl">
          <Sparkles data-icon="inline-start" />
          时光合影工作室
        </CardTitle>
      </CardHeader>
      <CardContent className="grid flex-1 gap-4">
        <div className="grid overflow-hidden border bg-muted/30">
          <img
            src={previewImage}
            alt="主楼前的历史集体照"
            className="aspect-[16/9] w-full object-cover grayscale"
            loading="lazy"
            decoding="async"
          />
          <div className="grid gap-2 p-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-2">
              <UserRound data-icon="inline-start" />
              上传人物照片
            </span>
            <span className="flex items-center gap-2">
              <Images data-icon="inline-start" />
              选择历史模板
            </span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="border-t bg-muted/30">
        <Button className="w-full rounded-none font-mono" onClick={onOpen}>
          打开工作室
          <ArrowRight data-icon="inline-end" />
        </Button>
      </CardFooter>
    </Card>
  )
}
