import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export function AdminConsoleCard() {
  return (
    <Card
      id="admin-console"
      className="h-full scroll-mt-6 rounded-none bg-card font-mono shadow-none"
    >
      <CardHeader>
        <p className="text-sm font-semibold text-muted-foreground uppercase">
          Admin Console
        </p>
        <CardTitle className="text-2xl">管理员入口</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 space-y-3 leading-7 text-muted-foreground">
        <p>管理员可登录后台处理反馈、进行内容审核与内容管理</p>
      </CardContent>
      <CardFooter className="grid grid-cols-2 gap-2 border-t bg-muted/30">
        <Button className="rounded-none bg-[#171717] font-mono text-white hover:bg-[#2a2a2a] dark:bg-white dark:text-black dark:hover:bg-white/85">
          登录
        </Button>
        <Button
          className="rounded-none border-[#171717] bg-white font-mono text-black hover:bg-[#f2f2f2] dark:border-white dark:bg-transparent dark:text-white dark:hover:bg-white/10"
          variant="outline"
        >
          注册
        </Button>
      </CardFooter>
    </Card>
  )
}
