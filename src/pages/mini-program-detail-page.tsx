import {
  ArrowLeft,
  Camera,
  Map,
  MessageSquareText,
  ScanLine,
  Search,
} from "lucide-react"

import miniProgramImage from "@/assets/mini-program.jpg"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const usageSteps = [
  {
    title: "打开小程序",
    icon: ScanLine,
    description: "使用微信扫描小程序码，或在微信内搜索“时光航迹”进入服务。",
  },
  {
    title: "浏览校园地图",
    icon: Map,
    description:
      "地图页面展示校园兴趣点，点击地点可查看名称、位置、年代与说明。",
  },
  {
    title: "查看历史影像",
    icon: Camera,
    description: "在 POI 详情中切换到影像内容，查看该地点不同时期的图片资料。",
  },
  {
    title: "搜索与筛选",
    icon: Search,
    description: "通过地点名称、建筑编号或关键词快速定位目标内容。",
  },
  {
    title: "笔记与备忘录",
    icon: MessageSquareText,
    description:
      "因为微信小程序不搞企业认证根本不让用户分享信息，所以把评论和图片上传改为了笔记和备忘录🐵",
  },
]

export function MiniProgramDetailPage({ onBack }: { onBack: () => void }) {
  return (
    <div className="flex min-h-svh flex-col bg-background text-foreground">
      <SiteHeader showNav={false} />
      <main className="flex-1 px-4 py-6 sm:px-6">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
          <header className="grid gap-6 border bg-card p-6 font-mono lg:grid-cols-[1fr_220px]">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <p className="text-sm font-semibold text-muted-foreground uppercase">
                  WeChat Mini Program
                </p>
                <h1 className="text-3xl font-semibold">微信小程序使用说明</h1>
                <p className="max-w-3xl leading-7 text-muted-foreground">
                  小程序面向普通用户展示校园地图、兴趣点、历史影像与投稿反馈入口，是时光航迹的主要访问端。
                </p>
              </div>
              <Button className="w-fit rounded-none font-mono" onClick={onBack}>
                <ArrowLeft data-icon="inline-start" />
                返回主页
              </Button>
            </div>
            <div className="grid place-items-center border bg-muted/30 p-6">
              <img
                src={miniProgramImage}
                alt="时光航迹微信小程序码"
                className="max-h-52 max-w-full object-contain"
                loading="lazy"
                decoding="async"
              />
            </div>
          </header>

          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {usageSteps.map((step) => {
              const Icon = step.icon

              return (
                <Card
                  key={step.title}
                  className="rounded-none bg-card font-mono shadow-none"
                >
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <Icon data-icon="inline-start" />
                      {step.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="leading-7 text-muted-foreground">
                    {step.description}
                  </CardContent>
                </Card>
              )
            })}
          </section>

          <section className="grid gap-4 lg:grid-cols-2">
            <Card className="rounded-none bg-card font-mono shadow-none">
              <CardHeader>
                <CardTitle>面向用户</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3 leading-7 text-muted-foreground">
                <p>查看校园地点、历史图片、冷知识与运营发布内容。</p>
                <p>围绕地图探索校园，不需要进入管理端即可使用。</p>
              </CardContent>
            </Card>
            <Card className="rounded-none bg-card font-mono shadow-none">
              <CardHeader>
                <CardTitle>面向运营</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3 leading-7 text-muted-foreground">
                <p>用户投稿进入后台审核流，审核通过后才对外展示。</p>
                <p>管理员在 admin.timecampus.asia 管理 POI、图片和评论内容。</p>
              </CardContent>
            </Card>
          </section>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
