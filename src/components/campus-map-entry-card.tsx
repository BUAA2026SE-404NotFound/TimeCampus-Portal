import { ArrowRight, MapPinned, Route, Satellite } from "lucide-react"

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { mergeClassName } from "@/lib/utils"

type CampusMapEntryCardProps = {
  className?: string
  onOpen?: () => void
}

export function CampusMapEntryCard({
  className,
  onOpen,
}: CampusMapEntryCardProps) {
  return (
    <Card
      id="campus-map-entry"
      className={mergeClassName(
        "h-full scroll-mt-6 rounded-none bg-card font-mono shadow-none",
        className
      )}
    >
      <CardHeader>
        <p className="text-sm font-semibold text-muted-foreground uppercase">
          Campus Map
        </p>
        <CardTitle className="flex items-center gap-2 text-2xl">
          <MapPinned data-icon="inline-start" />
          校园卫星地图
        </CardTitle>
      </CardHeader>
      <CardContent className="grid flex-1 gap-4">
        <div className="relative overflow-hidden border bg-muted/30 p-4">
          <div className="absolute inset-0 [background-image:linear-gradient(var(--border)_1px,transparent_1px),linear-gradient(90deg,var(--border)_1px,transparent_1px)] [background-size:28px_28px] opacity-35" />
          <div className="relative grid gap-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Satellite data-icon="inline-start" />
              腾讯地图卫星底图
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Route data-icon="inline-start" />
              POI 点位与历史影像
            </div>
          </div>
        </div>
        <p className="leading-7 text-muted-foreground">
          地图已拆分为独立页面，进入后再加载卫星底图、POI
          标记与影像弹窗，主页首屏会更轻。
        </p>
      </CardContent>
      <CardFooter className="border-t bg-muted/30">
        <Button className="w-full rounded-none font-mono" onClick={onOpen}>
          打开校园地图
          <ArrowRight data-icon="inline-end" />
        </Button>
      </CardFooter>
    </Card>
  )
}
