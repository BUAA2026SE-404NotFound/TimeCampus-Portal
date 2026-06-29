import { apiRequest, apiStreamRequest } from "@/api/request"

export type AgentQuality = {
  grounding: number
  actionSafety: number
  completeness: number
  citationDensity: number
  overall: number
}

export type AgentDraft = {
  task: string
  mode: string
  draft: string
  quality: AgentQuality
  qualityGate: {
    executable: boolean
    minOverall: number
    minActionSafety: number
    reasons: string[]
  }
  contextPack: {
    retrieval: {
      hits: Array<{
        score: number
        document: {
          id: string
          type: string
          title: string
          uri: string
        }
      }>
    }
  }
}

export type PendingAgentAction = {
  name: string
  arguments: Record<string, unknown>
  description: string
  allowedDecisions: Array<"approve" | "reject">
}

export type AgentExecution = {
  threadId: string
  sessionId?: string
  status: "approval_required" | "completed"
  pendingActions: PendingAgentAction[]
  toolEvents: Array<{ type: string; name?: string; content: string }>
  output: string
}

export type AgentSessionSummary = {
  id: string
  title: string
  preview: string
  messageCount: number
  createdAt: string
  updatedAt: string
}

export type AgentSessionMessage = {
  id: string
  role: "user" | "assistant"
  content: string
  createdAt: string
}

export type AgentSession = AgentSessionSummary & {
  messages: AgentSessionMessage[]
}

export type AgentStreamHandlers = {
  onStatus?: (status: { stage: string; message: string }) => void
  onPreflight?: (run: AgentOperationRun) => void
  onDelta?: (content: string) => void
  onResult?: (execution: AgentExecution) => void
  onDone?: (status: string) => void
}

export type AgentOperationRun = {
  status: "blocked" | "approval_required" | "completed"
  preflight: AgentDraft
  execution: AgentExecution | null
}

export type EvalSuite = "all" | "maintenance" | "guide"
export type EvalMode = "fixture" | "live"

export type AgentEvalCase = {
  id: string
  suite: "maintenance" | "guide"
  target: string
  riskLevel: "low" | "medium" | "high"
  tags: string[]
  checks: string[]
}

export type AgentEvalSummary = {
  suite: EvalSuite
  mode: EvalMode
  total: number
  passed: number
  failed: number
  passRate: number
  averageOverall: number
  minPassRate: number
  minOverall: number
  generatedAt: string
  results: Array<{
    caseId: string
    suite: "maintenance" | "guide"
    target: string
    mode: EvalMode
    metrics: Record<string, number>
    overall: number
    passed: boolean
    failureReasons: string[]
    badCaseTags: string[]
    latencyMs?: number
    trace: {
      output: string
      toolCalls: Array<{
        name: string
        arguments: Record<string, unknown>
      }>
      error?: string
    }
  }>
}

export function runAgentOperation(task: string) {
  return apiRequest<AgentOperationRun>("/admin/agent/operations/runs", {
    method: "POST",
    body: {
      task,
      limit: 8,
      types: ["poi", "media", "comment", "guideline"],
      includePending: true,
    },
  })
}

export function decideAgentOperation(
  threadId: string,
  decisions: Array<{ type: "approve" | "reject"; message?: string }>
) {
  return apiRequest<AgentExecution>(
    `/admin/agent/operations/runs/${encodeURIComponent(threadId)}/decisions`,
    {
      method: "POST",
      body: { decisions },
    }
  )
}

export function getAgentSessions() {
  return apiRequest<{ sessions: AgentSessionSummary[] }>(
    "/admin/agent/operations/sessions"
  )
}

export function createAgentSession(title?: string) {
  return apiRequest<AgentSessionSummary>("/admin/agent/operations/sessions", {
    method: "POST",
    body: title ? { title } : {},
  })
}

export function getAgentSession(sessionId: string) {
  return apiRequest<AgentSession>(
    `/admin/agent/operations/sessions/${encodeURIComponent(sessionId)}`
  )
}

export async function streamAgentOperation(
  sessionId: string,
  task: string,
  handlers: AgentStreamHandlers
) {
  const response = await apiStreamRequest(
    `/admin/agent/operations/sessions/${encodeURIComponent(sessionId)}/messages/stream`,
    {
      method: "POST",
      body: {
        task,
        limit: 8,
        types: ["poi", "media", "comment", "guideline"],
        includePending: true,
      },
    }
  )
  await consumeAgentStream(response, handlers)
}

export async function streamAgentDecision(
  threadId: string,
  decisions: Array<{ type: "approve" | "reject"; message?: string }>,
  handlers: AgentStreamHandlers
) {
  const response = await apiStreamRequest(
    `/admin/agent/operations/runs/${encodeURIComponent(threadId)}/decisions/stream`,
    { method: "POST", body: { decisions } }
  )
  await consumeAgentStream(response, handlers)
}

export function getAgentEvalCases(suite: EvalSuite) {
  return apiRequest<{ cases: AgentEvalCase[] }>("/admin/agent/evals/cases", {
    query: { suite },
  })
}

export function runAgentEval(suite: EvalSuite, mode: EvalMode) {
  return apiRequest<AgentEvalSummary>("/admin/agent/evals/runs", {
    method: "POST",
    body: { suite, mode, minPassRate: 0.85, minOverall: 80 },
  })
}

async function consumeAgentStream(
  response: Response,
  handlers: AgentStreamHandlers
) {
  const reader = response.body!.getReader()
  const decoder = new TextDecoder()
  let buffer = ""

  while (true) {
    const { done, value } = await reader.read()
    buffer += decoder.decode(value, { stream: !done }).replace(/\r\n/g, "\n")
    const blocks = buffer.split("\n\n")
    buffer = blocks.pop() ?? ""
    for (const block of blocks) {
      const event = block
        .split("\n")
        .find((line) => line.startsWith("event:"))
        ?.slice(6)
        .trim()
      const data = block
        .split("\n")
        .filter((line) => line.startsWith("data:"))
        .map((line) => line.slice(5).trimStart())
        .join("\n")
      if (!event || !data) continue
      const payload = JSON.parse(data) as Record<string, unknown>
      if (event === "status") {
        handlers.onStatus?.(payload as { stage: string; message: string })
      } else if (event === "preflight") {
        handlers.onPreflight?.({
          status: payload.status as AgentOperationRun["status"],
          preflight: payload.preflight as AgentDraft,
          execution: null,
        })
      } else if (event === "delta") {
        handlers.onDelta?.(String(payload.content ?? ""))
      } else if (event === "result") {
        handlers.onResult?.(payload as unknown as AgentExecution)
      } else if (event === "done") {
        handlers.onDone?.(String(payload.status ?? "completed"))
      } else if (event === "error") {
        throw new Error(String(payload.message ?? "运营智能体流式请求失败"))
      }
    }
    if (done) break
  }
}
