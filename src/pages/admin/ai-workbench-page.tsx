import { useMemo, useState } from "react"
import {
  Bot,
  ClipboardCheck,
  Copy,
  DatabaseZap,
  FileText,
  ListChecks,
  ShieldCheck,
  Sparkles,
} from "lucide-react"
import { toast } from "sonner"

import {
  getAgentDraft,
  type AgentDraftResult,
  type AdminSnapshot,
} from "@/api/admin"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import {
  qualityBand,
  scoreAgentOutput,
  type AgentQualityScore,
} from "@/features/agents/agent-quality"

type MaintenanceHit = {
  id: string
  type: "poi" | "media" | "comment"
  title: string
  excerpt: string
  uri: string
}

type MaintenancePlan = {
  intent: string
  retriever: string
  hits: MaintenanceHit[]
  steps: string[]
  mcpTools: string[]
  quality: AgentQualityScore
}

const DEFAULT_TASK =
  "为主楼新增一段更适合网页展示的介绍文案，并检查是否需要补充影像资料。"

function normalize(value?: string | number) {
  return String(value ?? "").toLowerCase().trim()
}

function terms(value: string) {
  const normalized = normalize(value)
  const result = new Set<string>()

  normalized
    .split(/[^\p{L}\p{N}\p{Script=Han}]+/u)
    .filter(Boolean)
    .forEach((term) => result.add(term))

  for (let index = 0; index < normalized.length; index += 1) {
    const current = normalized[index]
    if (/\p{Script=Han}/u.test(current)) {
      result.add(current)
      const next = normalized[index + 1]
      if (next && /\p{Script=Han}/u.test(next)) {
        result.add(`${current}${next}`)
      }
    }
  }

  return [...result]
}

function scoreText(text: string, queryTerms: string[]) {
  const normalized = normalize(text)
  return queryTerms.reduce(
    (score, term) => score + (normalized.includes(term) ? 1 : 0),
    0
  )
}

function inferIntent(task: string) {
  const text = normalize(task)
  if (text.includes("影像") || text.includes("媒体") || text.includes("照片")) {
    return "media-maintenance"
  }
  if (text.includes("新增") || text.includes("poi") || text.includes("点位")) {
    return "poi-editor"
  }
  if (text.includes("文案") || text.includes("介绍") || text.includes("描述")) {
    return "copy-editor"
  }
  return "admin-maintenance"
}

function buildHits(task: string, snapshot: AdminSnapshot) {
  const queryTerms = terms(task)
  const poiHits = snapshot.pois.map<MaintenanceHit>((poi) => ({
    id: poi.id,
    type: "poi",
    title: poi.name,
    excerpt: `${poi.region} · ${poi.status} · heat ${poi.heat}`,
    uri: `timecampus://poi/${poi.id}`,
  }))
  const mediaHits = snapshot.media.slice(0, 80).map<MaintenanceHit>((media) => ({
    id: media.id,
    type: "media",
    title: `${media.poiName} / ${media.year}`,
    excerpt: media.description,
    uri: `timecampus://media/${media.id}`,
  }))
  const commentHits = snapshot.comments
    .slice(0, 40)
    .map<MaintenanceHit>((comment) => ({
      id: comment.id,
      type: "comment",
      title: comment.poiName,
      excerpt: comment.comment,
      uri: `timecampus://comment/${comment.id}`,
    }))

  return [...poiHits, ...mediaHits, ...commentHits]
    .map((hit) => ({
      hit,
      score:
        scoreText(`${hit.title} ${hit.excerpt} ${hit.uri}`, queryTerms) +
        (hit.type === "poi" ? 2 : 0),
    }))
    .filter((item) => item.score > 0)
    .sort((left, right) => right.score - left.score || left.hit.id.localeCompare(right.hit.id))
    .slice(0, 6)
    .map((item) => item.hit)
}

function buildMaintenancePlan(task: string, snapshot: AdminSnapshot): MaintenancePlan {
  const intent = inferIntent(task)
  const hits = buildHits(task, snapshot)
  const mcpTools =
    intent === "media-maintenance"
      ? [
          "timecampus_rag_context_pack",
          "timecampus_media_import_official",
          "timecampus_media_update_metadata",
        ]
      : intent === "poi-editor"
        ? [
            "timecampus_rag_context_pack",
            "timecampus_poi_create_or_update",
            "timecampus_poi_read",
          ]
        : [
            "timecampus_rag_context_pack",
            "timecampus_copy_edit_poi",
            "timecampus_poi_read",
          ]

  const steps = [
    "读取 RAG context pack 并确认引用资源",
    "调用只读 resource/tool 核对 POI、影像和审核状态",
    intent === "media-maintenance"
      ? "生成影像导入或元数据更新草案"
      : intent === "poi-editor"
        ? "生成 POI 字段变更草案"
        : "生成 description/funFact 文案草案",
    "输出变更摘要、风险项和人工确认点",
  ]

  const quality = scoreAgentOutput({
    citedItems: hits.length,
    plannedActions: steps.length,
    destructiveActions: 0,
    unresolvedRisks: hits.length ? 0 : 2,
    requiredFields: 4,
    completedFields: [task, intent, hits.length, mcpTools.length].filter(Boolean)
      .length,
  })

  return {
    intent,
    retriever: "Spring AI MCP RAG / Qdrant",
    hits,
    steps,
    mcpTools,
    quality,
  }
}

