import { useState } from "react"
import {
  ArrowRight,
  ExternalLink,
  MapPinned,
  Route,
  Search,
  Sparkles,
  ZoomIn,
} from "lucide-react"

import campusMapImage from "@/assets/campus-history/新地图.jpg"
import { ProgressiveImage } from "@/components/progressive-image"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
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
  const [externalMapConfirmOpen, setExternalMapConfirmOpen] = useState(false)

  return (
    <>
      <Card
        id="campus-map-entry"
        className={mergeClassName(
          "grid min-h-[430px] scroll-mt-6 overflow-hidden rounded-none bg-card py-0 font-mono shadow-none lg:grid-cols-[minmax(320px,0.78fr)_minmax(0,1.22fr)]",
          className
        )}
      >
        <div className="flex min-w-0 flex-col py-6">
          <CardHeader>
            <p className="text-sm font-semibold text-muted-foreground uppercase">
              Campus Map
            </p>
            <CardTitle className="flex min-w-0 items-center gap-3 text-3xl leading-tight sm:text-4xl">
              <MapPinned className="size-10 shrink-0" />
              校园智能导览地图
            </CardTitle>
          </CardHeader>
          <CardContent className="grid flex-1 content-center gap-5">
            <p className="max-w-xl text-base leading-8 text-muted-foreground">
              选定校园景点或当前位置作为起点，在腾讯卫星地图上生成多点步行路线，同时查询地点简介与历史影像。
            </p>
            <div className="grid gap-3">
              <div className="flex items-center gap-3 border p-3 text-sm">
                <Route className="size-5 shrink-0 text-primary" />
                智能步行路线与分段时间
              </div>
              <div className="flex items-center gap-3 border p-3 text-sm">
                <Sparkles className="size-5 shrink-0 text-primary" />
                热门路线与年代覆盖推荐
              </div>
              <div className="flex items-center gap-3 border p-3 text-sm">
                <Search className="size-5 shrink-0 text-primary" />
                景点资料与历史影像查询
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              className="w-full rounded-none font-mono sm:w-auto"
              onClick={onOpen}
            >
              开始智能导览
              <ArrowRight data-icon="inline-end" />
            </Button>
          </CardFooter>
        </div>
        <div className="relative grid min-h-[300px] place-items-center border-t bg-muted/20 p-3 lg:border-t-0 lg:border-l lg:p-5">
          <ProgressiveImage
            src={campusMapImage}
            alt="查看高清北航学院路校区平面图"
            className="size-full min-h-[280px] border bg-background"
            imageClassName="object-contain"
            sizes="(min-width: 1024px) 56vw, 100vw"
            onClick={() => setExternalMapConfirmOpen(true)}
          />
          <span className="pointer-events-none absolute right-6 bottom-6 flex items-center gap-2 border bg-background/95 px-3 py-2 text-xs shadow-sm">
            <ZoomIn className="size-4" />
            查看高清地图
          </span>
        </div>
      </Card>
      <AlertDialog
        open={externalMapConfirmOpen}
        onOpenChange={setExternalMapConfirmOpen}
      >
        <AlertDialogContent className="rounded-none font-mono">
          <AlertDialogHeader>
            <AlertDialogTitle>前往北航官网查看高清地图？</AlertDialogTitle>
            <AlertDialogDescription>
              即将在新页面打开北京航空航天大学官网提供的学院路校区高清地图。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-none">取消</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-none"
              onClick={() =>
                window.open(
                  "https://www.buaa.edu.cn/images/wqimg/bhdt.jpg",
                  "_blank",
                  "noopener,noreferrer"
                )
              }
            >
              <ExternalLink data-icon="inline-start" />
              继续访问
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
