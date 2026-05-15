import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type MiniProgramCardProps = {
  className?: string
}

export function MiniProgramCard({ className }: MiniProgramCardProps) {
  return (
    <Card
      id="mini-program"
      className={cn("h-full scroll-mt-6 rounded-none bg-card font-mono shadow-none", className)}
    >
      <CardHeader>
        <p className="text-sm font-semibold text-muted-foreground uppercase">
          WeChat Mini Program
        </p>
        <CardTitle className="text-2xl">微信小程序介绍</CardTitle>
      </CardHeader>
      <CardContent className="grid flex-1 gap-4 sm:grid-cols-[1fr_160px]">
        <div className="space-y-3 leading-7 text-muted-foreground">
          <p>小程序面向用户展示校园地图与兴趣点、校园历史影像、冷知识等内容</p>
        </div>
        <div className="grid size-40 place-items-center border bg-muted/30 p-6">
          <img
            className="max-h-full max-w-full object-contain"
            src="/mini-program.jpg"
            alt="小程序码"
          />
        </div>
      </CardContent>
      <CardFooter className="border-t bg-muted/30">
        <Button className="w-full rounded-none bg-[#171717] font-mono text-white hover:bg-[#2a2a2a] dark:bg-white dark:text-black dark:hover:bg-white/85">
          查看详情
        </Button>
      </CardFooter>
    </Card>
  )
}
