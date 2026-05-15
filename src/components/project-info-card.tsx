import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type ProductIdentityCardProps = {
  className?: string
}

export function ProjectInfoCard({ className }: ProductIdentityCardProps) {
  return (
    <Card
      id="project-info"
      className={cn("h-full scroll-mt-6 rounded-none bg-card font-mono shadow-none", className)}
    >
      <CardHeader>
        <p className="text-sm font-semibold text-muted-foreground uppercase">
          Product Info
        </p>
        <CardTitle className="text-2xl">项目信息</CardTitle>
      </CardHeader>
      <CardContent className="grid flex-1 gap-4 sm:grid-cols-[160px_1fr]">
        <div className="grid size-40 place-items-center border bg-muted/30 p-6">
          <img
            className="max-h-full max-w-full object-contain"
            src="/project-logo.png"
            alt="时光航迹 Logo"
          />
        </div>
        <div className="space-y-3 leading-7 text-muted-foreground">
          <p>时光航迹是一款基于微信小程序的时光机地图应用
          </p>
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
