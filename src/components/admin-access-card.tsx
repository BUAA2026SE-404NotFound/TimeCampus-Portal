import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export function AdminAccessCard() {
  return (
    <Card
      id="admin-access"
      className="h-full scroll-mt-6 rounded-none bg-white font-mono shadow-none"
    >
      <CardHeader>
        <p className="text-sm font-semibold text-muted-foreground uppercase">
          Admin Access
        </p>
        <CardTitle className="text-2xl">管理员入口</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 space-y-3 leading-7 text-muted-foreground">
        <p>管理员可登录后台处理 POI、内容导入、审核和审计日志。</p>
        <p>注册能力用于内部测试账号，后续接入真实鉴权接口。</p>
      </CardContent>
      <CardFooter className="grid grid-cols-2 gap-2 border-t bg-muted/30">
        <Button className="rounded-none bg-[#171717] font-mono text-white hover:bg-[#2a2a2a]">
          登录
        </Button>
        <Button
          className="rounded-none border-[#171717] bg-white font-mono text-black hover:bg-[#f2f2f2]"
          variant="outline"
        >
          注册
        </Button>
      </CardFooter>
    </Card>
  )
}