export function AiWorkbenchPage({ snapshot }: { snapshot: AdminSnapshot }) {
  const [task, setTask] = useState(DEFAULT_TASK)
  const [plan, setPlan] = useState(() => buildMaintenancePlan(DEFAULT_TASK, snapshot))
  const [remoteDraft, setRemoteDraft] = useState<AgentDraftResult | null>(
    null
  )
  const [generating, setGenerating] = useState(false)

  const corpusStats = useMemo(
    () => [
      { label: "POI", value: snapshot.pois.length },
      { label: "影像", value: snapshot.media.length },
      { label: "待审投稿", value: snapshot.ugc.length },
      { label: "待审评论", value: snapshot.comments.length },
    ],
    [snapshot]
  )

  const taskBundle = useMemo(
    () => ({
      agent: "timecampus-admin-maintenance",
      task,
      intent: plan.intent,
      retriever: plan.retriever,
      requiredFirstTool: "timecampus_rag_context_pack",
      candidateTools: plan.mcpTools,
      citedResources: plan.hits.map((hit) => hit.uri),
      quality: plan.quality,
      draft: remoteDraft?.draft,
      gates: remoteDraft?.gates,
      humanReview: [
        "删除操作必须二次确认",
        "影像年份、来源和版权不明确时不得自动批准",
        "坐标或地点名称变更需要人工复核",
      ],
    }),
    [plan, remoteDraft, task]
  )

  async function handleGenerate() {
    setGenerating(true)
    try {
      const result = await getAgentDraft({
        task,
        limit: 6,
        includePending: true,
      })
      setRemoteDraft(result)
      const nextPlan = buildMaintenancePlan(task, snapshot)
      setPlan({
        ...nextPlan,
        retriever: `Spring AI MCP RAG / ${result.mode}`,
        hits: result.contextPack.retrieval.hits.map((hit) => ({
          id: hit.document.id,
          type:
            hit.document.type === "media" || hit.document.type === "comment"
              ? hit.document.type
              : "poi",
          title: hit.document.title,
          excerpt: hit.document.text,
          uri: hit.document.uri,
        })),
        quality: result.quality,
      })
      toast.success("已生成后端 agent 草案")
    } catch (error) {
      setRemoteDraft(null)
      setPlan(buildMaintenancePlan(task, snapshot))
      toast.warning(
        error instanceof Error
          ? `后端 RAG 暂不可用：${error.message}`
          : "后端 RAG 暂不可用"
      )
    } finally {
      setGenerating(false)
    }
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(JSON.stringify(taskBundle, null, 2))
    toast.success("任务包已复制")
  }

  return (
    <div className="grid gap-4">
      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <Card className="rounded-none shadow-none">
          <CardHeader>
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div className="grid gap-1.5">
                <CardTitle className="flex items-center gap-2">
                  <Bot />
                  AI 维护台
                </CardTitle>
                <CardDescription>
                  MCP Server · RAG · Qdrant · 后端管理工具
                </CardDescription>
              </div>
              <Badge variant="secondary">
                {qualityBand(plan.quality.overall)} · {plan.quality.overall}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="task" className="gap-4">
              <TabsList className="rounded-none">
                <TabsTrigger value="task">
                  <Sparkles data-icon="inline-start" />
                  任务
                </TabsTrigger>
                <TabsTrigger value="rag">
                  <DatabaseZap data-icon="inline-start" />
                  RAG
                </TabsTrigger>
                <TabsTrigger value="quality">
                  <ClipboardCheck data-icon="inline-start" />
                  质量
                </TabsTrigger>
              </TabsList>
              <TabsContent value="task" className="grid gap-5 lg:grid-cols-[360px_minmax(0,1fr)]">
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="admin-agent-task">维护任务</FieldLabel>
                    <Textarea
                      id="admin-agent-task"
                      className="min-h-36 resize-none rounded-none font-mono"
                      value={task}
                      onChange={(event) => setTask(event.target.value)}
                    />
                    <FieldDescription>
                      当前输出将包装为 MCP agent 任务包。
                    </FieldDescription>
                  </Field>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      className="rounded-none font-mono"
                      disabled={generating}
                      onClick={() => {
                        void handleGenerate()
                      }}
                    >
                      <ListChecks data-icon="inline-start" />
                      {generating ? "生成中" : "生成任务包"}
                    </Button>
                    <Button
                      variant="outline"
                      className="rounded-none font-mono"
                      onClick={() => {
                        void handleCopy()
                      }}
                    >
                      <Copy data-icon="inline-start" />
                      复制 JSON
                    </Button>
                  </div>
                </FieldGroup>

                <div className="grid gap-4">
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Input
                      className="rounded-none font-mono"
                      value={plan.intent}
                      readOnly
                      aria-label="agent intent"
                    />
                    <Input
                      className="rounded-none font-mono"
                      value={plan.retriever}
                      readOnly
                      aria-label="retriever"
                    />
                  </div>
                  <div className="grid gap-3">
                    {plan.steps.map((step, index) => (
                      <div
                        key={step}
                        className="grid gap-3 border bg-muted/20 p-3 sm:grid-cols-[auto_1fr]"
                      >
                        <div className="grid size-9 place-items-center border bg-background">
                          {index + 1}
                        </div>
                        <p className="self-center text-sm leading-6">{step}</p>
                      </div>
                    ))}
                  </div>
                  {remoteDraft ? (
                    <div className="grid gap-2 border bg-muted/20 p-4">
                      <p className="text-xs text-muted-foreground">
                        后端草案 · {remoteDraft.mode}
                      </p>
                      <pre className="whitespace-pre-wrap text-sm leading-6">
                        {remoteDraft.draft}
                      </pre>
                    </div>
                  ) : null}
                </div>
              </TabsContent>

              <TabsContent value="rag" className="grid gap-4">
                <div className="grid gap-3 md:grid-cols-4">
                  {corpusStats.map((item) => (
                    <div key={item.label} className="border bg-muted/20 p-3">
                      <p className="text-xs text-muted-foreground">{item.label}</p>
                      <p className="mt-1 text-2xl font-semibold">{item.value}</p>
                    </div>
                  ))}
                </div>
                <Separator />
                <div className="grid gap-3">
                  {remoteDraft?.contextPack.workflow.map((item) => (
                    <div key={item} className="border bg-muted/20 p-3 text-sm leading-6">
                      {item}
                    </div>
                  ))}
                  {plan.hits.map((hit) => (
                    <div key={`${hit.type}-${hit.id}`} className="grid gap-2 border p-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline">{hit.type}</Badge>
                        <h3 className="font-semibold">{hit.title}</h3>
                      </div>
                      <p className="line-clamp-2 text-sm leading-6 text-muted-foreground">
                        {hit.excerpt}
                      </p>
                      <p className="text-xs text-muted-foreground">{hit.uri}</p>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="quality" className="grid gap-4">
                <div className="grid gap-3 md:grid-cols-4">
                  {[
                    ["引用", plan.quality.grounding],
                    ["安全", plan.quality.actionSafety],
                    ["完整", plan.quality.completeness],
                    ["密度", plan.quality.citationDensity],
                  ].map(([label, value]) => (
                    <div key={label} className="border bg-muted/20 p-3">
                      <p className="text-xs text-muted-foreground">{label}</p>
                      <p className="mt-1 text-2xl font-semibold">{value}</p>
                    </div>
                  ))}
                </div>
                <div className="grid gap-2 border bg-muted/20 p-4 text-sm leading-6 text-muted-foreground">
                  <p>最低执行线：overall ≥ 85，且 actionSafety ≥ 80。</p>
                  <p>低于执行线时，agent 只能生成草案，不应直接写入 MCP 工具。</p>
                  {remoteDraft ? <p>后端模式：{remoteDraft.mode}</p> : null}
                  {remoteDraft?.gates.map((gate) => <p key={gate}>{gate}</p>)}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Card className="rounded-none shadow-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck />
              MCP 工具边界
            </CardTitle>
            <CardDescription>候选工具</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {plan.mcpTools.map((tool) => (
              <Badge key={tool} variant="outline" className="justify-start">
                <FileText data-icon="inline-start" />
                {tool}
              </Badge>
            ))}
            <Separator />
            <div className="grid gap-2 text-sm leading-6 text-muted-foreground">
              <p>先检索，再读取资源，最后写入。</p>
              <p>删除、版权不明、坐标变更保持人工确认。</p>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
