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

export function ProductIdentityCard({ className }: ProductIdentityCardProps) {
  return (
    <Card className={cn("h-full rounded-none bg-white font-mono shadow-none", className)}>
      <CardHeader>
        <p className="text-sm font-semibold text-muted-foreground uppercase">
          Product Logo
        </p>
        <CardTitle className="text-2xl">产品标识与定位</CardTitle>
      </CardHeader>
      <CardContent className="grid flex-1 gap-4 sm:grid-cols-[160px_1fr]">
        <div className="grid aspect-square place-items-center border bg-muted/30 p-6">
          <img
            className="max-h-full max-w-full object-contain"
            src="/logo.png"
            alt="时光航迹 Logo"
          />
        </div>
        <div className="space-y-3 leading-7 text-muted-foreground">
          <p>时光航迹用于串联校园地点、历史时间线和用户共创内容。</p>
          <p>
            这里预留品牌图、产品截图或运营主视觉位置，后续可直接替换为图片资源。
          </p>
        </div>
      </CardContent>
      <CardFooter className="border-t bg-muted/30">
        <Button className="w-full rounded-none bg-[#171717] font-mono text-white hover:bg-[#2a2a2a]">
          查看详情
        </Button>
      </CardFooter>
    </Card>
  )
}
