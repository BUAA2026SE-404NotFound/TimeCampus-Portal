import { useEffect, useMemo, useRef, useState } from "react"
import MarkdownRender from "markstream-react"
import {
  Bot,
  Check,
  CircleAlert,
  MessageSquare,
  Plus,
  Send,
  ShieldCheck,
  X,
} from "lucide-react"

import {
  createAgentSession,
  getAgentSession,
  getAgentSessions,
  streamAgentDecision,
  streamAgentOperation,
  type AgentOperationRun,
  type AgentSessionMessage,
  type AgentSessionSummary,
} from "@/api/agent"
import type { AdminProfile } from "@/types/admin"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { FieldError } from "@/components/ui/field"
import { Progress } from "@/components/ui/progress"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

type Decision = "approve" | "reject"
type DisplayMessage = AgentSessionMessage & { streaming?: boolean }

export function AgentOperationsPage({
  role,
  onChanged,
}: {
  role: AdminProfile["role"]
  onChanged: () => void
}) {
  const [sessions, setSessions] = useState<AgentSessionSummary[]>([])
  const [sessionId, setSessionId] = useState("")
  const [messages, setMessages] = useState<DisplayMessage[]>([])
  const [task, setTask] = useState("")
  const [run, setRun] = useState<AgentOperationRun | null>(null)
  const [decisions, setDecisions] = useState<Record<number, Decision>>({})
  const [loading, setLoading] = useState(false)
  const [stage, setStage] = useState("")
  const [error, setError] = useState("")
  const messageListRef = useRef<HTMLDivElement>(null)
  const canRun = role === "ADMIN" || role === "SUPER"
  const execution = run?.execution
  const pendingActions = execution?.pendingActions ?? []
  const allDecided =
    pendingActions.length > 0 &&
    pendingActions.every((_, index) => decisions[index])

  const qualityMetrics = useMemo(() => {
    if (!run) return []
    const quality = run.preflight.quality
    return [
      ["Grounding", quality.grounding],
      ["Action Safety", quality.actionSafety],
      ["Completeness", quality.completeness],
      ["Citation Density", quality.citationDensity],
    ] as const
  }, [run])

  useEffect(() => {
    let cancelled = false
    async function initialize() {
      try {
        const response = await getAgentSessions()
        let items = response.sessions
        if (!items.length) items = [await createAgentSession()]
        if (cancelled) return
        setSessions(items)
        setSessionId(items[0].id)
        const detail = await getAgentSession(items[0].id)
        if (!cancelled) setMessages(detail.messages)
      } catch (requestError) {
        if (!cancelled) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : "会话加载失败"
          )
        }
      }
    }
    void initialize()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const list = messageListRef.current
    if (list) list.scrollTop = list.scrollHeight
  }, [messages])

  async function loadSession(id: string) {
    setSessionId(id)
    setRun(null)
    setDecisions({})
    setError("")
    const detail = await getAgentSession(id)
    setMessages(detail.messages)
  }

  async function refreshSessions() {
    setSessions((await getAgentSessions()).sessions)
  }

  async function newSession() {
    if (loading) return
    try {
      const created = await createAgentSession()
      setSessions((current) => [created, ...current])
      setSessionId(created.id)
      setMessages([])
      setRun(null)
      setDecisions({})
      setError("")
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : "新建会话失败"
      )
    }
  }

  function appendStreamingMessage() {
    const id = `stream-${Date.now()}`
    setMessages((current) => [
      ...current,
      {
        id,
        role: "assistant",
        content: "",
        createdAt: new Date().toISOString(),
        streaming: true,
      },
    ])
    return id
  }

  function appendDelta(id: string, content: string) {
    setMessages((current) =>
      current.map((message) =>
        message.id === id
          ? { ...message, content: message.content + content }
          : message
      )
    )
  }

  async function startRun() {
    const normalizedTask = task.trim()
    if (!normalizedTask || !sessionId) {
      setError("请输入运营任务")
      return
    }
    setLoading(true)
    setStage("正在连接运营智能体")
    setError("")
    setDecisions({})
    setRun(null)
    setTask("")
    setMessages((current) => [
      ...current,
      {
        id: `user-${Date.now()}`,
        role: "user",
        content: normalizedTask,
        createdAt: new Date().toISOString(),
      },
    ])
    const assistantId = appendStreamingMessage()
    try {
      await streamAgentOperation(sessionId, normalizedTask, {
        onStatus: (status) => setStage(status.message),
        onPreflight: (nextRun) => {
          setRun(nextRun)
          if (nextRun.status === "blocked") {
            appendDelta(assistantId, nextRun.preflight.draft)
          }
        },
        onDelta: (content) => {
          setStage("智能体正在生成回答")
          appendDelta(assistantId, content)
        },
        onResult: (nextExecution) => {
          setRun((current) =>
            current
              ? {
                  ...current,
                  status: nextExecution.status,
                  execution: nextExecution,
                }
              : current
          )
          setMessages((current) =>
            current.map((message) =>
              message.id === assistantId
                ? {
                    ...message,
                    content: message.content || nextExecution.output,
                    streaming: false,
                  }
                : message
            )
          )
        },
      })
      await refreshSessions()
      const detail = await getAgentSession(sessionId)
      setMessages(detail.messages)
    } catch (requestError) {
      setMessages((current) =>
        current.filter(
          (message) => message.id !== assistantId || message.content
        )
      )
      setError(
        requestError instanceof Error
          ? requestError.message
          : "运营智能体运行失败"
      )
    } finally {
      setLoading(false)
      setStage("")
    }
  }

  async function submitDecisions() {
    if (!execution || !allDecided) return
    setLoading(true)
    setStage("正在恢复审批任务")
    setError("")
    const assistantId = appendStreamingMessage()
    try {
      await streamAgentDecision(
        execution.threadId,
        pendingActions.map((_, index) => ({
          type: decisions[index],
          message:
            decisions[index] === "reject" ? "管理员拒绝该操作" : undefined,
        })),
        {
          onDelta: (content) => appendDelta(assistantId, content),
          onResult: (nextExecution) => {
            setRun((current) =>
              current
                ? {
                    ...current,
                    status: nextExecution.status,
                    execution: nextExecution,
                  }
                : current
            )
          },
        }
      )
      setDecisions({})
      const detail = await getAgentSession(sessionId)
      setMessages(detail.messages)
      await refreshSessions()
      onChanged()
    } catch (requestError) {
      setMessages((current) =>
        current.filter(
          (message) => message.id !== assistantId || message.content
        )
      )
      setError(
        requestError instanceof Error ? requestError.message : "审批提交失败"
      )
    } finally {
      setLoading(false)
      setStage("")
    }
  }

  return (
    <>
      <Card className="rounded-none shadow-none">
        <CardHeader className="gap-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Bot />
                运营智能体
              </CardTitle>
              <CardDescription className="mt-1">
                会话历史持久保存；写操作仍需逐项审批。
              </CardDescription>
            </div>
            <div className="flex min-w-0 gap-2">
              <Select
                value={sessionId}
                disabled={loading || !sessions.length}
                onValueChange={(value) => void loadSession(value)}
              >
                <SelectTrigger className="w-[min(16rem,60vw)] rounded-none">
                  <MessageSquare />
                  <SelectValue placeholder="选择会话" />
                </SelectTrigger>
                <SelectContent>
                  {sessions.map((session) => (
                    <SelectItem key={session.id} value={session.id}>
                      {session.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="rounded-none"
                disabled={loading}
                title="新建会话"
                aria-label="新建运营会话"
                onClick={() => void newSession()}
              >
                <Plus />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div
            ref={messageListRef}
            className="h-[clamp(420px,58dvh,680px)] overflow-y-auto border bg-muted/10 p-4"
            aria-live="polite"
          >
            {messages.length ? (
              <div className="grid gap-4">
                {messages.map((message) => (
                  <article
                    key={message.id}
                    className={
                      message.role === "user"
                        ? "ml-auto max-w-[85%] border bg-primary p-3 text-primary-foreground"
                        : "mr-auto max-w-[92%] border bg-background p-4"
                    }
                  >
                    <p className="mb-2 text-xs opacity-70">
                      {message.role === "user" ? "管理员" : "TimeCampus Agent"}
                    </p>
                    {message.role === "assistant" ? (
                      message.content ? (
                        <MarkdownRender
                          content={message.content}
                          final={!message.streaming}
                          fade={false}
                          typewriter={Boolean(message.streaming)}
                          renderCodeBlocksAsPre
                        />
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          {stage || "正在处理"}
                        </p>
                      )
                    ) : (
                      <p className="whitespace-pre-wrap text-sm leading-6">
                        {message.content}
                      </p>
                    )}
                  </article>
                ))}
              </div>
            ) : (
              <div className="grid h-full place-items-center text-sm text-muted-foreground">
                在当前会话中提交第一个运营任务
              </div>
            )}
          </div>

          <div className="grid gap-2">
            <Textarea
              id="agent-task"
              value={task}
              rows={4}
              disabled={!canRun || loading || !sessionId}
              aria-invalid={Boolean(error)}
              placeholder="例如：先检索主楼现有资料，再给出文案维护建议"
              onChange={(event) => setTask(event.target.value)}
              onKeyDown={(event) => {
                if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
                  event.preventDefault()
                  void startRun()
                }
              }}
            />
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground">
                {stage || "Ctrl/Command + Enter 发送；删除工具不会提供给智能体"}
              </p>
              <Button
                type="button"
                className="rounded-none"
                disabled={!canRun || loading || !sessionId}
                onClick={() => void startRun()}
              >
                <Send data-icon="inline-start" />
                {loading ? "处理中..." : "发送任务"}
              </Button>
            </div>
            {error ? <FieldError>{error}</FieldError> : null}
            {!canRun ? (
              <p className="text-sm text-muted-foreground">
                当前账号只有读取权限，运行和审批需要 admin 或 super。
              </p>
            ) : null}
          </div>
        </CardContent>
      </Card>

      {run ? (
        <section className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <Card className="rounded-none shadow-none">
              <CardHeader>
                <CardDescription>Overall</CardDescription>
                <CardTitle>{run.preflight.quality.overall}</CardTitle>
              </CardHeader>
              <CardContent>
                <Badge
                  variant={
                    run.preflight.qualityGate.executable
                      ? "default"
                      : "destructive"
                  }
                  className="rounded-none"
                >
                  {run.preflight.qualityGate.executable ? "门禁通过" : "仅草案"}
                </Badge>
              </CardContent>
            </Card>
            {qualityMetrics.map(([label, value]) => (
              <Card key={label} className="rounded-none shadow-none">
                <CardHeader>
                  <CardDescription>{label}</CardDescription>
                  <CardTitle>{value}</CardTitle>
                </CardHeader>
                <CardContent>
                  <Progress value={value} />
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <Card className="rounded-none shadow-none">
              <CardHeader>
                <CardTitle>运营草案</CardTitle>
                <CardDescription>
                  {run.preflight.mode} ·{" "}
                  {run.preflight.qualityGate.reasons.join("；")}
                </CardDescription>
              </CardHeader>
              <CardContent className="max-h-96 overflow-auto border p-4">
                <MarkdownRender
                  content={run.preflight.draft}
                  final
                  fade={false}
                  renderCodeBlocksAsPre
                />
              </CardContent>
            </Card>

            <Card className="rounded-none shadow-none">
              <CardHeader>
                <CardTitle>Grounding 引用</CardTitle>
                <CardDescription>
                  {run.preflight.contextPack.retrieval.hits.length} 条检索结果
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-2">
                {run.preflight.contextPack.retrieval.hits.map((hit) => (
                  <div key={hit.document.id} className="border p-3">
                    <div className="flex items-center justify-between gap-3">
                      <span className="truncate font-semibold">
                        {hit.document.title}
                      </span>
                      <Badge variant="outline" className="rounded-none">
                        {hit.document.type}
                      </Badge>
                    </div>
                    <p className="mt-1 break-all text-xs text-muted-foreground">
                      {hit.document.uri}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {execution?.toolEvents.length ? (
            <Card className="rounded-none shadow-none">
              <CardHeader>
                <CardTitle>工具调用轨迹</CardTitle>
                <CardDescription>
                  按执行顺序展示 MCP 工具返回，便于定位失败链路。
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-2">
                {execution.toolEvents.map((event, index) => (
                  <details key={`${event.name}-${index}`} className="border p-3">
                    <summary className="cursor-pointer font-mono text-sm font-semibold">
                      {index + 1}. {event.name || "tool"}
                    </summary>
                    <pre className="mt-3 max-h-64 overflow-auto whitespace-pre-wrap bg-muted/20 p-3 text-xs">
                      {event.content}
                    </pre>
                  </details>
                ))}
              </CardContent>
            </Card>
          ) : null}

          {run.status === "blocked" ? (
            <Card className="rounded-none border-destructive/40 shadow-none">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CircleAlert />
                  质量门禁未通过
                </CardTitle>
                <CardDescription>
                  当前任务不会进入 MCP 执行阶段，请补充来源或缩小操作范围。
                </CardDescription>
              </CardHeader>
            </Card>
          ) : null}

          {pendingActions.length ? (
            <Card className="rounded-none shadow-none">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheck />
                  待审批操作
                </CardTitle>
                <CardDescription>
                  每项操作都必须选择批准或拒绝，参数不可修改。
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3">
                {pendingActions.map((action, index) => (
                  <div
                    key={`${action.name}-${index}`}
                    className="grid gap-3 border p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <code className="break-all font-semibold">
                        {action.name}
                      </code>
                      <Badge variant="outline" className="rounded-none">
                        操作 {index + 1}
                      </Badge>
                    </div>
                    <pre className="max-h-64 overflow-auto whitespace-pre-wrap bg-muted/30 p-3 text-xs">
                      {JSON.stringify(action.arguments, null, 2)}
                    </pre>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant={
                          decisions[index] === "approve" ? "default" : "outline"
                        }
                        className="rounded-none"
                        onClick={() =>
                          setDecisions((current) => ({
                            ...current,
                            [index]: "approve",
                          }))
                        }
                      >
                        <Check data-icon="inline-start" />
                        批准
                      </Button>
                      <Button
                        type="button"
                        variant={
                          decisions[index] === "reject"
                            ? "destructive"
                            : "outline"
                        }
                        className="rounded-none"
                        onClick={() =>
                          setDecisions((current) => ({
                            ...current,
                            [index]: "reject",
                          }))
                        }
                      >
                        <X data-icon="inline-start" />
                        拒绝
                      </Button>
                    </div>
                  </div>
                ))}
                <Button
                  type="button"
                  className="w-fit rounded-none"
                  disabled={!allDecided || loading}
                  onClick={() => void submitDecisions()}
                >
                  <ShieldCheck data-icon="inline-start" />
                  提交审批
                </Button>
              </CardContent>
            </Card>
          ) : null}
        </section>
      ) : null}
    </>
  )
}
